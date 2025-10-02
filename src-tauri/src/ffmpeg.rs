use std::path::{Path, PathBuf};

use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;
use thiserror::Error;

use crate::types::{WatermarkConfig, WatermarkPosition, WatermarkType};

#[derive(Debug, Error)]
pub enum FfmpegError {
    #[error("FFmpeg binary not found: {0}")]
    MissingBinary(String),
    #[error("Invalid configuration: {0}")]
    InvalidConfig(String),
    #[error("Unsupported file format: {0}")]
    UnsupportedFormat(String),
    #[error("Failed to spawn FFmpeg: {0}")]
    Spawn(String),
    #[error("FFmpeg exited with error: {0}")]
    Execution(String),
    #[error("Path error: {0}")]
    Path(String),
}

pub fn get_ffmpeg_sidecar_path(_app: &AppHandle) -> Result<PathBuf, FfmpegError> {
    let exe = std::env::current_exe()
        .map_err(|e| FfmpegError::Path(format!("failed to resolve current executable: {e}")))?;
    let Some(dir) = exe.parent() else {
        return Err(FfmpegError::Path(
            "failed to resolve executable directory".into(),
        ));
    };

    let filename = if cfg!(target_os = "windows") {
        "ffmpeg-x86_64-pc-windows-msvc.exe"
    } else if cfg!(target_os = "linux") {
        "ffmpeg-x86_64-unknown-linux-gnu"
    } else if cfg!(target_os = "macos") {
        if cfg!(target_arch = "aarch64") {
            "ffmpeg-aarch64-apple-darwin"
        } else {
            "ffmpeg-x86_64-apple-darwin"
        }
    } else {
        return Err(FfmpegError::MissingBinary(
            "unsupported operating system for bundled FFmpeg".into(),
        ));
    };

    let path = dir.join(filename);
    if !path.exists() {
        return Err(FfmpegError::MissingBinary(format!(
            "{} (place the binary in src-tauri/binaries/ before building)",
            path.display()
        )));
    }

    Ok(path)
}

pub fn build_text_watermark_filter(
    config: &WatermarkConfig,
    _is_video: bool,
) -> Result<String, FfmpegError> {
    if config.text.trim().is_empty() {
        return Err(FfmpegError::InvalidConfig(
            "text watermark requires non-empty text".into(),
        ));
    }

    // FFmpeg drawtext filter requires special escaping:
    // - Backslash and single quote need to be escaped
    // - Colon needs to be escaped as it's a delimiter
    // - Other special characters also need escaping
    let escaped_text = config.text
        .replace('\\', "\\\\")  // Escape backslashes first
        .replace('\'', "\\'")   // Escape single quotes
        .replace(':', "\\:")    // Escape colons
        .replace('%', "\\%")    // Escape percent signs
        .replace('{', "\\{")    // Escape curly braces
        .replace('}', "\\}");   // Escape curly braces
    
    let escaped_font = config.font_family
        .replace('\\', "\\\\")
        .replace('\'', "\\'")
        .replace(':', "\\:");
    
    let font_color = normalize_color(&config.text_color, config.opacity);
    let (x_expr, y_expr) = text_position_expression(config);

    // Wrap x and y expressions in quotes if they contain commas (for complex expressions)
    let x_param = if x_expr.contains(',') {
        format!("x='{}'", x_expr)
    } else {
        format!("x={}", x_expr)
    };
    let y_param = if y_expr.contains(',') {
        format!("y='{}'", y_expr)
    } else {
        format!("y={}", y_expr)
    };

    let filter = format!(
        "drawtext=text='{}':font='{}':fontsize={}:fontcolor={}:shadowcolor=black@0.5:shadowx=2:shadowy=2:{}:{}",
        escaped_text,
        escaped_font,
        config.font_size,
        font_color,
        x_param,
        y_param
    );

    Ok(filter)
}

pub fn build_image_watermark_filter(
    config: &WatermarkConfig,
    watermark_image_path: &str,
) -> Result<String, FfmpegError> {
    if watermark_image_path.trim().is_empty() {
        return Err(FfmpegError::InvalidConfig(
            "image watermark requires an image path".into(),
        ));
    }

    let watermark_path = Path::new(watermark_image_path);
    if !watermark_path.exists() {
        return Err(FfmpegError::InvalidConfig(format!(
            "watermark image not found at {}",
            watermark_image_path
        )));
    }

    let (x_expr, y_expr) = overlay_position_expression(config);
    let opacity = (config.opacity as f32 / 100.0).clamp(0.0, 1.0);
    
    // Scale watermark as percentage of source width (default 20%)
    let scale_percent = config.image_scale.unwrap_or(20);
    let scale_expr = format!("iw*{}/ 100:-1", scale_percent);

    Ok(format!(
        "[1:v]scale={}[wm];[wm]format=rgba,colorchannelmixer=aa={:.3}[wm_alpha];[0:v][wm_alpha]overlay={}:{}",
        scale_expr,
        opacity,
        x_expr,
        y_expr
    ))
}

pub fn build_ffmpeg_command(
    app: &AppHandle,
    input_path: &Path,
    output_path: &Path,
    config: &WatermarkConfig,
    is_video: bool,
) -> Result<Vec<String>, FfmpegError> {
    let _ = get_ffmpeg_sidecar_path(app)?;

    let mut args = Vec::new();
    args.push("-i".into());
    args.push(input_path.to_string_lossy().into_owned());

    match config.watermark_type {
        WatermarkType::Image => {
            let image_path = config.image_path.as_ref().ok_or_else(|| {
                FfmpegError::InvalidConfig("image watermark requires image_path".into())
            })?;
            args.push("-i".into());
            args.push(Path::new(image_path).to_string_lossy().into_owned());
            let filter = build_image_watermark_filter(config, image_path)?;
            args.push("-filter_complex".into());
            args.push(filter);
        }
        WatermarkType::Text => {
            let filter = build_text_watermark_filter(config, is_video)?;
            args.push("-vf".into());
            args.push(filter);
        }
    }

    if is_video {
        args.push("-c:a".into());
        args.push("copy".into());
    } else {
        args.push("-frames:v".into());
        args.push("1".into());
    }

    args.push("-y".into());
    args.push(output_path.to_string_lossy().into_owned());

    Ok(args)
}

pub async fn spawn_ffmpeg(app: &AppHandle, args: Vec<String>) -> Result<String, FfmpegError> {
    let output = app
        .shell()
        .sidecar("ffmpeg")
        .map_err(|e| FfmpegError::Spawn(e.to_string()))?
        .args(args)
        .output()
        .await
        .map_err(|e| FfmpegError::Execution(e.to_string()))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        return Err(FfmpegError::Execution(stderr));
    }

    Ok(String::from_utf8_lossy(&output.stdout).into_owned())
}

pub fn detect_file_type<P: AsRef<Path>>(path: P) -> Result<bool, FfmpegError> {
    let extension = path
        .as_ref()
        .extension()
        .and_then(|ext| ext.to_str())
        .ok_or_else(|| FfmpegError::UnsupportedFormat("missing file extension".into()))?;

    let ext = extension.to_ascii_lowercase();

    const IMAGE_EXTENSIONS: &[&str] = &["png", "jpg", "jpeg", "gif", "bmp", "webp"];
    const VIDEO_EXTENSIONS: &[&str] = &["mp4", "avi", "mov", "mkv", "webm", "flv"];

    if IMAGE_EXTENSIONS.contains(&ext.as_str()) {
        Ok(false)
    } else if VIDEO_EXTENSIONS.contains(&ext.as_str()) {
        Ok(true)
    } else {
        Err(FfmpegError::UnsupportedFormat(ext))
    }
}

fn normalize_color(color: &str, opacity: u8) -> String {
    let alpha = (opacity as f32 / 100.0).clamp(0.0, 1.0);
    let base = if let Some(stripped) = color.strip_prefix('#') {
        format!("0x{}", stripped)
    } else {
        color.to_string()
    };
    format!("{}@{:.3}", base, alpha)
}

fn text_position_expression(config: &WatermarkConfig) -> (String, String) {
    if config.is_custom_position() {
        if let Some(custom_pos) = &config.custom_position {
            let x_expr = format!("max(0, min(w-text_w, w*{:.6}-text_w/2))", custom_pos.x);
            let y_expr = format!("max(0, min(h-text_h, h*{:.6}-text_h/2))", custom_pos.y);
            return (x_expr, y_expr);
        }
    }
    
    // Fallback to preset positioning
    let (x_static, y_static) = match config.position {
        WatermarkPosition::TopLeft => ("20", "20"),
        WatermarkPosition::TopCenter => ("(w-text_w)/2", "20"),
        WatermarkPosition::TopRight => ("w-text_w-20", "20"),
        WatermarkPosition::CenterLeft => ("20", "(h-text_h)/2"),
        WatermarkPosition::Center => ("(w-text_w)/2", "(h-text_h)/2"),
        WatermarkPosition::CenterRight => ("w-text_w-20", "(h-text_h)/2"),
        WatermarkPosition::BottomLeft => ("20", "h-text_h-20"),
        WatermarkPosition::BottomCenter => ("(w-text_w)/2", "h-text_h-20"),
        WatermarkPosition::BottomRight => ("w-text_w-20", "h-text_h-20"),
    };
    (x_static.to_string(), y_static.to_string())
}

fn overlay_position_expression(config: &WatermarkConfig) -> (String, String) {
    if config.is_custom_position() {
        if let Some(custom_pos) = &config.custom_position {
            let x_expr = format!("max(0, min(W-w, W*{:.6}-w/2))", custom_pos.x);
            let y_expr = format!("max(0, min(H-h, H*{:.6}-h/2))", custom_pos.y);
            return (x_expr, y_expr);
        }
    }
    
    // Fallback to preset positioning
    let (x_static, y_static) = match config.position {
        WatermarkPosition::TopLeft => ("20", "20"),
        WatermarkPosition::TopCenter => ("(W-w)/2", "20"),
        WatermarkPosition::TopRight => ("W-w-20", "20"),
        WatermarkPosition::CenterLeft => ("20", "(H-h)/2"),
        WatermarkPosition::Center => ("(W-w)/2", "(H-h)/2"),
        WatermarkPosition::CenterRight => ("W-w-20", "(H-h)/2"),
        WatermarkPosition::BottomLeft => ("20", "H-h-20"),
        WatermarkPosition::BottomCenter => ("(W-w)/2", "H-h-20"),
        WatermarkPosition::BottomRight => ("W-w-20", "H-h-20"),
    };
    (x_static.to_string(), y_static.to_string())
}

pub async fn extract_video_thumbnail(
    app: &AppHandle,
    video_path: &Path,
    output_path: &Path,
) -> Result<PathBuf, FfmpegError> {
    // Ensure FFmpeg is available
    let _ = get_ffmpeg_sidecar_path(app)?;

    // Validate that the input path exists
    if !video_path.exists() {
        return Err(FfmpegError::Path(format!(
            "Video file not found: {}",
            video_path.display()
        )));
    }

    // Validate that it's actually a video file
    let is_video = detect_file_type(video_path)?;
    if !is_video {
        return Err(FfmpegError::UnsupportedFormat(
            "File is not a video".into(),
        ));
    }

    // Build FFmpeg arguments for thumbnail extraction
    let mut args = Vec::new();
    args.push("-i".into());
    args.push(video_path.to_string_lossy().into_owned());
    args.push("-frames:v".into());
    args.push("1".into());
    args.push("-q:v".into());
    args.push("3".into());
    args.push("-y".into());
    args.push(output_path.to_string_lossy().into_owned());

    // Execute FFmpeg to extract the thumbnail
    spawn_ffmpeg(app, args).await?;

    Ok(output_path.to_path_buf())
}
