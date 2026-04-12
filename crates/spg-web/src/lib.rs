pub mod galaxy;
pub mod models;
pub mod secret_store;
pub mod store;
pub mod ui;
pub mod ui_v2;

use crate::galaxy::{GalaxyService, core_db_path};
use crate::models::{
    GalaxyFocusView, GalaxyListResponse, GalaxyPageView, ProviderKind, ProviderUpdateRequest,
    SetupPageView,
};
use crate::secret_store::{HybridSecretStore, SecretStore};
use crate::store::{ProviderStore, provider_db_path};
use crate::ui_v2::{render_galaxy_page, render_setup_page};
use anyhow::{Context, Result};
use axum::extract::{Path as RoutePath, Query, State};
use axum::http::StatusCode;
use axum::response::{Html, IntoResponse, Redirect, Response};
use axum::routing::{get, post, put};
use axum::{Json, Router};
use serde::Deserialize;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::net::TcpListener;
use tower_http::services::ServeDir;

#[derive(Clone)]
pub struct AppState {
    provider_store: ProviderStore,
    galaxy_service: GalaxyService,
}

impl AppState {
    pub fn new(
        provider_db: PathBuf,
        core_db: PathBuf,
        secret_store: Arc<dyn SecretStore>,
    ) -> Result<Self> {
        let provider_store = ProviderStore::new(provider_db, secret_store);
        provider_store.initialize()?;

        Ok(Self {
            provider_store,
            galaxy_service: GalaxyService::new(core_db),
        })
    }
}

pub fn build_app(state: AppState) -> Router {
    Router::new()
        .route("/", get(root_redirect))
        .route("/setup/providers", get(setup_page))
        .route("/settings/providers", get(settings_page))
        .route("/galaxy", get(galaxy_page))
        .route("/api/providers", get(list_providers))
        .route("/api/providers/test-all", post(test_all_providers))
        .route("/api/providers/{provider}/test", post(test_provider))
        .route("/api/providers/{provider}", put(update_provider))
        .route("/api/unlock-state", get(unlock_state))
        .route("/api/galaxy/list", get(galaxy_list))
        .route("/api/galaxy/focus/game/{id}", get(galaxy_focus_game))
        .route("/api/galaxy/focus/event/{id}", get(galaxy_focus_event))
        .route("/api/galaxy/summary", get(galaxy_summary))
        .nest_service("/assets", ServeDir::new(asset_dir()))
        .with_state(state)
}

pub async fn run() -> Result<()> {
    let workspace_root = workspace_root()?;
    let state = AppState::new(
        provider_db_path(&workspace_root),
        core_db_path(&workspace_root),
        Arc::new(HybridSecretStore::new(&workspace_root)),
    )?;

    let listener = TcpListener::bind("127.0.0.1:3000")
        .await
        .context("failed to bind to 127.0.0.1:3000")?;
    println!("SPG v3 web app listening on http://127.0.0.1:3000");
    axum::serve(listener, build_app(state))
        .await
        .context("axum server stopped unexpectedly")?;
    Ok(())
}

async fn root_redirect() -> Redirect {
    Redirect::temporary("/setup/providers")
}

async fn setup_page(State(state): State<AppState>) -> Response {
    match build_setup_page(&state, "setup").map(render_setup_page) {
        Ok(markup) => Html(markup).into_response(),
        Err(error) => internal_error(error),
    }
}

async fn settings_page(State(state): State<AppState>) -> Response {
    match build_setup_page(&state, "settings").map(render_setup_page) {
        Ok(markup) => Html(markup).into_response(),
        Err(error) => internal_error(error),
    }
}

async fn galaxy_page(State(state): State<AppState>) -> Response {
    match state.provider_store.unlock_state() {
        Ok(unlock_state) if unlock_state.unlocked => {
            match build_galaxy_page(&state, unlock_state) {
                Ok(page) => Html(render_galaxy_page(page)).into_response(),
                Err(error) => internal_error(error),
            }
        }
        Ok(_) => Redirect::temporary("/setup/providers").into_response(),
        Err(error) => internal_error(error),
    }
}

async fn list_providers(State(state): State<AppState>) -> Response {
    match state.provider_store.list_provider_views() {
        Ok(providers) => Json(providers).into_response(),
        Err(error) => internal_error(error),
    }
}

async fn update_provider(
    State(state): State<AppState>,
    RoutePath(provider): RoutePath<String>,
    Json(request): Json<ProviderUpdateRequest>,
) -> Response {
    let provider = match provider.parse::<ProviderKind>() {
        Ok(provider) => provider,
        Err(error) => return bad_request(error),
    };

    match state.provider_store.save_provider(provider, request) {
        Ok(view) => Json(view).into_response(),
        Err(error) => internal_error(error),
    }
}

async fn test_provider(
    State(state): State<AppState>,
    RoutePath(provider): RoutePath<String>,
) -> Response {
    let provider = match provider.parse::<ProviderKind>() {
        Ok(provider) => provider,
        Err(error) => return bad_request(error),
    };

    match state.provider_store.test_provider(provider) {
        Ok(result) => Json(result).into_response(),
        Err(error) => internal_error(error),
    }
}

async fn test_all_providers(State(state): State<AppState>) -> Response {
    match state.provider_store.test_all() {
        Ok(results) => Json(results).into_response(),
        Err(error) => internal_error(error),
    }
}

async fn unlock_state(State(state): State<AppState>) -> Response {
    match state.provider_store.unlock_state() {
        Ok(result) => Json(result).into_response(),
        Err(error) => internal_error(error),
    }
}

#[derive(Debug, Deserialize)]
struct GalaxyListQuery {
    tab: Option<String>,
}

async fn galaxy_list(
    State(state): State<AppState>,
    Query(query): Query<GalaxyListQuery>,
) -> Response {
    let tab = query.tab.unwrap_or_else(|| "games".to_string());
    match state.galaxy_service.list(&tab) {
        Ok(result) => Json(result).into_response(),
        Err(error) => internal_error(error),
    }
}

async fn galaxy_focus_game(
    State(state): State<AppState>,
    RoutePath(id): RoutePath<String>,
) -> Response {
    match state.galaxy_service.focus_game(&id) {
        Ok(Some(result)) => Json(result).into_response(),
        Ok(None) => not_found("unknown game focus"),
        Err(error) => internal_error(error),
    }
}

async fn galaxy_focus_event(
    State(state): State<AppState>,
    RoutePath(id): RoutePath<String>,
) -> Response {
    match state.galaxy_service.focus_event(&id) {
        Ok(Some(result)) => Json(result).into_response(),
        Ok(None) => not_found("unknown event focus"),
        Err(error) => internal_error(error),
    }
}

async fn galaxy_summary(State(state): State<AppState>) -> Response {
    match state.galaxy_service.summary() {
        Ok(result) => Json(result).into_response(),
        Err(error) => internal_error(error),
    }
}

fn build_setup_page(state: &AppState, mode: &str) -> Result<SetupPageView> {
    Ok(SetupPageView {
        mode: mode.to_string(),
        providers: state.provider_store.list_provider_views()?,
        unlock_state: state.provider_store.unlock_state()?,
    })
}

fn build_galaxy_page(
    state: &AppState,
    unlock_state: crate::models::UnlockStateView,
) -> Result<GalaxyPageView> {
    let list = state.galaxy_service.list("games")?;
    let initial_focus = match first_game_focus(&state.galaxy_service, &list)? {
        Some(focus) => focus,
        None => empty_focus(),
    };

    Ok(GalaxyPageView {
        summary: state.galaxy_service.summary()?,
        default_tab: "games".to_string(),
        games: list.games,
        initial_focus,
        unlock_state,
    })
}

fn first_game_focus(
    galaxy_service: &GalaxyService,
    list: &GalaxyListResponse,
) -> Result<Option<GalaxyFocusView>> {
    let Some(game) = list.games.first() else {
        return Ok(None);
    };
    galaxy_service.focus_game(&game.id)
}

fn empty_focus() -> GalaxyFocusView {
    GalaxyFocusView {
        focus_id: "empty".to_string(),
        focus_kind: "game".to_string(),
        title: "等待星图数据".to_string(),
        subtitle: "当前还没有可用的 SLG 焦点。".to_string(),
        narrative: vec![
            "先完成 Provider 配置并接入真实信号。".to_string(),
            "随后左侧列表会自动替换成实际的游戏与事件。".to_string(),
        ],
        nodes: Vec::new(),
        edges: Vec::new(),
        available_layers: vec![
            "games".to_string(),
            "events".to_string(),
            "sources".to_string(),
        ],
    }
}

fn workspace_root() -> Result<PathBuf> {
    let candidate = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("..");
    match candidate.canonicalize() {
        Ok(path) => Ok(path),
        Err(_) => Ok(candidate),
    }
}

fn asset_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("assets")
}

fn internal_error(error: anyhow::Error) -> Response {
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        format!("internal server error: {error:#}"),
    )
        .into_response()
}

fn bad_request(message: String) -> Response {
    (StatusCode::BAD_REQUEST, message).into_response()
}

fn not_found(message: &str) -> Response {
    (StatusCode::NOT_FOUND, message.to_string()).into_response()
}
