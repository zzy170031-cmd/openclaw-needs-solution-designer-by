use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ProviderKind {
    Doubao,
    Serper,
    Firecrawl,
    Tavily,
    Exa,
    Gemini,
}

impl ProviderKind {
    pub const ALL: [Self; 6] = [
        Self::Doubao,
        Self::Serper,
        Self::Firecrawl,
        Self::Tavily,
        Self::Exa,
        Self::Gemini,
    ];

    pub fn slug(self) -> &'static str {
        match self {
            Self::Doubao => "doubao",
            Self::Serper => "serper",
            Self::Firecrawl => "firecrawl",
            Self::Tavily => "tavily",
            Self::Exa => "exa",
            Self::Gemini => "gemini",
        }
    }

    pub fn display_name(self) -> &'static str {
        match self {
            Self::Doubao => "Doubao",
            Self::Serper => "Serper",
            Self::Firecrawl => "Firecrawl",
            Self::Tavily => "Tavily",
            Self::Exa => "Exa",
            Self::Gemini => "Gemini",
        }
    }

    pub fn description(self) -> &'static str {
        match self {
            Self::Doubao => "日常主解析器，承担清洗、归因和结构化输出。",
            Self::Serper => "默认搜索入口，负责高频发现与召回。",
            Self::Firecrawl => "正文抽取器，只用于值得抓取的页面。",
            Self::Tavily => "时效验证补位，适合新闻与热点核验。",
            Self::Exa => "长尾语义扩展，做深挖和相邻发现。",
            Self::Gemini => "复杂 fallback，处理特殊页面和临时补位。",
        }
    }

    pub fn default_base_url(self) -> &'static str {
        match self {
            Self::Doubao => "https://ark.cn-beijing.volces.com",
            Self::Serper => "https://google.serper.dev",
            Self::Firecrawl => "https://api.firecrawl.dev",
            Self::Tavily => "https://api.tavily.com",
            Self::Exa => "https://api.exa.ai",
            Self::Gemini => "https://generativelanguage.googleapis.com",
        }
    }

    pub fn monthly_limit(self) -> i64 {
        match self {
            Self::Doubao => 99_999,
            Self::Serper => 2_500,
            Self::Firecrawl => 500,
            Self::Tavily => 1_000,
            Self::Exa => 1_000,
            Self::Gemini => 5_000,
        }
    }

    pub fn daily_soft_limit(self) -> i64 {
        match self {
            Self::Doubao => 5_000,
            Self::Serper => 90,
            Self::Firecrawl => 16,
            Self::Tavily => 33,
            Self::Exa => 33,
            Self::Gemini => 166,
        }
    }

    pub fn default_role(self) -> &'static str {
        match self {
            Self::Doubao => "primary_reasoner",
            Self::Serper => "primary_search",
            Self::Firecrawl => "content_fetch",
            Self::Tavily => "freshness_verify",
            Self::Exa => "long_tail_discovery",
            Self::Gemini => "complex_fallback",
        }
    }

    pub fn priority(self) -> i64 {
        match self {
            Self::Doubao => 1,
            Self::Serper => 2,
            Self::Firecrawl => 3,
            Self::Tavily => 4,
            Self::Exa => 5,
            Self::Gemini => 6,
        }
    }
}

impl std::fmt::Display for ProviderKind {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.slug())
    }
}

impl std::str::FromStr for ProviderKind {
    type Err = String;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        match value.trim().to_ascii_lowercase().as_str() {
            "doubao" => Ok(Self::Doubao),
            "serper" => Ok(Self::Serper),
            "firecrawl" => Ok(Self::Firecrawl),
            "tavily" => Ok(Self::Tavily),
            "exa" => Ok(Self::Exa),
            "gemini" => Ok(Self::Gemini),
            other => Err(format!("unknown provider: {other}")),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderStatusView {
    pub provider: String,
    pub display_name: String,
    pub description: String,
    pub enabled: bool,
    pub api_key: String,
    pub base_url: String,
    pub monthly_limit: i64,
    pub daily_soft_limit: i64,
    pub default_role: String,
    pub priority: i64,
    pub status: String,
    pub last_verified_at: Option<String>,
    pub last_error: Option<String>,
    pub latency_ms: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnlockStateView {
    pub ready_count: usize,
    pub total_count: usize,
    pub unlocked: bool,
    pub blockers: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderUpdateRequest {
    pub enabled: bool,
    pub api_key: Option<String>,
    pub base_url: String,
    pub monthly_limit: i64,
    pub daily_soft_limit: i64,
    pub default_role: String,
    pub priority: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuotaSnapshot {
    pub used_monthly: i64,
    pub remaining_monthly: i64,
    pub daily_soft_limit: i64,
    pub monthly_limit: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderTestResponse {
    pub provider: String,
    pub ok: bool,
    pub status: String,
    pub latency_ms: i64,
    pub quota_snapshot: QuotaSnapshot,
    pub error_message: Option<String>,
    pub verified_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GalaxyGameListItem {
    pub id: String,
    pub name: String,
    pub studio: String,
    pub stage: String,
    pub aliases: Vec<String>,
    pub official_url: String,
    pub signal_count: i64,
    pub note: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GalaxyEventListItem {
    pub id: String,
    pub title: String,
    pub event_type: String,
    pub game_id: String,
    pub game_name: String,
    pub heat: i64,
    pub source_count: i64,
    pub note: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GalaxyNode {
    pub id: String,
    pub label: String,
    pub node_type: String,
    pub orbit: i64,
    pub angle: f64,
    pub size: f64,
    pub accent: String,
    pub detail: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GalaxyEdge {
    pub source: String,
    pub target: String,
    pub edge_type: String,
    pub strength: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GalaxyFocusView {
    pub focus_id: String,
    pub focus_kind: String,
    pub title: String,
    pub subtitle: String,
    pub narrative: Vec<String>,
    pub nodes: Vec<GalaxyNode>,
    pub edges: Vec<GalaxyEdge>,
    pub available_layers: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GalaxySummaryView {
    pub headline: String,
    pub subheadline: String,
    pub game_count: i64,
    pub event_count: i64,
    pub source_count: i64,
    pub track_count: i64,
    pub last_updated: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GalaxyListResponse {
    pub tab: String,
    pub games: Vec<GalaxyGameListItem>,
    pub events: Vec<GalaxyEventListItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SetupPageView {
    pub mode: String,
    pub providers: Vec<ProviderStatusView>,
    pub unlock_state: UnlockStateView,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GalaxyPageView {
    pub summary: GalaxySummaryView,
    pub default_tab: String,
    pub games: Vec<GalaxyGameListItem>,
    pub initial_focus: GalaxyFocusView,
    pub unlock_state: UnlockStateView,
}
