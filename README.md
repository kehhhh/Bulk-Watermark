# Bulk Watermark Adder

A modern, user-friendly desktop application for bulk watermarking images and videos with a beautiful, intuitive interface. Built with Tauri v2, React, TypeScript, and Mantine.

## ✨ Features

- 🎨 **Modern, Intuitive UI** - Card-based design with smooth animations and transitions
- 📱 **Responsive Layout** - Adapts seamlessly to any screen size with sticky sidebar on desktop
- 🖼️ **Real-time Preview** - Drag-and-drop watermark positioning with live preview
- ⚙️ **Flexible Watermarks** - Support for both text and image watermarks
- 🎭 **8 Built-in Preset Styles** - Quick-apply watermark styles for different use cases
- 🔄 **Preset Selector** - Easy one-click style application with automatic preset detection
- 📦 **Batch Processing** - Process multiple images and videos at once
- 📊 **Visual Progress Tracking** - Detailed status indicators with ring progress and timeline views
- 🎯 **Smart Positioning** - Preset positions or custom drag-to-place positioning
- 🌓 **Dark Mode Support** - Automatic theme switching based on system preferences
- ⌨️ **Keyboard Shortcuts** - Power user features for quick workflows
- ♿ **Accessible** - Built with accessibility in mind using Mantine's components

## � Watermark Presets

The app includes 8 professionally designed preset styles for common watermarking scenarios:

- **Default** - Simple white text in bottom-right corner (classic watermark style)
- **Subtle** - Small, semi-transparent text for minimal branding
- **Professional** - Gray text in bottom-left for business use
- **Bold** - Large, high-contrast centered text for maximum visibility
- **Photography** - Elegant watermark for professional photos with subtle branding
- **Social Media** - Eye-catching style optimized for Instagram, TikTok, and other platforms
- **Copyright** - Clear legal copyright notice for formal attribution
- **Diagonal** - Large centered watermark for maximum protection against unauthorized use

**Features:**
- One-click preset application from the dropdown selector
- Customize any preset to create your own configurations
- Automatic detection shows when you're using a preset vs custom settings
- Your last used preset or custom config is saved and restored on app restart
- Add your own custom presets by placing JSON files in `src-tauri/resources/presets/`

## �🎯 UI/UX Highlights

- **Modern Design System** - Custom Mantine theme with enhanced colors, spacing, and typography
- **Card-Based Layout** - Organized interface with clear visual hierarchy
- **Preset Selector** - Quick access to professionally designed watermark styles
- **Sticky Sidebar** - Easy access to settings and file list on desktop
- **Smooth Animations** - Transitions and effects for a polished experience
- **Visual Feedback** - Progress rings, badges, and status indicators throughout
- **Collapsible Sections** - Advanced options tucked away for cleaner interface
- **Empty States** - Helpful guidance when no files are selected
- **Validation Checklist** - Clear indicators of what's needed before processing

## 🛠️ Tech Stack

- **Frontend**: Vite + React 18 + TypeScript
- **UI Library**: Mantine v8 with custom theme (accessible component library)
- **Backend**: Tauri v2 (Rust)
- **Canvas**: Konva for interactive watermark preview
- **Styling**: Custom CSS with Mantine design tokens
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint + Prettier

## Prerequisites

- Node.js 18+ and npm (or pnpm/yarn)
- Rust 1.70+ (install via [rustup](https://rustup.rs/))
- Platform-specific dependencies for Tauri:
  - **Windows**: Microsoft Visual Studio C++ B### Resources

- [Tauri v2 Docs](https://v2.tauri.app/)
- [Mantine v8 Docs](https://mantine.dev/)
- [Vite Docs](https://vitejs.dev/)
- [Tauri Store Plugin Docs](https://tauri.app/plugin/store/)
- [Tauri Dialog Plugin Docs](https://tauri.app/plugin/dialog/)
- [Tauri Shell Plugin Docs](https://tauri.app/plugin/shell/)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [BtbN FFmpeg Builds](https://github.com/BtbN/FFmpeg-Builds)
- [Martin Riedl macOS FFmpeg Builds](https://ffmpeg.martin-riedl.de/)
- [Vitest Docs](https://vitest.dev/)
- [React Testing Library Docs](https://testing-library.com/react) WebView2 (usually pre-installed on Windows 10/11)
  - **macOS**: Xcode Command Line Tools
  - **Linux**: See [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

## Getting Started

1. **Install dependencies**:

	```bash
	npm install
	```

2. **Run the app in development mode**:

	```bash
	npm run tauri:dev
	```

	This starts the Vite dev server and opens the Tauri window.

3. **Build for production**:

	```bash
	npm run tauri:build
	```

## 🚀 Usage

1. **Choose a Watermark Style** - Select from 8 built-in presets or customize your own
2. **Configure Settings** - Adjust text, colors, opacity, fonts, and positioning
3. **Add Files** - Drag & drop or select images/videos to watermark
4. **Preview** - See your watermark live with drag-to-position capability
5. **Process** - Batch process all files with visual progress tracking

The app remembers your last used preset or custom configuration for quick workflow resumption.

	Installers will be generated in `src-tauri/target/release/bundle/`.

## Available Scripts

- `npm run dev` — Start Vite dev server (frontend only, for browser testing)
- `npm run build` — Build the frontend for production
- `npm run tauri:dev` — Run the Tauri app in development mode (recommended)
- `npm run tauri:build` — Build and bundle the Tauri app for distribution
- `npm run lint` — Lint TypeScript/React code with ESLint
- `npm run format` — Format code with Prettier
- `npm run format:check` — Check code formatting without modifying files
- `npm test` — Run tests in watch mode
- `npm run test:run` — Run tests once (for CI)
- `npm run test:ui` — Run tests with Vitest UI
- `npm run test:coverage` — Run tests with coverage report

## Project Structure

```
.
├── src/                  # React frontend source
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # React entry point with MantineProvider
│   ├── index.css         # Global styles
│   ├── vite-env.d.ts     # Vite TypeScript types
│   ├── components/
│   │   ├── ProcessingPanel.tsx      # Output dir selection + process button
│   │   ├── ProgressDisplay.tsx      # Real-time progress table
│   │   ├── ResultsSummary.tsx       # Post-processing results modal
│   │   └── __tests__/               # Component tests
│   ├── hooks/
│   │   ├── useWatermarkProcessor.ts # Processing hook (invoke + events)
│   │   └── __tests__/               # Hook tests
│   └── test/
│       ├── setup.ts                 # Test setup (matchers, cleanup)
│       └── mocks.ts                 # Tauri API mocks
├── src-tauri/            # Rust backend
│   ├── src/
│   │   ├── lib.rs        # Tauri app entry point
│   │   └── main.rs       # Desktop entry stub
│   ├── icons/            # App icons
│   ├── Cargo.toml        # Rust dependencies
│   └── tauri.conf.json   # Tauri configuration
├── index.html            # HTML entry point
├── vite.config.ts        # Vite configuration
├── vitest.config.ts      # Vitest test configuration
├── tsconfig.json         # TypeScript configuration
├── .eslintrc.cjs         # ESLint configuration
├── .prettierrc           # Prettier configuration
└── package.json          # Node.js dependencies and scripts
```

## Features Implemented (Phase 2: Watermark UI)

### Watermark Configuration
- **Text Watermark**: Add custom text with configurable font, size, and color
- **Image Watermark**: Upload a logo or image to use as a watermark
- **Position Control**: 9 preset positions (corners, edges, center)
- **Opacity Control**: Adjust transparency from 0-100%
- **Live Preview**: Real-time canvas preview of watermark on selected images

### Batch File Management
- Select multiple images and videos using native file dialogs
- Supported formats:
  - **Images**: PNG, JPG, JPEG, GIF, BMP, WebP
  - **Videos**: MP4, AVI, MOV, MKV, WebM, FLV
- View selected files in a table with type badges
- Remove individual files or clear all
- Click a file to preview it with the current watermark settings

### Persistence
- Watermark settings are automatically saved to local storage
- Settings persist across app restarts
- Uses Tauri's store plugin for secure, native storage

### Component Architecture

```
src/
├── pages/
│   └── Home.tsx                 # Main editor page (orchestrates UI)
├── components/
│   ├── WatermarkControls.tsx    # Watermark config panel (tabs, inputs, sliders)
│   ├── FileList.tsx             # Batch file list with add/remove
│   └── PreviewCanvas.tsx        # Canvas-based live preview
├── hooks/
│   ├── useWatermarkStore.ts     # Persistence hook (Tauri store plugin)
│   └── useFileSelection.ts      # File dialog hook (Tauri dialog plugin)
├── types/
│   └── watermark.ts             # TypeScript types and defaults
└── utils/
	 └── canvas.ts                # Canvas drawing utilities
```

### Usage

1. **Configure Watermark**:
	- Choose "Text Watermark" or "Image Watermark" tab
	- For text: enter text, choose font, size, and color
	- For image: click "Select Watermark Image" to choose a logo
	- Adjust position and opacity using the controls

2. **Add Files**:
	- Click "Add Files" in the Batch Files section
	- Select one or more images or videos
	- Files appear in the table below

3. **Preview**:
	- The first selected file is previewed automatically
	- Click any file in the list to preview it
	- The preview updates in real-time as you adjust settings

4. **Next Steps**:
	- The actual watermark processing (applying to files) will be implemented in the next phase
	- For now, you can configure and preview your watermark settings

### Troubleshooting

- **Preview not showing**: Ensure the file path is valid and the image format is supported
- **Watermark image not loading**: Check that the selected image is a valid PNG/JPG file
- **Settings not persisting**: Verify the Tauri store plugin is properly installed (run `npm run tauri add store` if needed)
- **File dialog not opening**: Ensure the Tauri dialog plugin is installed and permissions are granted in `src-tauri/capabilities/default.json`

## Features Implemented (Phase 3: FFmpeg Processing Backend)

### Rust Commands

The backend now exposes two Tauri commands for watermark processing.

#### `process_single_file`

Process a single image or video file with a watermark.

**Parameters:**
- `input_path: string` — Full path to the input file
- `output_path: string` — Full path where the processed file should be saved
- `config: WatermarkConfig` — Watermark configuration (matches TypeScript type)

**Returns:**
- `FileResult` — Processing result with status, output path, and error (if any)

**Example (TypeScript):**

```typescript
import { invoke } from '@tauri-apps/api/core'

const result = await invoke<FileResult>('process_single_file', {
	inputPath: 'C:/media/image.jpg',
	outputPath: 'C:/media/image_watermarked.jpg',
	config: watermarkConfig,
})
```

#### `process_batch`

Process multiple files with progress events.

**Parameters:**
- `files: FileItem[]` — Array of files to process
- `config: WatermarkConfig` — Watermark configuration
- `output_dir: string` — Directory where processed files should be saved

**Returns:**
- `BatchResult` — Overall results with per-file status and counts

**Events emitted:**
- `watermark-progress` — Emitted for each file (start and completion)
- `watermark-complete` — Emitted when all files are processed

**Example (TypeScript):**

```typescript
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

const unlisten = await listen<ProgressPayload>('watermark-progress', (event) => {
	const { filePath, fileIndex, totalFiles, status } = event.payload
	console.log(`File ${fileIndex + 1}/${totalFiles}: ${filePath} (${status})`)
})

const result = await invoke<BatchResult>('process_batch', {
	files: selectedFiles,
	config: watermarkConfig,
	outputDir: 'C:/media/output',
})

await unlisten()
```

### FFmpeg Integration

The app relies on FFmpeg sidecar binaries for watermark processing.

#### Supported Operations

- **Text watermarks** powered by the `drawtext` filter (font, color, opacity, position)
- **Image watermarks** powered by the `overlay` filter with adjustable opacity
- **Videos** retain original audio streams via `-c:a copy`
- **Images** output a single processed frame with `-frames:v 1`

#### Supported Formats

- **Images**: PNG, JPG, JPEG, GIF, BMP, WebP
- **Videos**: MP4, AVI, MOV, MKV, WebM, FLV

#### FFmpeg Binary Setup

FFmpeg binaries are **not committed** to the repository. Use the helper script to pull the pinned version:

```bash
npm install
npm run prepare:ffmpeg
```

This copies the binary shipped with [`ffmpeg-static@5.2.0`](https://www.npmjs.com/package/ffmpeg-static) into `src-tauri/binaries/` using the correct filename for your current platform. Because the dependency version is locked, upgrades only happen when you deliberately bump it.

If you need to build for a different architecture, rerun the script on that platform or follow the manual instructions in `src-tauri/binaries/README.md`.

Without these binaries the commands fail with **"FFmpeg binary not found"**.

### Event API

The backend emits rich progress events that the frontend can subscribe to.

#### Event: `watermark-progress`

**Payload:**

```typescript
interface ProgressPayload {
	filePath: string
	fileIndex: number
	totalFiles: number
	status: 'processing' | 'complete' | 'error'
}
```

Emitted when each file starts and finishes processing.

#### Event: `watermark-complete`

**Payload:**

```typescript
interface BatchResult {
	files: FileResult[]
	total: number
	successful: number
	failed: number
}
```

Fires after the batch has completed.

### Type Definitions

Rust structs and enums in `src-tauri/src/types.rs` mirror the TypeScript definitions in `src/types/watermark.ts`, ensuring consistent serialization across IPC boundaries.

### Error Handling

- Missing input files return `FileResult` with `status: "failed"`
- Invalid watermark configuration (empty text or missing image) is reported as a structured error
- Unsupported formats surface clear messages (images vs. videos)
- FFmpeg stderr is propagated when processing fails
- Catastrophic failures (missing sidecar binary) reject the command outright

### Architecture

- `src-tauri/src/types.rs` — Shared data models
- `src-tauri/src/ffmpeg.rs` — Filter construction, sidecar execution, and file-type detection
- `src-tauri/src/commands.rs` — Tauri commands, batching logic, and event emission

### Troubleshooting

- **"FFmpeg binary not found"**: Run `npm run prepare:ffmpeg` to copy the pinned binary into `src-tauri/binaries/`
- **"Input file not found"**: Pass absolute paths and ensure the files exist
- **"Unsupported file format"**: Verify the extension is supported (see list above)
- **No text watermark**: Confirm the requested font is available on the host system
- **Permission denied (Unix)**: Mark binaries as executable (`chmod +x ffmpeg-*`)

### Next Steps

- Wire the React UI to invoke commands and display progress
- Allow users to select an output directory from the UI
- Surface success/error summaries in the frontend

## Features Implemented (Phase 4: Processing UI & Queue Manager)

### Processing Workflow

The app now provides a complete end-to-end workflow for batch watermarking:

1. **Configure watermark** (text or image, position, opacity, colors)
2. **Select files** (images and/or videos)
3. **Preview** (live canvas preview with watermark overlay)
4. **Select output directory** (where processed files will be saved)
5. **Process** (invoke backend with real-time progress updates)
6. **Review results** (summary modal with success/error details)

### New Components

#### ProcessingPanel

Main control panel for batch processing.

**Features:**
- Output directory selection via native file dialog
- "Process Files" button (disabled until files and output dir are selected)
- "Cancel" button (appears during processing, UI-only cancellation)
- Validation feedback (inline errors for missing inputs)
- Loading state during processing

**Location:** `src/components/ProcessingPanel.tsx`

#### ProgressDisplay

Real-time progress visualization.

**Features:**
- Overall progress bar with percentage
- Per-file status table with badges (Processing, Complete, Failed)
- File count display (e.g., "3 / 10 files")
- Auto-scrolling table for large batches
- Color-coded status indicators

**Location:** `src/components/ProgressDisplay.tsx`

#### ResultsSummary

Post-processing results modal.

**Features:**
- Summary badges (successful, failed, total counts)
- Success/error alerts
- Accordion with detailed per-file results
- Error messages for failed files (with full FFmpeg output)
- "Close" button to dismiss modal

**Location:** `src/components/ResultsSummary.tsx`

### Processing Hook

#### useWatermarkProcessor

Custom React hook that manages the entire processing lifecycle.

**Features:**
- Invokes `process_batch` Tauri command
- Listens to `watermark-progress` and `watermark-complete` events
- Tracks processing state (idle, processing, complete, error, cancelled)
- Maintains per-file progress in a Map (keyed by file path)
- Validates inputs before invoking backend
- Supports UI-only cancellation (ignores events after cancel)
- Provides cleanup on unmount (unlistens from events)

**API:**
```typescript
const {
  processBatch,        // (files, config, outputDir) => void
  cancelProcessing,    // () => void
  processingState,     // 'idle' | 'processing' | 'complete' | 'error' | 'cancelled'
  isProcessing,        // boolean
  progressArray,       // ProgressPayload[]
  result,              // BatchResult | null
  error,               // string | null
} = useWatermarkProcessor()
```

**Location:** `src/hooks/useWatermarkProcessor.ts`

### Event Handling

The UI subscribes to backend events for real-time updates:

- **watermark-progress**: Emitted when each file starts/completes processing
  - Updates the progress table with per-file status
  - Increments the progress bar
- **watermark-complete**: Emitted when the entire batch finishes
  - Opens the results summary modal
  - Shows a success/error notification

**Event flow:**
1. User clicks "Process Files"
2. `processBatch` invokes the Rust command
3. Backend emits `watermark-progress` for each file (start and completion)
4. UI updates the progress table and bar in real-time
5. Backend emits `watermark-complete` with final results
6. UI shows a notification and opens the results modal

### Error Handling

The app handles errors at multiple levels:

1. **Validation errors** (frontend):
   - Empty files array → inline error: "Add files before processing"
   - Empty output directory → inline error: "Please select an output directory"
   - Invalid watermark config (empty text, missing image) → inline error with specific message

2. **Per-file errors** (backend):
   - File not found, unsupported format, FFmpeg errors → displayed in `FileResult.error`
   - Shown in the results modal with full error messages
   - Progress table shows "Failed" badge with red color

3. **Catastrophic errors** (backend):
   - FFmpeg binary missing, output directory creation failed → command rejects with error
   - Shown as a toast notification (red, top-right)
   - Processing state set to 'error'

4. **Notifications**:
   - Success: Green notification with success count
   - Error: Red notification with error message
   - Cancelled: Yellow notification ("Processing cancelled by user")

### Cancellation

**Current implementation (MVP):**
- UI-only cancellation: clicking "Cancel" sets a flag that ignores subsequent events
- Backend continues processing (no way to kill FFmpeg sidecars yet)
- Processing state changes to 'cancelled'
- User sees a notification: "Processing cancelled by user"

**Limitation:**
- The backend will finish processing all files, but the UI stops updating
- Output files will still be created

**Future enhancement:**
- Implement backend cancellation by killing FFmpeg processes
- Requires tracking process IDs and exposing a `cancel_batch` command
- Document this as a known limitation in the UI (tooltip on Cancel button)

### Output Directory Selection

The app uses Tauri's dialog plugin to select the output directory:

- Native directory picker (Windows Explorer, macOS Finder, Linux file manager)
- Selected path is displayed in a read-only TextInput
- Path is validated before processing (must not be empty)
- Output files are named: `{original_filename}_watermarked.{extension}`

**Example:**
- Input: `C:/media/photo.jpg`
- Output: `C:/output/photo_watermarked.jpg`

### Testing

The app now includes a complete test infrastructure:

#### Test Stack
- **Vitest**: Fast, Vite-native test runner with ESM support
- **React Testing Library**: Component testing utilities
- **jsdom**: DOM environment for tests
- **@testing-library/jest-dom**: Custom matchers for DOM assertions

#### Test Scripts
- `npm test` — Run tests in watch mode (for development)
- `npm run test:run` — Run tests once (for CI)
- `npm run test:ui` — Run tests with Vitest UI (visual test runner)
- `npm run test:coverage` — Run tests with coverage report

#### Mocks

The app provides mock implementations for Tauri APIs:

- **mockInvoke**: Simulates `invoke` calls with configurable responses
- **mockListen**: Simulates event listeners with manual event triggering
- **mockDialog**: Simulates file/directory dialogs
- **mockStore**: Simulates LazyStore with in-memory storage

**Location:** `src/test/mocks.ts`

#### Example Tests

**Hook test** (`src/hooks/__tests__/useWatermarkProcessor.test.ts`):
- Tests initial state, successful batch processing, validation errors, catastrophic errors, cancellation, and cleanup

**Component test** (`src/components/__tests__/ProcessingPanel.test.tsx`):
- Tests rendering, output directory selection, process button click, validation, cancel button, and disabled states

#### Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once (for CI)
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Integration with Existing UI

The processing UI is integrated into the Home page below the existing grid:

1. **Top section** (existing):
   - Left column: WatermarkControls + FileList
   - Right column: PreviewCanvas

2. **Bottom section** (new):
   - ProcessingPanel (output dir selection + process button)
   - ProgressDisplay (only visible during/after processing)
   - ResultsSummary (modal, opens after completion)

**Layout:**
- Responsive: stacks vertically on mobile, side-by-side on desktop
- Consistent spacing with Mantine's Stack and Grid components
- Smooth transitions between states (idle → processing → complete)

### Known Limitations

1. **No backend cancellation**: Clicking "Cancel" only stops UI updates; backend continues processing
2. **No parallel processing**: Files are processed sequentially (one at a time)
3. **No progress percentage per file**: Progress is binary (processing/complete/error), not 0-100%
4. **No video preview**: Video files show a placeholder in the preview canvas
5. **No output directory validation**: The app doesn't check if the directory is writable before processing

**Future enhancements:**
- Implement backend cancellation (kill FFmpeg processes)
- Add parallel processing with a configurable thread pool
- Parse FFmpeg stderr for per-file progress percentage
- Add video preview using HTML5 video element
- Validate output directory permissions before processing

### Troubleshooting

- **"Please select an output directory" error**: Click the folder icon to select a directory before processing
- **"Add files before processing" warning**: Use the "Add Files" button to select files
- **Processing stuck**: Check the console for errors; ensure FFmpeg binaries are present in `src-tauri/binaries/`
- **Cancel button doesn't stop processing**: This is expected (UI-only cancellation); backend will finish processing
- **Results modal doesn't open**: Check the browser console for errors; ensure event listeners are registered
- **Tests fail**: Ensure all dependencies are installed (`npm install`) and Vitest config is correct

## Building & Distribution

This section covers building the app for production and distributing it to users.

### Prerequisites for Building

1. **All development prerequisites** (Node.js, Rust, platform-specific dependencies)
2. **FFmpeg binary**: Run `npm run prepare:ffmpeg` to download the pinned FFmpeg binary
3. **Code signing certificate** (optional, for signed builds):
   - **Windows**: Authenticode certificate (`.pfx` or `.p12` file)
   - **macOS**: Apple Developer ID certificate (in Keychain)
   - **Linux**: No signing required for most distributions

### Building for Production

#### Windows

**Build command:**
```bash
npm run tauri:build
```

This generates two installer types in `src-tauri/target/release/bundle/`:

1. **MSI installer** (`msi/Bulk Watermark Adder_0.1.0_x64_en-US.msi`):
   - Built with WiX Toolset
   - Standard Windows installer format
   - Supports silent installation: `msiexec /i installer.msi /quiet`
   - Recommended for enterprise deployments

2. **NSIS installer** (`nsis/Bulk Watermark Adder_0.1.0_x64-setup.exe`):
   - Built with NSIS (Nullsoft Scriptable Install System)
   - More customizable than MSI
   - Smaller file size
   - Recommended for consumer distribution

**Installer options:**

- **Install mode**: Set in `tauri.conf.json` → `bundle.windows.nsis.installMode`
  - `"currentUser"`: Installs to `%LOCALAPPDATA%`, no admin rights required (recommended)
  - `"perMachine"`: Installs to `%PROGRAMFILES%`, requires admin rights

- **Compression**: Set in `tauri.conf.json` → `bundle.windows.nsis.compression`
  - `"lzma"`: Best compression (default)
  - `"bzip2"`: Faster compression
  - `"none"`: No compression (fastest build)

**Code signing (Windows):**

1. Obtain an Authenticode certificate (e.g., from DigiCert, Sectigo)
2. Export the certificate to a `.pfx` file with a password
3. Set the certificate thumbprint in `tauri.conf.json` → `bundle.windows.certificateThumbprint`
4. Build with signing:
   ```bash
   $env:TAURI_SIGNING_PRIVATE_KEY = (Get-Content path/to/cert.pfx -Raw)
   $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "your-password"
   npm run tauri:build
   ```
5. Verify the signature: Right-click the installer → Properties → Digital Signatures

**Troubleshooting:**

- **"FFmpeg binary not found"**: Run `npm run prepare:ffmpeg` before building
- **"WiX Toolset not found"**: Install WiX Toolset v3.11+ from https://wixtoolset.org/
- **"NSIS not found"**: Install NSIS from https://nsis.sourceforge.io/
- **Installer too large**: Check that `node_modules` and `src-tauri/target` are excluded from the bundle

#### macOS

**Build command:**
```bash
npm run tauri:build
```

This generates two bundle types in `src-tauri/target/release/bundle/`:

1. **DMG installer** (`dmg/Bulk Watermark Adder_0.1.0_x64.dmg`):
   - Disk image for distribution
   - Users drag the app to the Applications folder
   - Recommended for distribution

2. **App bundle** (`macos/Bulk Watermark Adder.app`):
   - Standalone app bundle
   - Can be zipped and distributed
   - Used for testing or direct distribution

**Code signing (macOS):**

1. Enroll in the Apple Developer Program ($99/year)
2. Create a Developer ID Application certificate in Xcode or the Apple Developer portal
3. Install the certificate in your Keychain
4. Set the signing identity in `tauri.conf.json` → `bundle.macOS.signingIdentity`
5. Build with signing:
   ```bash
   npm run tauri:build
   ```
6. Verify the signature:
   ```bash
   codesign -dv --verbose=4 "src-tauri/target/release/bundle/macos/Bulk Watermark Adder.app"
   ```

**Notarization (macOS):**

Notarization is required for distribution outside the Mac App Store (Gatekeeper requirement).

1. After building and signing, notarize the app:
   ```bash
   xcrun notarytool submit "src-tauri/target/release/bundle/dmg/Bulk Watermark Adder_0.1.0_x64.dmg" \
     --apple-id "your-apple-id@example.com" \
     --password "app-specific-password" \
     --team-id "YOUR_TEAM_ID" \
     --wait
   ```
2. Staple the notarization ticket:
   ```bash
   xcrun stapler staple "src-tauri/target/release/bundle/dmg/Bulk Watermark Adder_0.1.0_x64.dmg"
   ```
3. Verify notarization:
   ```bash
   spctl -a -vv "src-tauri/target/release/bundle/macos/Bulk Watermark Adder.app"
   ```

**Troubleshooting:**

- **"Code signing failed"**: Ensure the certificate is installed in Keychain and the identity is correct
- **"Notarization failed"**: Check the notarization log for errors (hardened runtime, entitlements, etc.)
- **"App is damaged"**: The app is not notarized; users must right-click → Open to bypass Gatekeeper

#### Linux

**Build command:**
```bash
npm run tauri:build
```

This generates two package types in `src-tauri/target/release/bundle/`:

1. **AppImage** (`appimage/bulk-watermark_0.1.0_amd64.AppImage`):
   - Portable, self-contained executable
   - No installation required
   - Works on most Linux distributions
   - Recommended for distribution

2. **Debian package** (`deb/bulk-watermark_0.1.0_amd64.deb`):
   - For Debian-based distributions (Ubuntu, Mint, etc.)
   - Installs to `/usr/bin/` and `/usr/share/`
   - Integrates with the system package manager

**Installation:**

- **AppImage**: Make executable and run:
  ```bash
  chmod +x bulk-watermark_0.1.0_amd64.AppImage
  ./bulk-watermark_0.1.0_amd64.AppImage
  ```

- **Debian package**: Install with `dpkg`:
  ```bash
  sudo dpkg -i bulk-watermark_0.1.0_amd64.deb
  sudo apt-get install -f  # Install dependencies
  ```

**Troubleshooting:**

- **"Missing dependencies"**: Install required libraries (see Prerequisites)
- **"AppImage won't run"**: Ensure FUSE is installed: `sudo apt-get install fuse libfuse2`

### Cross-Platform Builds

To build for multiple platforms, you must build on each platform (cross-compilation is not fully supported by Tauri).

**Recommended approach:**

1. **Use CI/CD**: Set up GitHub Actions (see `.github/workflows/release.yml`) to build on all platforms automatically
2. **Use VMs**: Set up virtual machines for each platform (Windows, macOS, Linux) and build locally
3. **Use cloud services**: Use services like GitHub Actions, CircleCI, or Travis CI for automated builds

### Continuous Integration / Continuous Deployment (CI/CD)

The repository includes GitHub Actions workflows for automated builds and testing:

- **`.github/workflows/release.yml`**: Builds installers for all platforms on git tags (e.g., `v0.1.0`)
- **`.github/workflows/test.yml`**: Runs tests and linters on pull requests and pushes

**Usage:**

1. **Create a release**:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```
2. **GitHub Actions runs**: Builds installers for Windows, macOS, and Linux
3. **Draft release created**: Review the draft release on GitHub, add release notes, and publish

**Secrets required** (set in GitHub repository settings → Secrets):

- `TAURI_SIGNING_PRIVATE_KEY`: Private key for code signing (optional)
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: Password for the private key
- `CODECOV_TOKEN`: Token for uploading test coverage to Codecov (optional)

### Distribution

#### GitHub Releases

The recommended distribution method for open-source projects.

1. **Create a release** on GitHub (manually or via CI/CD)
2. **Upload installers** as release assets
3. **Write release notes** with new features, bug fixes, and known issues
4. **Publish the release**

Users can download installers from the Releases page.

#### Website / Direct Download

Host installers on your own website or CDN.

1. **Upload installers** to your web server or CDN (e.g., AWS S3, Cloudflare R2)
2. **Create a download page** with links to installers for each platform
3. **Add version information** and release notes

#### Package Managers

- **Windows**: Publish to Chocolatey, Scoop, or winget
- **macOS**: Publish to Homebrew Cask
- **Linux**: Publish to Flathub (Flatpak), Snap Store (Snap), or AUR (Arch User Repository)

(Package manager publishing is beyond the scope of this MVP; see respective documentation for details.)

### Updater (Future Enhancement)

The app includes updater configuration in `tauri.conf.json` (currently disabled).

**To enable the updater:**

1. **Generate signing keys**:
   ```bash
   npm run tauri signer generate -- -w ~/.tauri/myapp.key
   ```
2. **Set the public key** in `tauri.conf.json` → `updater.pubkey`
3. **Set the update endpoint** in `tauri.conf.json` → `updater.endpoints`
4. **Enable the updater**: Set `updater.active` to `true`
5. **Host update manifests** on your server (JSON files with version info and download URLs)
6. **Sign releases** with the private key during builds

See the [Tauri Updater documentation](https://tauri.app/v1/guides/distribution/updater/) for details.

### Versioning

The app uses semantic versioning (SemVer): `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (e.g., `1.0.0` → `2.0.0`)
- **MINOR**: New features, backward-compatible (e.g., `1.0.0` → `1.1.0`)
- **PATCH**: Bug fixes, backward-compatible (e.g., `1.0.0` → `1.0.1`)

**Update version numbers** in:

- `package.json` → `version`
- `src-tauri/Cargo.toml` → `package.version`
- `src-tauri/tauri.conf.json` → `version`

**Tip**: Use a script to update all version numbers at once:

```bash
npm version 0.2.0
# This updates package.json and creates a git tag
# Manually update Cargo.toml and tauri.conf.json
```

### Release Checklist

Before releasing a new version:

- [ ] Update version numbers in `package.json`, `Cargo.toml`, and `tauri.conf.json`
- [ ] Run `npm run prepare:ffmpeg` to ensure FFmpeg binary is present
- [ ] Run `npm run lint` and `npm run format` to ensure code quality
- [ ] Run `npm run test:run` to ensure all tests pass
- [ ] Build installers for all platforms: `npm run tauri:build`
- [ ] Run smoke tests (see `SMOKE_TEST.md`) on all platforms
- [ ] Write release notes with new features, bug fixes, and known issues
- [ ] Create a git tag: `git tag v0.2.0 && git push origin v0.2.0`
- [ ] Create a GitHub Release and upload installers
- [ ] Announce the release (social media, mailing list, etc.)

## 📦 Distribution

Want to share your app with users? See the **[DISTRIBUTION.md](DISTRIBUTION.md)** guide for:

- 🚀 **Building production installers** (MSI & NSIS)
- 🌐 **Distribution methods** (GitHub Releases, Microsoft Store, direct download)
- 🔐 **Code signing** for trusted installations
- 🔄 **Auto-updates** setup
- 📊 **File size optimization**
- 🎯 **Complete distribution strategy**

**Quick start:**
```powershell
# Build installers
.\build.ps1

# Or manually
npm run tauri build
```

Installers will be created in `src-tauri/target/release/bundle/`

## Troubleshooting

- **Tauri dev window doesn't open**: Ensure Rust and platform dependencies are installed. Check `src-tauri/target/debug/` logs.
- **Vite dev server errors**: Clear `node_modules` and reinstall: `rm -rf node_modules package-lock.json && npm install`
- **ESLint/Prettier conflicts**: Run `npm run format` to auto-fix formatting issues.

## Resources

- [Tauri v2 Docs](https://v2.tauri.app/)
- [Mantine v8 Docs](https://mantine.dev/)
- [Vite Docs](https://vitejs.dev/)
- [Tauri Store Plugin Docs](https://tauri.app/plugin/store/)
- [Tauri Dialog Plugin Docs](https://tauri.app/plugin/dialog/)
- [Tauri Shell Plugin Docs](https://tauri.app/plugin/shell/)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [BtbN FFmpeg Builds](https://github.com/BtbN/FFmpeg-Builds)
- [Martin Riedl macOS FFmpeg Builds](https://ffmpeg.martin-riedl.de/)
- [Tauri Building Guide](https://tauri.app/v1/guides/building/)
- [Tauri Distribution Guide](https://tauri.app/v1/guides/distribution/)
- [Tauri Updater Guide](https://tauri.app/v1/guides/distribution/updater/)
- [WiX Toolset](https://wixtoolset.org/)
- [NSIS](https://nsis.sourceforge.io/)
- [Apple Notarization Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
