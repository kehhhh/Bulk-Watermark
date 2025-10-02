use std::path::{Path, PathBuf};
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::time::{SystemTime, UNIX_EPOCH};

use tauri::{AppHandle, Emitter};
use thiserror::Error;

use crate::ffmpeg::{build_ffmpeg_command, detect_file_type, spawn_ffmpeg, FfmpegError};
use crate::types::{
    BatchResult, FileItem, FileResult, PresetMetadata, ProcessingStatus, ProgressPayload, 
    WatermarkConfig, WatermarkPreset, WatermarkType, ThumbnailCache, ThumbnailCacheEntry,
};

#[derive(Debug, Error)]
enum ProcessingError {
    #[error("{0}")]
    Message(String),
    #[error(transparent)]
    Ffmpeg(#[from] FfmpegError),
    #[error(transparent)]
    Io(#[from] std::io::Error),
}

impl ProcessingError {
    fn is_catastrophic(&self) -> bool {
        matches!(
            self,
            ProcessingError::Ffmpeg(FfmpegError::MissingBinary(_))
                | ProcessingError::Ffmpeg(FfmpegError::Spawn(_))
        )
    }
}

#[tauri::command]
pub async fn process_single_file(
    app: AppHandle,
    input_path: String,
    output_path: String,
    config: WatermarkConfig,
) -> Result<FileResult, String> {
    if let Err(err) = validate_config(&config) {
        return Ok(FileResult {
            input_path: PathBuf::from(&input_path),
            output_path: None,
            status: ProcessingStatus::Failed,
            error: Some(err.to_string()),
        });
    }

    let input = PathBuf::from(&input_path);
    let output = PathBuf::from(&output_path);

    match process_file_internal(&app, &input, &output, &config).await {
        Ok(_) => Ok(FileResult {
            input_path: input,
            output_path: Some(output),
            status: ProcessingStatus::Success,
            error: None,
        }),
        Err(err) if err.is_catastrophic() => Err(err.to_string()),
        Err(err) => Ok(FileResult {
            input_path: PathBuf::from(input_path),
            output_path: None,
            status: ProcessingStatus::Failed,
            error: Some(err.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn process_batch(
    app: AppHandle,
    files: Vec<FileItem>,
    config: WatermarkConfig,
    output_dir: String,
) -> Result<BatchResult, String> {
    validate_config(&config).map_err(|err| err.to_string())?;

    let output_dir_path = PathBuf::from(&output_dir);
    std::fs::create_dir_all(&output_dir_path).map_err(|err| err.to_string())?;

    let total_files = files.len();
    let mut successful = 0usize;
    let mut failed = 0usize;
    let mut results = Vec::with_capacity(total_files);

    for (index, file) in files.iter().enumerate() {
        let file_path_string = file.path.to_string_lossy().to_string();
        emit_progress(
            &app,
            ProgressPayload {
                file_path: file_path_string.clone(),
                file_index: index,
                total_files,
                status: "processing".to_string(),
            },
        );

        let output_path = build_output_path(&output_dir_path, &file.path);

        let processing_result =
            process_file_internal(&app, &file.path, &output_path, &config).await;

        let (file_result, status_label) = match processing_result {
            Ok(_) => {
                successful += 1;
                (
                    FileResult {
                        input_path: file.path.clone(),
                        output_path: Some(output_path.clone()),
                        status: ProcessingStatus::Success,
                        error: None,
                    },
                    "complete".to_string(),
                )
            }
            Err(err) if err.is_catastrophic() => return Err(err.to_string()),
            Err(err) => {
                failed += 1;
                (
                    FileResult {
                        input_path: file.path.clone(),
                        output_path: None,
                        status: ProcessingStatus::Failed,
                        error: Some(err.to_string()),
                    },
                    "error".to_string(),
                )
            }
        };

        emit_progress(
            &app,
            ProgressPayload {
                file_path: file_path_string,
                file_index: index,
                total_files,
                status: status_label,
            },
        );

        results.push(file_result);
    }

    let batch_result = BatchResult {
        files: results,
        total: total_files,
        successful,
        failed,
    };

    app.emit_to("main", "watermark-complete", &batch_result)
        .map_err(|err| err.to_string())?;

    Ok(batch_result)
}

async fn process_file_internal(
    app: &AppHandle,
    input_path: &Path,
    output_path: &Path,
    config: &WatermarkConfig,
) -> Result<(), ProcessingError> {
    if !input_path.exists() {
        return Err(ProcessingError::Message("Input file not found".into()));
    }

    if let Some(parent) = output_path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    let is_video = detect_file_type(input_path).map_err(ProcessingError::from)?;
    let args = build_ffmpeg_command(app, input_path, output_path, config, is_video)
        .map_err(ProcessingError::from)?;
    spawn_ffmpeg(app, args)
        .await
        .map_err(ProcessingError::from)?;

    Ok(())
}

fn validate_config(config: &WatermarkConfig) -> Result<(), ProcessingError> {
    match config.watermark_type {
        WatermarkType::Text => {
            if config.text.trim().is_empty() {
                return Err(ProcessingError::Message(
                    "Text watermark requires non-empty text".into(),
                ));
            }
        }
        WatermarkType::Image => {
            let image_path = config.image_path.as_ref().ok_or_else(|| {
                ProcessingError::Message("Image watermark requires image_path".into())
            })?;
            if !Path::new(image_path).exists() {
                return Err(ProcessingError::Message(format!(
                    "Watermark image not found at {image_path}"
                )));
            }
        }
    }

    if config.opacity > 100 {
        return Err(ProcessingError::Message(
            "Opacity must be between 0 and 100".into(),
        ));
    }

    // Validate custom position if in custom mode
    if let Some(mode) = &config.position_mode {
        if mode == "custom" {
            let custom_pos = config.custom_position.as_ref()
                .ok_or_else(|| ProcessingError::Message(
                    "Custom position mode requires customPosition field".into()
                ))?;
            
            if custom_pos.x < 0.0 || custom_pos.x > 1.0 {
                return Err(ProcessingError::Message(
                    format!("Custom position x must be between 0.0 and 1.0, got {}", custom_pos.x)
                ));
            }
            
            if custom_pos.y < 0.0 || custom_pos.y > 1.0 {
                return Err(ProcessingError::Message(
                    format!("Custom position y must be between 0.0 and 1.0, got {}", custom_pos.y)
                ));
            }
        }
    }

    Ok(())
}

fn emit_progress(app: &AppHandle, payload: ProgressPayload) {
    let _ = app.emit_to("main", "watermark-progress", &payload);
}

fn build_output_path(output_dir: &Path, input_path: &Path) -> PathBuf {
    let file_stem = input_path
        .file_stem()
        .and_then(|stem| stem.to_str())
        .unwrap_or("watermarked");
    let extension = input_path
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("out");

    output_dir.join(format!("{}_watermarked.{}", file_stem, extension))
}

#[tauri::command]
pub async fn open_folder_in_explorer(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }
    
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }
    
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }
    
    Ok(())
}

#[tauri::command]
pub async fn list_presets(app: AppHandle) -> Result<Vec<PresetMetadata>, String> {
    use tauri::Manager;
    
    let presets_path = app
        .path()
        .resolve("resources/presets", tauri::path::BaseDirectory::Resource)
        .map_err(|e| format!("Failed to resolve presets directory: {}", e))?;

    let mut presets = Vec::new();

    let entries = std::fs::read_dir(&presets_path)
        .map_err(|e| format!("Failed to read presets directory: {}", e))?;

    for entry in entries {
        let entry = match entry {
            Ok(e) => e,
            Err(e) => {
                eprintln!("Failed to read directory entry: {}", e);
                continue;
            }
        };

        let path = entry.path();
        
        // Only process .json files
        if path.extension().and_then(|s| s.to_str()) != Some("json") {
            continue;
        }

        // Get the preset ID from filename
        let id = match path.file_stem().and_then(|s| s.to_str()) {
            Some(s) => s.to_string(),
            None => continue,
        };

        // Read and parse the preset file
        match std::fs::read_to_string(&path) {
            Ok(content) => {
                match serde_json::from_str::<WatermarkPreset>(&content) {
                    Ok(preset) => {
                        presets.push(PresetMetadata {
                            id,
                            name: preset.name,
                            description: preset.description,
                        });
                    }
                    Err(e) => {
                        eprintln!("Failed to parse preset {}: {}", path.display(), e);
                        continue;
                    }
                }
            }
            Err(e) => {
                eprintln!("Failed to read preset file {}: {}", path.display(), e);
                continue;
            }
        }
    }

    // Sort presets alphabetically by name
    presets.sort_by(|a, b| a.name.cmp(&b.name));

    Ok(presets)
}

#[tauri::command]
pub async fn load_preset(app: AppHandle, preset_id: String) -> Result<WatermarkConfig, String> {
    use tauri::Manager;
    
    // Validate preset_id to prevent path traversal
    if !preset_id.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_') {
        return Err("Invalid preset ID".to_string());
    }

    let preset_filename = format!("{}.json", preset_id);
    let preset_path = app
        .path()
        .resolve(
            format!("resources/presets/{}", preset_filename),
            tauri::path::BaseDirectory::Resource,
        )
        .map_err(|e| format!("Failed to resolve preset path: {}", e))?;

    // Read the preset file
    let content = std::fs::read_to_string(&preset_path)
        .map_err(|e| format!("Preset not found: {}", e))?;

    // Parse the preset
    let preset: WatermarkPreset = serde_json::from_str(&content)
        .map_err(|e| format!("Invalid preset format: {}", e))?;

    Ok(preset.config)
}

// Cache utility functions

fn get_cache_file_path() -> Result<PathBuf, std::io::Error> {
    let cache_dir = std::env::temp_dir().join("bulk-watermark-thumbnails");
    std::fs::create_dir_all(&cache_dir)?;
    Ok(cache_dir.join("cache.json"))
}

fn load_thumbnail_cache() -> ThumbnailCache {
    let cache_path = match get_cache_file_path() {
        Ok(path) => path,
        Err(e) => {
            eprintln!("Failed to get cache file path: {}", e);
            return ThumbnailCache::default();
        }
    };

    if !cache_path.exists() {
        return ThumbnailCache {
            entries: std::collections::HashMap::new(),
            version: 1,
        };
    }

    match std::fs::read_to_string(&cache_path) {
        Ok(content) => {
            match serde_json::from_str::<ThumbnailCache>(&content) {
                Ok(mut cache) => {
                    // Validate that cached thumbnail files still exist, remove stale entries
                    cache.entries.retain(|_, entry| entry.thumbnail_path.exists());
                    cache
                }
                Err(e) => {
                    eprintln!("Failed to parse cache file: {}", e);
                    ThumbnailCache {
                        entries: std::collections::HashMap::new(),
                        version: 1,
                    }
                }
            }
        }
        Err(e) => {
            eprintln!("Failed to read cache file: {}", e);
            ThumbnailCache {
                entries: std::collections::HashMap::new(),
                version: 1,
            }
        }
    }
}

fn save_thumbnail_cache(cache: &ThumbnailCache) -> Result<(), std::io::Error> {
    let cache_path = get_cache_file_path()?;
    let content = serde_json::to_string_pretty(cache)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
    std::fs::write(cache_path, content)?;
    Ok(())
}

fn generate_cache_key(video_path: &str, mtime: u64) -> String {
    let mut hasher = DefaultHasher::new();
    format!("{}{}", video_path, mtime).hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

fn get_file_mtime(path: &Path) -> Result<u64, std::io::Error> {
    let metadata = std::fs::metadata(path)?;
    let modified = metadata.modified()?;
    let duration = modified.duration_since(UNIX_EPOCH)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
    Ok(duration.as_secs())
}

fn evict_lru_entries(cache: &mut ThumbnailCache, max_entries: usize, max_size_bytes: u64) {
    // Calculate total size
    let total_size: u64 = cache.entries.values().map(|e| e.file_size).sum();
    
    // Check if eviction is needed
    if cache.entries.len() <= max_entries && total_size <= max_size_bytes {
        return;
    }

    // Collect owned keys and timestamps sorted by last_accessed (oldest first)
    let mut entries: Vec<_> = cache.entries
        .iter()
        .map(|(key, entry)| (key.clone(), entry.last_accessed, entry.thumbnail_path.clone(), entry.file_size))
        .collect();
    entries.sort_by_key(|(_, last_accessed, _, _)| *last_accessed);

    // Remove oldest entries until under limits
    let mut current_size = total_size;
    let mut current_count = cache.entries.len();

    for (key, _, thumbnail_path, file_size) in entries {
        if current_count <= max_entries && current_size <= max_size_bytes {
            break;
        }

        // Delete the thumbnail file
        if thumbnail_path.exists() {
            if let Err(e) = std::fs::remove_file(&thumbnail_path) {
                eprintln!("Failed to delete thumbnail {}: {}", thumbnail_path.display(), e);
            }
        }

        // Remove from cache
        cache.entries.remove(&key);
        current_size = current_size.saturating_sub(file_size);
        current_count -= 1;
    }
}

#[tauri::command]
pub async fn extract_video_thumbnail(
    app: AppHandle,
    video_path: String,
) -> Result<String, String> {
    // Convert video path to PathBuf
    let video_path_buf = PathBuf::from(&video_path);

    // Get video file mtime
    let video_mtime = get_file_mtime(&video_path_buf)
        .map_err(|e| format!("Failed to get video file modification time: {}", e))?;

    // Generate cache key
    let cache_key = generate_cache_key(&video_path, video_mtime);

    // Load cache
    let mut cache = load_thumbnail_cache();

    // Check cache for existing entry
    if let Some(entry) = cache.entries.get(&cache_key) {
        if entry.thumbnail_path.exists() {
            // Clone the thumbnail path before updating the cache
            let thumbnail_path = entry.thumbnail_path.clone();
            
            // Update last_accessed timestamp
            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map(|d| d.as_secs())
                .unwrap_or(0);
            
            // Get mutable reference and update (now entry reference is dropped)
            if let Some(entry_mut) = cache.entries.get_mut(&cache_key) {
                entry_mut.last_accessed = now;
            }

            // Save updated cache (log but don't fail on error)
            if let Err(e) = save_thumbnail_cache(&cache) {
                eprintln!("Failed to save cache after access update: {}", e);
            }

            // Return cached thumbnail path
            return Ok(thumbnail_path.to_string_lossy().into_owned());
        } else {
            // Thumbnail file missing, remove stale entry
            cache.entries.remove(&cache_key);
        }
    }

    // Cache miss - extract thumbnail
    let temp_dir = std::env::temp_dir().join("bulk-watermark-thumbnails");
    std::fs::create_dir_all(&temp_dir)
        .map_err(|e| format!("Failed to create temp directory: {}", e))?;

    // Generate thumbnail filename using cache key
    let thumbnail_filename = format!("{}.jpg", cache_key);
    let output_path = temp_dir.join(thumbnail_filename);

    // Extract the thumbnail using FFmpeg
    match crate::ffmpeg::extract_video_thumbnail(&app, &video_path_buf, &output_path).await {
        Ok(_) => {
            // Get thumbnail file size
            let file_size = std::fs::metadata(&output_path)
                .map(|m| m.len())
                .unwrap_or(0);

            // Create cache entry
            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map(|d| d.as_secs())
                .unwrap_or(0);

            let cache_entry = ThumbnailCacheEntry {
                video_path: video_path.clone(),
                video_mtime,
                thumbnail_path: output_path.clone(),
                created_at: now,
                last_accessed: now,
                file_size,
            };

            // Add to cache
            cache.entries.insert(cache_key, cache_entry);

            // Evict LRU entries if needed (100 entries max, 500MB max)
            evict_lru_entries(&mut cache, 100, 500 * 1024 * 1024);

            // Save cache (log but don't fail on error)
            if let Err(e) = save_thumbnail_cache(&cache) {
                eprintln!("Failed to save cache: {}", e);
            }

            Ok(output_path.to_string_lossy().into_owned())
        }
        Err(FfmpegError::MissingBinary(msg)) => Err(format!("FFmpeg not found: {}", msg)),
        Err(FfmpegError::UnsupportedFormat(msg)) => Err(format!("Unsupported format: {}", msg)),
        Err(e) => Err(format!("Failed to extract thumbnail: {}", e)),
    }
}

#[tauri::command]
pub async fn cleanup_thumbnail_cache(
    max_age_days: Option<u32>,
) -> Result<String, String> {
    // Get temp directory path
    let temp_dir = std::env::temp_dir().join("bulk-watermark-thumbnails");
    if !temp_dir.exists() {
        return Ok("No thumbnails to clean up.".to_string());
    }

    // Load cache
    let mut cache = load_thumbnail_cache();

    // Determine cutoff timestamp (default: 7 days)
    let max_age = max_age_days.unwrap_or(7);
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let cutoff_timestamp = now.saturating_sub((max_age as u64) * 24 * 60 * 60);

    let mut cleaned_count = 0;
    let mut freed_bytes = 0u64;

    // Remove old entries from cache
    let keys_to_remove: Vec<_> = cache
        .entries
        .iter()
        .filter(|(_, entry)| {
            // Remove if older than cutoff or if file doesn't exist
            entry.created_at < cutoff_timestamp || !entry.thumbnail_path.exists()
        })
        .map(|(key, _)| key.clone())
        .collect();

    for key in keys_to_remove {
        if let Some(entry) = cache.entries.remove(&key) {
            // Delete the thumbnail file if it exists
            if entry.thumbnail_path.exists() {
                match std::fs::remove_file(&entry.thumbnail_path) {
                    Ok(_) => {
                        cleaned_count += 1;
                        freed_bytes += entry.file_size;
                    }
                    Err(e) => {
                        eprintln!("Failed to delete thumbnail {}: {}", entry.thumbnail_path.display(), e);
                    }
                }
            } else {
                cleaned_count += 1;
            }
        }
    }

    // Scan for orphaned files (files in directory but not in cache)
    if let Ok(entries) = std::fs::read_dir(&temp_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            
            // Skip the cache.json file
            if path.file_name().and_then(|n| n.to_str()) == Some("cache.json") {
                continue;
            }

            // Check if this file is in the cache
            let is_orphaned = !cache.entries.values().any(|e| e.thumbnail_path == path);

            if is_orphaned && path.extension().and_then(|e| e.to_str()) == Some("jpg") {
                if let Ok(metadata) = std::fs::metadata(&path) {
                    let file_size = metadata.len();
                    match std::fs::remove_file(&path) {
                        Ok(_) => {
                            cleaned_count += 1;
                            freed_bytes += file_size;
                        }
                        Err(e) => {
                            eprintln!("Failed to delete orphaned file {}: {}", path.display(), e);
                        }
                    }
                }
            }
        }
    }

    // Save updated cache
    if let Err(e) = save_thumbnail_cache(&cache) {
        eprintln!("Failed to save cache after cleanup: {}", e);
    }

    let freed_mb = freed_bytes as f64 / (1024.0 * 1024.0);
    Ok(format!("Cleaned up {} thumbnails, freed {:.2} MB", cleaned_count, freed_mb))
}
