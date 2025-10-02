use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum WatermarkPosition {
    TopLeft,
    TopCenter,
    TopRight,
    CenterLeft,
    Center,
    CenterRight,
    BottomLeft,
    BottomCenter,
    BottomRight,
}

impl WatermarkPosition {
    #[allow(dead_code)]
    pub fn to_ffmpeg_coords(
        &self,
        canvas_width: u32,
        canvas_height: u32,
        watermark_width: u32,
        watermark_height: u32,
    ) -> (u32, u32) {
        let padding = 20;
        let max_x = canvas_width.saturating_sub(watermark_width + padding);
        let max_y = canvas_height.saturating_sub(watermark_height + padding);
        let center_x = ((canvas_width.saturating_sub(watermark_width)) / 2).clamp(padding, max_x);
        let center_y = ((canvas_height.saturating_sub(watermark_height)) / 2).clamp(padding, max_y);

        match self {
            WatermarkPosition::TopLeft => (padding, padding),
            WatermarkPosition::TopCenter => (center_x, padding),
            WatermarkPosition::TopRight => (max_x, padding),
            WatermarkPosition::CenterLeft => (padding, center_y),
            WatermarkPosition::Center => (center_x, center_y),
            WatermarkPosition::CenterRight => (max_x, center_y),
            WatermarkPosition::BottomLeft => (padding, max_y),
            WatermarkPosition::BottomCenter => (center_x, max_y),
            WatermarkPosition::BottomRight => (max_x, max_y),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum WatermarkType {
    Text,
    Image,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomPosition {
    pub x: f32,
    pub y: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(default)]
pub struct WatermarkConfig {
    pub watermark_type: WatermarkType,
    pub text: String,
    pub image_path: Option<String>,
    pub position: WatermarkPosition,
    pub opacity: u8,
    pub text_color: String,
    pub font_size: u32,
    pub font_family: String,
    #[serde(rename = "imageScale")]
    pub image_scale: Option<u32>,
    #[serde(rename = "positionMode")]
    pub position_mode: Option<String>,
    #[serde(rename = "customPosition")]
    pub custom_position: Option<CustomPosition>,
}

impl WatermarkConfig {
    pub fn is_custom_position(&self) -> bool {
        self.position_mode.as_ref().map_or(false, |mode| mode == "custom")
    }

    pub fn validate_custom_position(&self) -> Result<(), String> {
        if let Some(custom_pos) = &self.custom_position {
            if custom_pos.x < 0.0 || custom_pos.x > 1.0 {
                return Err(format!("Custom position x must be between 0.0 and 1.0, got {}", custom_pos.x));
            }
            if custom_pos.y < 0.0 || custom_pos.y > 1.0 {
                return Err(format!("Custom position y must be between 0.0 and 1.0, got {}", custom_pos.y));
            }
        }
        Ok(())
    }
}

impl Default for WatermarkConfig {
    fn default() -> Self {
        Self {
            watermark_type: WatermarkType::Text,
            text: "Watermark".to_string(),
            image_path: None,
            position: WatermarkPosition::BottomRight,
            opacity: 80,
            text_color: "#ffffff".to_string(),
            font_size: 48,
            font_family: "Arial".to_string(),
            image_scale: Some(20),
            position_mode: Some("preset".to_string()),
            custom_position: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileItem {
    pub path: PathBuf,
    pub name: String,
    pub r#type: String,
    pub size: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ProcessingStatus {
    Success,
    Failed,
    Skipped,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileResult {
    pub input_path: PathBuf,
    pub output_path: Option<PathBuf>,
    pub status: ProcessingStatus,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchResult {
    pub files: Vec<FileResult>,
    pub total: usize,
    pub successful: usize,
    pub failed: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgressPayload {
    pub file_path: String,
    pub file_index: usize,
    pub total_files: usize,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PresetMetadata {
    pub id: String,
    pub name: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WatermarkPreset {
    pub name: String,
    pub description: String,
    pub config: WatermarkConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThumbnailCacheEntry {
    pub video_path: String,
    pub video_mtime: u64,  // Unix timestamp of video file modification time
    pub thumbnail_path: PathBuf,
    pub created_at: u64,  // Unix timestamp when thumbnail was created
    pub last_accessed: u64,  // Unix timestamp of last access
    pub file_size: u64,  // Size of thumbnail in bytes
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ThumbnailCache {
    pub entries: std::collections::HashMap<String, ThumbnailCacheEntry>,
    pub version: u32,  // Cache format version for future compatibility
}
