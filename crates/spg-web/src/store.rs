use crate::models::{
    ProviderKind, ProviderStatusView, ProviderTestResponse, ProviderUpdateRequest, QuotaSnapshot,
    UnlockStateView,
};
use crate::secret_store::SecretStore;
use anyhow::{Context, Result};
use rusqlite::{Connection, OptionalExtension, params};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use time::OffsetDateTime;
use time::format_description::well_known::Rfc3339;

#[derive(Clone)]
pub struct ProviderStore {
    db_path: PathBuf,
    secret_store: Arc<dyn SecretStore>,
}

impl ProviderStore {
    pub fn new(db_path: PathBuf, secret_store: Arc<dyn SecretStore>) -> Self {
        Self {
            db_path,
            secret_store,
        }
    }

    pub fn initialize(&self) -> Result<()> {
        if let Some(parent) = self.db_path.parent() {
            fs::create_dir_all(parent)
                .with_context(|| format!("failed to create {}", parent.display()))?;
        }
        let conn = self.connect()?;
        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS provider_settings (
                provider TEXT PRIMARY KEY,
                enabled INTEGER NOT NULL,
                base_url TEXT NOT NULL,
                monthly_limit INTEGER NOT NULL,
                daily_soft_limit INTEGER NOT NULL,
                default_role TEXT NOT NULL,
                priority INTEGER NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS provider_test_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                provider TEXT NOT NULL,
                ok INTEGER NOT NULL,
                status TEXT NOT NULL,
                latency_ms INTEGER NOT NULL,
                error_message TEXT,
                verified_at TEXT NOT NULL,
                detail_json TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS provider_quota_ledger (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                provider TEXT NOT NULL,
                used_monthly INTEGER NOT NULL,
                remaining_monthly INTEGER NOT NULL,
                daily_soft_limit INTEGER NOT NULL,
                monthly_limit INTEGER NOT NULL,
                captured_at TEXT NOT NULL,
                snapshot_json TEXT NOT NULL
            );
            ",
        )?;

        for provider in ProviderKind::ALL {
            conn.execute(
                "
                INSERT OR IGNORE INTO provider_settings(
                    provider, enabled, base_url, monthly_limit, daily_soft_limit,
                    default_role, priority, updated_at
                ) VALUES (?1, 1, ?2, ?3, ?4, ?5, ?6, ?7)
                ",
                params![
                    provider.slug(),
                    provider.default_base_url(),
                    provider.monthly_limit(),
                    provider.daily_soft_limit(),
                    provider.default_role(),
                    provider.priority(),
                    utc_now(),
                ],
            )?;
        }
        Ok(())
    }

    pub fn list_provider_views(&self) -> Result<Vec<ProviderStatusView>> {
        let conn = self.connect()?;
        let mut views = Vec::new();
        for provider in ProviderKind::ALL {
            views.push(self.build_provider_view(&conn, provider)?);
        }
        Ok(views)
    }

    pub fn save_provider(
        &self,
        provider: ProviderKind,
        request: ProviderUpdateRequest,
    ) -> Result<ProviderStatusView> {
        let conn = self.connect()?;
        conn.execute(
            "
            INSERT INTO provider_settings(
                provider, enabled, base_url, monthly_limit, daily_soft_limit,
                default_role, priority, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
            ON CONFLICT(provider) DO UPDATE SET
                enabled = excluded.enabled,
                base_url = excluded.base_url,
                monthly_limit = excluded.monthly_limit,
                daily_soft_limit = excluded.daily_soft_limit,
                default_role = excluded.default_role,
                priority = excluded.priority,
                updated_at = excluded.updated_at
            ",
            params![
                provider.slug(),
                bool_to_int(request.enabled),
                request.base_url.trim(),
                request.monthly_limit,
                request.daily_soft_limit,
                request.default_role.trim(),
                request.priority,
                utc_now(),
            ],
        )?;

        if let Some(api_key) = request.api_key {
            if api_key.trim().is_empty() {
                self.secret_store.delete_secret(&secret_key(provider))?;
            } else {
                self.secret_store
                    .set_secret(&secret_key(provider), api_key.trim())?;
            }
        }

        self.build_provider_view(&conn, provider)
    }

    pub fn test_provider(&self, provider: ProviderKind) -> Result<ProviderTestResponse> {
        let conn = self.connect()?;
        let settings = self
            .raw_settings(&conn, provider)?
            .unwrap_or_else(|| default_settings(provider));
        let secret = self.secret_store.get_secret(&secret_key(provider))?;
        let response = simulate_test(provider, &settings, secret.as_deref());

        conn.execute(
            "
            INSERT INTO provider_test_logs(
                provider, ok, status, latency_ms, error_message, verified_at, detail_json
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
            ",
            params![
                provider.slug(),
                bool_to_int(response.ok),
                &response.status,
                response.latency_ms,
                response.error_message.as_deref(),
                &response.verified_at,
                serde_json::to_string(&response)?,
            ],
        )?;

        conn.execute(
            "
            INSERT INTO provider_quota_ledger(
                provider, used_monthly, remaining_monthly, daily_soft_limit,
                monthly_limit, captured_at, snapshot_json
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
            ",
            params![
                provider.slug(),
                response.quota_snapshot.used_monthly,
                response.quota_snapshot.remaining_monthly,
                response.quota_snapshot.daily_soft_limit,
                response.quota_snapshot.monthly_limit,
                &response.verified_at,
                serde_json::to_string(&response.quota_snapshot)?,
            ],
        )?;

        Ok(response)
    }

    pub fn test_all(&self) -> Result<Vec<ProviderTestResponse>> {
        ProviderKind::ALL
            .into_iter()
            .map(|provider| self.test_provider(provider))
            .collect()
    }

    pub fn unlock_state(&self) -> Result<UnlockStateView> {
        let views = self.list_provider_views()?;
        Ok(compute_unlock_state(&views))
    }

    pub fn secret_exists(&self, provider: ProviderKind) -> Result<bool> {
        Ok(self
            .secret_store
            .get_secret(&secret_key(provider))?
            .unwrap_or_default()
            .trim()
            .is_empty()
            .not())
    }

    fn build_provider_view(
        &self,
        conn: &Connection,
        provider: ProviderKind,
    ) -> Result<ProviderStatusView> {
        let settings = self
            .raw_settings(conn, provider)?
            .unwrap_or_else(|| default_settings(provider));
        let secret = self.secret_store.get_secret(&secret_key(provider))?;
        let latest = latest_test(conn, provider)?;
        let status = latest
            .as_ref()
            .map(|record| record.status.clone())
            .unwrap_or_else(|| {
                if secret.as_deref().unwrap_or_default().is_empty() {
                    "awaiting_configuration".to_string()
                } else {
                    "configured".to_string()
                }
            });
        let latency_ms = latest.as_ref().map(|record| record.latency_ms);
        let last_verified_at = latest.as_ref().map(|record| record.verified_at.clone());
        let last_error = latest.and_then(|record| record.error_message);

        Ok(ProviderStatusView {
            provider: provider.slug().to_string(),
            display_name: provider.display_name().to_string(),
            description: provider.description().to_string(),
            enabled: settings.enabled,
            api_key: secret
                .as_deref()
                .map(mask_secret)
                .unwrap_or_else(String::new),
            base_url: settings.base_url,
            monthly_limit: settings.monthly_limit,
            daily_soft_limit: settings.daily_soft_limit,
            default_role: settings.default_role,
            priority: settings.priority,
            status,
            last_verified_at,
            last_error,
            latency_ms,
        })
    }

    fn raw_settings(
        &self,
        conn: &Connection,
        provider: ProviderKind,
    ) -> Result<Option<StoredSettings>> {
        conn.query_row(
            "
            SELECT enabled, base_url, monthly_limit, daily_soft_limit, default_role, priority
            FROM provider_settings
            WHERE provider = ?1
            ",
            [provider.slug()],
            |row| {
                Ok(StoredSettings {
                    enabled: row.get::<_, i64>(0)? == 1,
                    base_url: row.get(1)?,
                    monthly_limit: row.get(2)?,
                    daily_soft_limit: row.get(3)?,
                    default_role: row.get(4)?,
                    priority: row.get(5)?,
                })
            },
        )
        .optional()
        .context("failed to load provider settings")
    }

    fn connect(&self) -> Result<Connection> {
        let conn = Connection::open(&self.db_path)
            .with_context(|| format!("failed to open {}", self.db_path.display()))?;
        conn.busy_timeout(std::time::Duration::from_secs(5))?;
        Ok(conn)
    }
}

#[derive(Debug, Clone)]
struct StoredSettings {
    enabled: bool,
    base_url: String,
    monthly_limit: i64,
    daily_soft_limit: i64,
    default_role: String,
    priority: i64,
}

#[derive(Debug, Clone)]
struct LatestTestRecord {
    status: String,
    latency_ms: i64,
    error_message: Option<String>,
    verified_at: String,
}

fn latest_test(conn: &Connection, provider: ProviderKind) -> Result<Option<LatestTestRecord>> {
    conn.query_row(
        "
        SELECT status, latency_ms, error_message, verified_at
        FROM provider_test_logs
        WHERE provider = ?1
        ORDER BY id DESC
        LIMIT 1
        ",
        [provider.slug()],
        |row| {
            Ok(LatestTestRecord {
                status: row.get(0)?,
                latency_ms: row.get(1)?,
                error_message: row.get(2)?,
                verified_at: row.get(3)?,
            })
        },
    )
    .optional()
    .context("failed to load latest provider test")
}

fn default_settings(provider: ProviderKind) -> StoredSettings {
    StoredSettings {
        enabled: true,
        base_url: provider.default_base_url().to_string(),
        monthly_limit: provider.monthly_limit(),
        daily_soft_limit: provider.daily_soft_limit(),
        default_role: provider.default_role().to_string(),
        priority: provider.priority(),
    }
}

fn compute_unlock_state(views: &[ProviderStatusView]) -> UnlockStateView {
    let ready_count = views.iter().filter(|view| is_ready(view)).count();
    let blockers = views
        .iter()
        .filter(|view| !is_ready(view))
        .map(|view| {
            if !view.enabled {
                format!("{} 已暂停，主系统保持锁定。", view.display_name)
            } else if view.api_key.is_empty() {
                format!("{} 尚未录入 API Key。", view.display_name)
            } else if view.status != "ready" {
                format!("{} 最近一次测试状态为 {}。", view.display_name, view.status)
            } else {
                format!("{} 尚未通过解锁校验。", view.display_name)
            }
        })
        .collect::<Vec<_>>();

    UnlockStateView {
        ready_count,
        total_count: ProviderKind::ALL.len(),
        unlocked: ready_count == ProviderKind::ALL.len(),
        blockers,
    }
}

fn is_ready(view: &ProviderStatusView) -> bool {
    view.enabled && !view.api_key.is_empty() && view.status == "ready"
}

fn simulate_test(
    provider: ProviderKind,
    settings: &StoredSettings,
    secret: Option<&str>,
) -> ProviderTestResponse {
    let verified_at = utc_now();
    let api_key = secret.unwrap_or_default().trim().to_string();
    let provider_index = provider.priority();
    let base_url = settings.base_url.to_ascii_lowercase();

    let (ok, status, latency_ms, error_message) = if !settings.enabled {
        (
            false,
            "disabled".to_string(),
            0,
            Some("provider has been paused from the setup page".to_string()),
        )
    } else if api_key.is_empty() {
        (
            false,
            "missing_api_key".to_string(),
            0,
            Some("API key is required before provider testing".to_string()),
        )
    } else if api_key.contains("timeout") || base_url.contains("timeout") {
        (
            false,
            "timeout".to_string(),
            3_200,
            Some("simulated timeout path reached".to_string()),
        )
    } else if api_key.contains("fail") || base_url.contains("fail") {
        (
            false,
            "failed".to_string(),
            640,
            Some("simulated provider failure returned a non-200 response".to_string()),
        )
    } else {
        (true, "ready".to_string(), 180 + provider_index * 37, None)
    };

    let used_monthly = if ok {
        provider_index * 19 + 7
    } else {
        provider_index * 11
    };
    let remaining_monthly = (settings.monthly_limit - used_monthly).max(0);

    ProviderTestResponse {
        provider: provider.slug().to_string(),
        ok,
        status,
        latency_ms,
        quota_snapshot: QuotaSnapshot {
            used_monthly,
            remaining_monthly,
            daily_soft_limit: settings.daily_soft_limit,
            monthly_limit: settings.monthly_limit,
        },
        error_message,
        verified_at,
    }
}

fn mask_secret(secret: &str) -> String {
    let trimmed = secret.trim();
    if trimmed.is_empty() {
        return String::new();
    }
    let suffix = trimmed
        .chars()
        .rev()
        .take(4)
        .collect::<String>()
        .chars()
        .rev()
        .collect::<String>();
    format!("••••••{suffix}")
}

fn secret_key(provider: ProviderKind) -> String {
    format!("provider::{}", provider.slug())
}

fn bool_to_int(value: bool) -> i64 {
    if value { 1 } else { 0 }
}

fn utc_now() -> String {
    OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .expect("current utc time")
}

#[allow(dead_code)]
pub fn provider_db_path(workspace_root: &Path) -> PathBuf {
    workspace_root.join("data").join("spg_web.db")
}

trait BoolExt {
    fn not(self) -> bool;
}

impl BoolExt for bool {
    fn not(self) -> bool {
        !self
    }
}
