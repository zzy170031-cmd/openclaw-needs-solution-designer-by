use crate::models::{AliasRule, AssetBundle, GameAsset};
use crate::text_utils::{fingerprint, normalize_author, normalize_text};
use anyhow::{Context, Result};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone)]
pub struct AliasLookup {
    pub game_id: String,
    pub strength: String,
    pub source: String,
}

#[derive(Debug, Clone)]
pub struct AssetIndex {
    pub bundle: AssetBundle,
    pub alias_index: HashMap<String, Vec<AliasLookup>>,
    pub official_account_index: HashMap<String, String>,
    pub official_url_seed_index: Vec<(String, String)>,
    pub game_track_index: HashMap<String, String>,
    pub negative_aliases: HashSet<String>,
    pub event_rules: Vec<(String, Vec<String>)>,
    pub asset_version: String,
}

pub fn default_asset_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("data")
        .join("entity_assets.json")
}

pub fn sample_input_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("data")
        .join("sample_raw_items.jsonl")
}

pub fn load_asset_bundle(path: &Path) -> Result<AssetBundle> {
    let raw = fs::read_to_string(path)
        .with_context(|| format!("failed to read asset bundle at {}", path.display()))?;
    let bundle: AssetBundle =
        serde_json::from_str(&raw).context("failed to parse entity_assets.json")?;
    Ok(normalize_bundle(bundle))
}

pub fn build_asset_index(bundle: AssetBundle) -> AssetIndex {
    let mut alias_index: HashMap<String, Vec<AliasLookup>> = HashMap::new();
    let mut official_account_index = HashMap::new();
    let mut official_url_seed_index = Vec::new();
    let mut game_track_index = HashMap::new();
    let negative_aliases = bundle
        .negative_aliases
        .iter()
        .map(|alias| normalize_text(alias).to_lowercase())
        .collect::<HashSet<_>>();
    let mut event_rules = bundle
        .event_rules
        .iter()
        .map(|(kind, keywords)| {
            (
                kind.clone(),
                keywords
                    .iter()
                    .map(|keyword| normalize_text(keyword).to_lowercase())
                    .collect::<Vec<_>>(),
            )
        })
        .collect::<Vec<_>>();
    event_rules.sort_by(|left, right| left.0.cmp(&right.0));
    let asset_version = compute_asset_version(&bundle);

    for game in &bundle.games {
        game_track_index.insert(game.game_id.clone(), game.track.clone());
        let standard_alias = normalize_text(&game.standard_name).to_lowercase();
        alias_index
            .entry(standard_alias)
            .or_default()
            .push(AliasLookup {
                game_id: game.game_id.clone(),
                strength: "strong".to_string(),
                source: "standard_name".to_string(),
            });

        for alias in &game.aliases {
            alias_index
                .entry(normalize_text(&alias.value).to_lowercase())
                .or_default()
                .push(AliasLookup {
                    game_id: game.game_id.clone(),
                    strength: alias.strength.clone(),
                    source: alias.source.clone(),
                });
        }

        for account in &game.official_accounts {
            official_account_index.insert(normalize_author(account), game.game_id.clone());
        }

        for seed in &game.official_url_seeds {
            official_url_seed_index.push((normalize_text(seed).to_lowercase(), game.game_id.clone()));
        }
    }

    AssetIndex {
        bundle,
        alias_index,
        official_account_index,
        official_url_seed_index,
        game_track_index,
        negative_aliases,
        event_rules,
        asset_version,
    }
}

impl AssetIndex {
    pub fn track_for_game(&self, game_id: &str) -> Option<String> {
        self.game_track_index.get(game_id).cloned()
    }
}

fn normalize_bundle(bundle: AssetBundle) -> AssetBundle {
    let games = bundle
        .games
        .into_iter()
        .map(|game| GameAsset {
            game_id: game.game_id,
            standard_name: normalize_text(&game.standard_name),
            track: normalize_text(&game.track).to_lowercase(),
            representative_work: normalize_text(&game.representative_work),
            aliases: game
                .aliases
                .into_iter()
                .map(|alias| AliasRule {
                    value: normalize_text(&alias.value),
                    strength: normalize_text(&alias.strength).to_lowercase(),
                    source: normalize_text(&alias.source).to_lowercase(),
                })
                .collect(),
            official_accounts: game
                .official_accounts
                .into_iter()
                .map(|account| normalize_text(&account))
                .collect(),
            official_url_seeds: game
                .official_url_seeds
                .into_iter()
                .map(|seed| normalize_text(&seed))
                .collect(),
        })
        .collect();

    AssetBundle {
        games,
        negative_aliases: bundle
            .negative_aliases
            .into_iter()
            .map(|alias| normalize_text(&alias))
            .collect(),
        event_rules: bundle
            .event_rules
            .into_iter()
            .map(|(kind, keywords)| {
                (
                    normalize_text(&kind).to_lowercase(),
                    keywords
                        .into_iter()
                        .map(|keyword| normalize_text(&keyword))
                        .collect::<Vec<_>>(),
                )
            })
            .collect(),
    }
}

fn compute_asset_version(bundle: &AssetBundle) -> String {
    let serialized = serde_json::to_string(bundle).unwrap_or_else(|_| "asset_bundle".to_string());
    format!("entity_assets_{}", fingerprint(&[&serialized], 12))
}
