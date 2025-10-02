# Build script for Bulk Watermark Adder
# Run this to create production installers

Write-Host "🚀 Building Bulk Watermark Adder..." -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Clean previous builds
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}
if (Test-Path "src-tauri/target/release/bundle") {
    Remove-Item -Recurse -Force "src-tauri/target/release/bundle"
}
Write-Host ""

# Build the application
Write-Host "🔨 Building application..." -ForegroundColor Yellow
npm run tauri build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Build completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📦 Installers created:" -ForegroundColor Cyan
    
    $msiPath = "src-tauri\target\release\bundle\msi"
    $nsisPath = "src-tauri\target\release\bundle\nsis"
    
    if (Test-Path $msiPath) {
        Write-Host "   MSI:  $msiPath" -ForegroundColor White
        Get-ChildItem $msiPath -Filter "*.msi" | ForEach-Object {
            $sizeMB = [math]::Round($_.Length / 1MB, 2)
            Write-Host "         - $($_.Name) ($sizeMB MB)" -ForegroundColor Gray
        }
    }
    
    if (Test-Path $nsisPath) {
        Write-Host "   NSIS: $nsisPath" -ForegroundColor White
        Get-ChildItem $nsisPath -Filter "*.exe" | ForEach-Object {
            $sizeMB = [math]::Round($_.Length / 1MB, 2)
            Write-Host "         - $($_.Name) ($sizeMB MB)" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    Write-Host "📖 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Test the installers on a clean Windows machine" -ForegroundColor White
    Write-Host "   2. Upload to GitHub Releases or your distribution platform" -ForegroundColor White
    Write-Host "   3. Share with users!" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 For detailed distribution guide, see DISTRIBUTION.md" -ForegroundColor Yellow
    
} else {
    Write-Host ""
    Write-Host "❌ Build failed! Check the errors above." -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "   - Make sure all dependencies are installed: npm install" -ForegroundColor White
    Write-Host "   - Check that Rust is installed: rustc --version" -ForegroundColor White
    Write-Host "   - Try cleaning: Remove-Item -Recurse -Force node_modules, dist, src-tauri/target" -ForegroundColor White
    Write-Host ""
}
