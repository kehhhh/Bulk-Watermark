#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ffmpegPath = require('ffmpeg-static');

if (!ffmpegPath) {
  console.error('Unable to resolve ffmpeg-static binary path. Ensure the dependency is installed.');
  process.exit(1);
}

const platform = process.platform;
const arch = process.arch;

const targetMap = new Map([
  [['win32', 'x64'].toString(), 'ffmpeg-x86_64-pc-windows-msvc.exe'],
  [['linux', 'x64'].toString(), 'ffmpeg-x86_64-unknown-linux-gnu'],
  [['linux', 'arm64'].toString(), 'ffmpeg-aarch64-unknown-linux-gnu'],
  [['darwin', 'x64'].toString(), 'ffmpeg-x86_64-apple-darwin'],
  [['darwin', 'arm64'].toString(), 'ffmpeg-aarch64-apple-darwin'],
]);

const key = [platform, arch].toString();
const filename = targetMap.get(key);

if (!filename) {
  console.error(`Unsupported platform/architecture combination: ${platform} ${arch}`);
  console.error('Update scripts/prepare-ffmpeg.cjs with the appropriate mapping for your target.');
  process.exit(1);
}

const repoRoot = path.resolve(__dirname, '..');
const binariesDir = path.join(repoRoot, 'src-tauri', 'binaries');

if (!fs.existsSync(binariesDir)) {
  fs.mkdirSync(binariesDir, { recursive: true });
}

const destination = path.join(binariesDir, filename);

fs.copyFileSync(ffmpegPath, destination);

try {
  fs.chmodSync(destination, 0o755);
} catch (error) {
  // chmod can fail on Windows; ignore silently there.
  if (platform !== 'win32') {
    throw error;
  }
}

console.log(`Copied ffmpeg binary to ${path.relative(repoRoot, destination)}`);
console.log(`Source version: ${require('ffmpeg-static/package.json').version}`);
