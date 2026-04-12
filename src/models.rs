use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AliasRule {
    pub value: String,
    pub strength: String,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameAsset {
    pub game_id: String,
    pub standard_name: String,
    pub track: String,
    pub representative_work: String,
    pub aliases: Vec<AliasRule>,
    pub official_accounts: Vec<String>,
    pub official_url_seeds: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetBundle {
    pub games: Vec<GameAsset>,
    pub negative_aliases: Vec<String>,
    pub event_rules: HashMap<String, Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatchEvidence {
    pub game_id: String,
    pub alias: String,
    pub strength: String,
    pub source: String,
    pub score: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RawSourceItem {
    pub source_id: String,
    pub platform: String,
    pub source_type: String,
    pub content_type: String,
    pub title: String,
    pub text: String,
    pub author: String,
    pub published_at: String,
    pub url: String,
    #[serde(default)]
    pub raw_metrics: HashMap<String, Value>,
    #[serde(default)]
    pub fetched_at: String,
    #[serde(default)]
    pub metadata: HashMap<String, Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanItem {
    pub clean_id: String,
    pub source_id: String,
    pub platform: String,
    pub source_type: String,
    pub content_type: String,
    pub source_layer: String,
    pub title: String,
    pub text: String,
    pub author: String,
    pub published_at: String,
    pub normalized_published_at: Option<String>,
    pub url: String,
    pub normalized_title: String,
    pub normalized_text: String,
    pub normalized_author: String,
    pub normalized_url: String,
    pub reference_urls: Vec<String>,
    pub normalized_metrics: HashMap<String, Value>,
    pub title_tokens: Vec<String>,
    pub text_tokens: Vec<String>,
    pub title_fingerprint: String,
    pub text_fingerprint: String,
    pub url_fingerprint: Option<String>,
    pub reference_url_fingerprints: Vec<String>,
    pub content_fingerprint: String,
    pub metadata: HashMap<String, Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraceEntry {
    pub stage: String,
    pub decision: String,
    pub detail: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceSignal {
    pub signal_id: String,
    pub run_id: String,
    pub asset_version: String,
    pub rule_version: String,
    pub raw_source_ids: Vec<String>,
    pub platform: String,
    pub source_layer: String,
    pub source_type: String,
    pub content_type: String,
    pub title: String,
    pub text: String,
    pub author: String,
    pub published_at: String,
    pub normalized_published_at: Option<String>,
    pub url: String,
    pub scope: String,
    pub track_id: Option<String>,
    pub track_candidates: Vec<String>,
    pub dedupe_key: String,
    pub information_key: String,
    pub dup_group_id: String,
    pub canonical_signal_id: String,
    pub dup_rank: i64,
    pub duplicate_type: String,
    pub game_candidates: Vec<String>,
    pub resolved_game_id: Option<String>,
    pub entity_resolution_method: String,
    pub entity_resolution_confidence: f64,
    pub event_type: Option<String>,
    pub attribution_keywords: Vec<String>,
    pub unresolved_reason: Option<String>,
    pub state: String,
    pub metrics: Value,
    pub trace: Vec<TraceEntry>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DedupeGroup {
    pub dup_group_id: String,
    pub run_id: String,
    pub canonical_signal_id: String,
    pub duplicate_type: String,
    pub dedupe_key: String,
    pub member_signal_ids: Vec<String>,
    pub member_source_ids: Vec<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResolutionLog {
    pub run_id: String,
    pub asset_version: String,
    pub rule_version: String,
    pub signal_id: String,
    pub source_id: String,
    pub stage: String,
    pub decision: String,
    pub detail: Value,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnresolvedRecord {
    pub unresolved_id: String,
    pub run_id: String,
    pub asset_version: String,
    pub rule_version: String,
    pub source_id: String,
    pub title: String,
    pub platform: String,
    pub track_id: Option<String>,
    pub track_candidates: Vec<String>,
    pub reason: String,
    pub candidate_game_ids: Vec<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipelineRunResult {
    pub run_id: String,
    pub asset_version: String,
    pub rule_version: String,
    pub run_created_at: String,
    pub raw_items: Vec<RawSourceItem>,
    pub clean_items: Vec<CleanItem>,
    pub signals: Vec<SourceSignal>,
    pub dedupe_groups: Vec<DedupeGroup>,
    pub resolution_logs: Vec<ResolutionLog>,
    pub unresolved_records: Vec<UnresolvedRecord>,
    pub metrics: Value,
}
