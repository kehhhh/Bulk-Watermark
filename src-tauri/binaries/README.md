# FFmpeg Sidecar Binaries

This directory stores platform-specific FFmpeg binaries that ship alongside the Bulk Watermark Adder application.

## Quick Setup (Recommended)

Run the helper script after installing dependencies:

```bash
npm install
npm run prepare:ffmpeg
```

The script copies the pinned binary provided by [`ffmpeg-static@5.2.0`](https://www.npmjs.com/package/ffmpeg-static) into this folder with the correct filename for your current platform. The version is locked in `package.json`, so you always get the same FFmpeg release.

> **Note:** The script prepares the binary for the host platform. If you build for multiple targets, rerun it on each platform (or adjust the script to point at the desired target mapping).

## Required Files

| Platform | Filename |
|----------|----------|
| Windows (x64) | `ffmpeg-x86_64-pc-windows-msvc.exe` |
| Linux (x64) | `ffmpeg-x86_64-unknown-linux-gnu` |
| macOS (Intel) | `ffmpeg-x86_64-apple-darwin` |
| macOS (Apple Silicon) | `ffmpeg-aarch64-apple-darwin` |

Tauri automatically picks the correct file for the active target triple when bundling.

## Manual Download Sources

If your target architecture is not covered by `ffmpeg-static`, or you prefer to manage the binary yourself, use the reference sources below.

### Windows & Linux

1. Visit the [BtbN FFmpeg Builds](https://github.com/BtbN/FFmpeg-Builds/releases) page.
2. Download the release that matches the version you need.
3. Extract the archive and locate the `ffmpeg` binary inside the `bin/` directory.
4. Rename it to match the filename in the table above.
5. Place the binary in this directory.

### macOS

1. Visit [Martin Riedl's FFmpeg builds](https://ffmpeg.martin-riedl.de/).
2. Download the build for your architecture (Intel or Apple Silicon).
3. Extract the archive and locate the `ffmpeg` binary.
4. Rename it to `ffmpeg-x86_64-apple-darwin` (Intel) or `ffmpeg-aarch64-apple-darwin` (Apple Silicon).
5. Copy the renamed binary into this directory.

## Verification

After downloading, verify the binaries locally:

```bash
# Windows
./ffmpeg-x86_64-pc-windows-msvc.exe -version

# Linux
./ffmpeg-x86_64-unknown-linux-gnu -version

# macOS
./ffmpeg-x86_64-apple-darwin -version
./ffmpeg-aarch64-apple-darwin -version
```

Each command should print FFmpeg version information.

## Git Ignore

Large binaries are not committed to source control. Ensure your `.gitignore` includes:

```
src-tauri/binaries/ffmpeg-*
```

This repository already tracks this README and a `.gitignore` file to document setup steps.

## CI/CD

In automated environments, run the helper script after installing dependencies:

```yaml
- run: npm ci
- run: npm run prepare:ffmpeg
```

If you need an architecture that `ffmpeg-static` does not cover, fall back to the manual download instructions above.

## Troubleshooting

- **Binary not found**: Ensure the filename exactly matches the required target triple.
- **Permission denied**: Run `chmod +x ffmpeg-*` on Unix-like platforms after copying the binary.
- **Notarization issues (macOS)**: Prefer Martin Riedl's signed builds to avoid packaging failures.
- **Wrong architecture**: Download the binary that matches your build target (e.g., arm64 vs x86_64).
