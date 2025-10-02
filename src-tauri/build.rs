use std::env;
use std::fs;
use std::path::Path;

fn main() {
    tauri_build::build();
    
    // Copy FFmpeg binary to target directory for development
    let target_dir = env::var("OUT_DIR").unwrap();
    let target_dir = Path::new(&target_dir)
        .ancestors()
        .nth(3)
        .unwrap()
        .to_path_buf();
    
    let ffmpeg_filename = if cfg!(target_os = "windows") {
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
        panic!("Unsupported target OS");
    };
    
    let source = Path::new("binaries").join(ffmpeg_filename);
    let dest = target_dir.join(ffmpeg_filename);
    
    // Only copy if source exists and destination doesn't exist or is older
    if source.exists() {
        if !dest.exists() || 
           fs::metadata(&source).unwrap().modified().unwrap() > 
           fs::metadata(&dest).unwrap().modified().unwrap() {
            if let Err(e) = fs::copy(&source, &dest) {
                println!("cargo:warning=Failed to copy FFmpeg binary: {}", e);
            } else {
                println!("cargo:warning=Copied FFmpeg binary to target directory");
            }
        }
    }
    
    println!("cargo:rerun-if-changed=binaries/{}", ffmpeg_filename);
}
