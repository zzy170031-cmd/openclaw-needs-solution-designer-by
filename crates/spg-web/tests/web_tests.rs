use axum::body::Body;
use http::{Request, StatusCode};
use http_body_util::BodyExt;
use rusqlite::Connection;
use spg_web::AppState;
use spg_web::build_app;
use spg_web::models::{ProviderKind, ProviderUpdateRequest};
use spg_web::secret_store::{MemorySecretStore, SecretStore};
use spg_web::store::ProviderStore;
use std::fs;
use std::sync::Arc;
use tempfile::tempdir;
use tower::ServiceExt;

#[tokio::test]
async fn locked_galaxy_redirects_to_setup() {
    let temp = tempdir().expect("temp dir");
    let app = build_app(
        AppState::new(
            temp.path().join("providers.db"),
            temp.path().join("core.db"),
            Arc::new(MemorySecretStore::new()),
        )
        .expect("state"),
    );

    let response = app
        .oneshot(
            Request::builder()
                .uri("/galaxy")
                .body(Body::empty())
                .expect("request"),
        )
        .await
        .expect("response");

    assert_eq!(response.status(), StatusCode::TEMPORARY_REDIRECT);
    assert_eq!(
        response.headers().get("location").expect("location"),
        "/setup/providers"
    );
}

#[tokio::test]
async fn setup_page_renders_provider_shell() {
    let temp = tempdir().expect("temp dir");
    let app = build_app(
        AppState::new(
            temp.path().join("providers.db"),
            temp.path().join("core.db"),
            Arc::new(MemorySecretStore::new()),
        )
        .expect("state"),
    );

    let response = app
        .oneshot(
            Request::builder()
                .uri("/setup/providers")
                .body(Body::empty())
                .expect("request"),
        )
        .await
        .expect("response");

    assert_eq!(response.status(), StatusCode::OK);
    let body = response
        .into_body()
        .collect()
        .await
        .expect("body")
        .to_bytes();
    let html = String::from_utf8(body.to_vec()).expect("utf8");
    assert!(html.contains("Provider Access"));
    assert!(html.contains("统一授权与调度配置"));
}

#[test]
fn provider_settings_do_not_store_plaintext_api_keys() {
    let temp = tempdir().expect("temp dir");
    let db_path = temp.path().join("providers.db");
    let store = ProviderStore::new(db_path.clone(), Arc::new(MemorySecretStore::new()));
    store.initialize().expect("initialize");

    let secret = "secret-inline-token";
    store
        .save_provider(
            ProviderKind::Doubao,
            provider_request(ProviderKind::Doubao, Some(secret)),
        )
        .expect("save provider");

    let conn = Connection::open(&db_path).expect("open db");
    let mut statement = conn
        .prepare("PRAGMA table_info(provider_settings)")
        .expect("pragma");
    let columns = statement
        .query_map([], |row| row.get::<_, String>(1))
        .expect("columns")
        .collect::<std::result::Result<Vec<_>, _>>()
        .expect("collect columns");

    assert!(!columns.iter().any(|column| column == "api_key"));

    let bytes = fs::read(&db_path).expect("read db");
    assert!(!String::from_utf8_lossy(&bytes).contains(secret));
}

#[test]
fn provider_tests_cover_timeout_and_failure_paths() {
    let temp = tempdir().expect("temp dir");
    let store = ProviderStore::new(
        temp.path().join("providers.db"),
        Arc::new(MemorySecretStore::new()),
    );
    store.initialize().expect("initialize");

    store
        .save_provider(
            ProviderKind::Serper,
            provider_request(ProviderKind::Serper, Some("timeout-token")),
        )
        .expect("save timeout provider");
    let timeout = store
        .test_provider(ProviderKind::Serper)
        .expect("test timeout provider");
    assert!(!timeout.ok);
    assert_eq!(timeout.status, "timeout");

    store
        .save_provider(
            ProviderKind::Firecrawl,
            provider_request(ProviderKind::Firecrawl, Some("fail-token")),
        )
        .expect("save failed provider");
    let failed = store
        .test_provider(ProviderKind::Firecrawl)
        .expect("test failed provider");
    assert!(!failed.ok);
    assert_eq!(failed.status, "failed");
}

#[test]
fn unlock_requires_all_six_providers_and_relocks_if_secret_disappears() {
    let temp = tempdir().expect("temp dir");
    let secrets = Arc::new(MemorySecretStore::new());
    let store = ProviderStore::new(temp.path().join("providers.db"), secrets.clone());
    store.initialize().expect("initialize");

    for provider in ProviderKind::ALL {
        store
            .save_provider(
                provider,
                provider_request(provider, Some(&format!("{}-ok-key", provider.slug()))),
            )
            .expect("save provider");
    }

    store.test_all().expect("test all");
    let unlocked = store.unlock_state().expect("unlock state");
    assert!(unlocked.unlocked);
    assert_eq!(unlocked.ready_count, 6);

    secrets
        .delete_secret("provider::doubao")
        .expect("delete secret");
    let relocked = store.unlock_state().expect("unlock state after delete");
    assert!(!relocked.unlocked);
    assert_eq!(relocked.ready_count, 5);
}

fn provider_request(provider: ProviderKind, api_key: Option<&str>) -> ProviderUpdateRequest {
    ProviderUpdateRequest {
        enabled: true,
        api_key: api_key.map(ToOwned::to_owned),
        base_url: provider.default_base_url().to_string(),
        monthly_limit: provider.monthly_limit(),
        daily_soft_limit: provider.daily_soft_limit(),
        default_role: provider.default_role().to_string(),
        priority: provider.priority(),
    }
}
