use crate::models::RawSourceItem;
use anyhow::{Context, Result};
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::Path;

pub fn load_raw_items_from_jsonl(path: &Path) -> Result<Vec<RawSourceItem>> {
    let file = File::open(path).with_context(|| format!("failed to open {}", path.display()))?;
    let reader = BufReader::new(file);
    let mut items = Vec::new();
    for (index, line) in reader.lines().enumerate() {
        let line = line.with_context(|| format!("failed to read line {}", index + 1))?;
        if line.trim().is_empty() {
            continue;
        }
        let item: RawSourceItem = serde_json::from_str(&line)
            .with_context(|| format!("invalid JSONL at line {}", index + 1))?;
        items.push(item);
    }
    Ok(items)
}
