mod commands;
mod ffmpeg;
mod types;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|_app| {
            // Spawn async task to cleanup old thumbnails on startup
            tauri::async_runtime::spawn(async move {
                // Clean thumbnails older than 7 days
                let _ = commands::cleanup_thumbnail_cache(Some(7)).await;
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::process_batch,
            commands::process_single_file,
            commands::extract_video_thumbnail,
            commands::cleanup_thumbnail_cache,
            commands::open_folder_in_explorer,
            commands::list_presets,
            commands::load_preset,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
