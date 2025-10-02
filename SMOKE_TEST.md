# Smoke Test Checklist

This document provides a step-by-step checklist for smoke testing the Bulk Watermark Adder application before release. Focus on Windows, with notes for cross-platform testing.

## Pre-Test Setup

- [ ] **Build the installer**: Run `npm run tauri:build` and locate the installer in `src-tauri/target/release/bundle/`
- [ ] **Prepare test files**: Gather a variety of test images (PNG, JPG, GIF, BMP, WebP) and videos (MP4, AVI, MOV, MKV)
- [ ] **Clean environment**: Test on a fresh Windows installation or VM (no previous versions installed)
- [ ] **FFmpeg binary**: Verify `src-tauri/binaries/ffmpeg-x86_64-pc-windows-msvc.exe` exists before building

---

## 1. Installation (Windows)

### MSI Installer

- [ ] **Run the MSI installer** (`Bulk Watermark Adder_0.1.0_x64_en-US.msi`)
- [ ] **UAC prompt**: Verify the installer runs without requiring admin rights (if `installMode: "currentUser"`)
- [ ] **Installation directory**: Confirm the app installs to `%LOCALAPPDATA%\Programs\Bulk Watermark Adder\` (or `%PROGRAMFILES%` if admin install)
- [ ] **Start menu shortcut**: Verify a shortcut is created in the Start menu
- [ ] **Desktop shortcut**: Check if a desktop shortcut is created (if configured)
- [ ] **Installation completes**: No errors or warnings during installation

### NSIS Installer

- [ ] **Run the NSIS installer** (`Bulk Watermark Adder_0.1.0_x64-setup.exe`)
- [ ] **Installation wizard**: Verify the wizard displays correctly with all pages (welcome, license, directory, components, install, finish)
- [ ] **Installation directory**: Confirm the default directory is `%LOCALAPPDATA%\Bulk Watermark Adder\` (or `%PROGRAMFILES%` if admin install)
- [ ] **Start menu shortcut**: Verify a shortcut is created
- [ ] **Uninstaller**: Confirm an uninstaller is created in the installation directory
- [ ] **Installation completes**: No errors or warnings

---

## 2. First Launch

- [ ] **Launch the app** from the Start menu shortcut
- [ ] **Window opens**: The main window opens within 5 seconds
- [ ] **Window size**: Verify the window is 1200x800 pixels (or the configured size)
- [ ] **Window title**: Confirm the title bar shows "Bulk Watermark Adder"
- [ ] **UI loads**: All components render correctly (no blank screens or errors)
- [ ] **Default preset**: Verify the watermark configuration loads with default values (white text, bottom-right, 80% opacity)
- [ ] **No console errors**: Open DevTools (if enabled) and check for JavaScript errors

---

## 3. Core Features

### Watermark Configuration

- [ ] **Text watermark**: Enter custom text (e.g., "Test Watermark") and verify it updates in the preview
- [ ] **Text color**: Change the text color (e.g., red `#ff0000`) and verify the preview updates
- [ ] **Font size**: Adjust the font size slider (e.g., 72px) and verify the preview updates
- [ ] **Font family**: Change the font family (e.g., "Impact") and verify the preview updates
- [ ] **Position**: Test all 9 position presets (top-left, top-center, top-right, center-left, center, center-right, bottom-left, bottom-center, bottom-right) and verify the preview updates
- [ ] **Opacity**: Adjust the opacity slider (e.g., 50%) and verify the preview updates
- [ ] **Image watermark**: Switch to the "Image Watermark" tab, select a logo image, and verify it displays in the preview
- [ ] **Settings persist**: Close and reopen the app, verify the settings are restored

### File Selection

- [ ] **Add files**: Click "Add Files" and select multiple images (e.g., 5 JPG files)
- [ ] **File list**: Verify all files appear in the batch file list with correct names and types
- [ ] **Remove file**: Click the trash icon on a file and verify it's removed from the list
- [ ] **Add videos**: Click "Add Files" and select multiple videos (e.g., 3 MP4 files)
- [ ] **Mixed batch**: Verify the list shows both images and videos with correct type badges
- [ ] **Select file for preview**: Click a file in the list and verify the preview updates to show that file

### Preview

- [ ] **Image preview**: Verify the selected image displays in the preview canvas
- [ ] **Watermark overlay**: Verify the watermark (text or image) is overlaid on the preview
- [ ] **Real-time updates**: Change watermark settings and verify the preview updates immediately
- [ ] **Video preview**: Select a video file and verify a placeholder message is shown ("Video preview will be available after processing")
- [ ] **Large images**: Test with a large image (e.g., 4K resolution) and verify it scales to fit the canvas

### Processing

- [ ] **Select output directory**: Click the folder icon and select an output directory
- [ ] **Process button enabled**: Verify the "Process Files" button is enabled when files and output directory are selected
- [ ] **Start processing**: Click "Process Files" and verify processing starts
- [ ] **Progress display**: Verify the progress bar and per-file status table update in real-time
- [ ] **Processing completes**: Wait for all files to process and verify the results modal opens
- [ ] **Success notification**: Verify a green notification appears with the success count
- [ ] **Output files**: Navigate to the output directory and verify all files are created with `_watermarked` suffix
- [ ] **Watermark applied**: Open a processed file and verify the watermark is correctly applied

### Error Handling

- [ ] **No files selected**: Try to process without selecting files and verify an inline error is shown
- [ ] **No output directory**: Try to process without selecting an output directory and verify an inline error is shown
- [ ] **Invalid file**: Add a non-image/video file (e.g., `.txt`) and verify it's rejected or fails gracefully
- [ ] **Missing FFmpeg**: (Advanced) Rename the FFmpeg binary and restart the app, verify a clear error message is shown when processing
- [ ] **Read-only output directory**: Select a read-only directory and verify processing fails with a clear error message

---

## 4. Edge Cases

- [ ] **Empty text watermark**: Try to process with an empty text watermark and verify an error is shown
- [ ] **Missing watermark image**: Switch to image watermark without selecting an image and verify an error is shown
- [ ] **Very long text**: Enter a very long text (e.g., 200 characters) and verify it doesn't break the UI or preview
- [ ] **Special characters**: Enter text with special characters (e.g., `©`, `™`, `®`, emojis) and verify they render correctly
- [ ] **Large batch**: Process a large batch (e.g., 50+ files) and verify the app remains responsive
- [ ] **Cancel processing**: Start processing and click "Cancel", verify the UI stops updating (note: backend continues processing)
- [ ] **Minimize/restore**: Minimize the window during processing and restore it, verify the UI updates correctly
- [ ] **Multiple instances**: Try to launch a second instance of the app and verify it either opens a new window or focuses the existing one (depends on Tauri config)

---

## 5. Performance

- [ ] **Startup time**: Measure the time from launch to UI ready (should be < 5 seconds)
- [ ] **Preview rendering**: Measure the time to render a preview after changing settings (should be < 500ms)
- [ ] **Processing speed**: Measure the time to process a single image (should be < 5 seconds for a 1920x1080 image)
- [ ] **Batch processing**: Measure the time to process 10 images (should be < 60 seconds)
- [ ] **Memory usage**: Monitor memory usage during processing (should not exceed 500 MB for typical batches)
- [ ] **CPU usage**: Monitor CPU usage during processing (should spike during FFmpeg execution, then return to idle)

---

## 6. Uninstallation (Windows)

### MSI Uninstaller

- [ ] **Open "Add or Remove Programs"** in Windows Settings
- [ ] **Find the app**: Locate "Bulk Watermark Adder" in the list
- [ ] **Uninstall**: Click "Uninstall" and confirm
- [ ] **Uninstallation completes**: No errors or warnings
- [ ] **Files removed**: Verify the installation directory is deleted
- [ ] **Start menu shortcut removed**: Verify the shortcut is removed
- [ ] **Settings preserved**: (Optional) Check if user settings in `%APPDATA%` are preserved (for future reinstalls)

### NSIS Uninstaller

- [ ] **Run the uninstaller** from the installation directory or Start menu
- [ ] **Uninstallation wizard**: Verify the wizard displays correctly
- [ ] **Uninstallation completes**: No errors or warnings
- [ ] **Files removed**: Verify the installation directory is deleted
- [ ] **Start menu shortcut removed**: Verify the shortcut is removed

---

## 7. Cross-Platform Testing (Optional)

### macOS

- [ ] **Build DMG**: Run `npm run tauri:build` on macOS and locate the DMG in `src-tauri/target/release/bundle/`
- [ ] **Install**: Open the DMG and drag the app to the Applications folder
- [ ] **Launch**: Open the app from Applications and verify it launches without errors
- [ ] **Gatekeeper**: Verify the app passes Gatekeeper (if signed and notarized)
- [ ] **Core features**: Test watermark configuration, file selection, preview, and processing
- [ ] **Uninstall**: Drag the app to the Trash and verify it's removed

### Linux

- [ ] **Build AppImage**: Run `npm run tauri:build` on Linux and locate the AppImage in `src-tauri/target/release/bundle/`
- [ ] **Make executable**: Run `chmod +x Bulk_Watermark_Adder_0.1.0_amd64.AppImage`
- [ ] **Launch**: Run the AppImage and verify it launches without errors
- [ ] **Core features**: Test watermark configuration, file selection, preview, and processing
- [ ] **Uninstall**: Delete the AppImage file

---

## 8. Regression Testing

- [ ] **Previous bugs**: Verify that any bugs fixed in previous versions do not reappear
- [ ] **Breaking changes**: Verify that settings from previous versions are migrated correctly (if applicable)

---

## 9. Sign-Off

- [ ] **All tests passed**: Confirm that all critical tests passed
- [ ] **Known issues documented**: Document any known issues or limitations in the release notes
- [ ] **Release notes prepared**: Prepare release notes with new features, bug fixes, and known issues
- [ ] **Version bumped**: Verify the version number is updated in `package.json`, `Cargo.toml`, and `tauri.conf.json`
- [ ] **Git tag created**: Create a git tag for the release (e.g., `v0.1.0`)
- [ ] **Installer uploaded**: Upload the installer to the release distribution platform (GitHub Releases, website, etc.)

---

## Notes

- **Test environment**: Always test on a clean environment (fresh Windows install or VM) to catch installation issues
- **Test data**: Use a variety of test files (different formats, sizes, resolutions) to catch edge cases
- **Automation**: Consider automating some tests (e.g., unit tests, integration tests) to speed up regression testing
- **User feedback**: Encourage beta testers to report issues and provide feedback

---

## Appendix: Test Data

### Sample Images

- **Small**: 640x480 PNG (< 1 MB)
- **Medium**: 1920x1080 JPG (2-5 MB)
- **Large**: 4K (3840x2160) PNG (10-20 MB)
- **Formats**: PNG, JPG, JPEG, GIF, BMP, WebP
- **Special cases**: Transparent PNG, animated GIF, grayscale image

### Sample Videos

- **Short**: 10-second MP4 (< 10 MB)
- **Medium**: 1-minute MP4 (20-50 MB)
- **Long**: 5-minute MP4 (100-200 MB)
- **Formats**: MP4, AVI, MOV, MKV, WebM
- **Special cases**: 4K video, video with no audio, video with multiple audio tracks

This checklist ensures comprehensive testing of all critical features and edge cases before releasing the app to users.