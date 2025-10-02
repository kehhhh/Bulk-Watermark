# Watermark Presets

This directory contains JSON preset files that provide quick-start configurations for common watermarking scenarios.

## Preset Format

Each preset is a JSON file with the following structure:

```json
{
  "name": "Preset Name",
  "description": "Brief description of the preset",
  "config": {
    "watermarkType": "text" | "image",
    "text": "Watermark text",
    "imagePath": null,
    "position": "bottom-right",
    "opacity": 80,
    "textColor": "#ffffff",
    "fontSize": 48,
    "fontFamily": "Arial"
  }
}
```

The `config` object must match the `WatermarkConfig` TypeScript interface defined in `src/types/watermark.ts`.

## Built-in Presets

- **bold.json**: Large, high-contrast centered text for maximum visibility
- **copyright.json**: Clear copyright notice for legal protection
- **default.json**: Simple white text in the bottom-right corner (matches the app's default)
- **diagonal.json**: Large centered watermark for maximum protection
- **photography.json**: Elegant watermark for professional photography
- **professional.json**: Subtle gray text in the bottom-left corner for business use
- **social-media.json**: Eye-catching style for Instagram, TikTok, etc.
- **subtle.json**: Small, semi-transparent text in the top-right corner

## Using Presets

Presets can be selected directly in the app using the preset selector UI:

1. Open the app and look for the "Preset Styles" dropdown at the top of the Watermark Settings panel
2. Select a preset from the dropdown to apply all its settings
3. Customize any settings after selecting a preset - the UI will show "Custom" to indicate modifications
4. Your active preset (or custom config) is automatically saved and restored on app restart

The preset selector provides:
- Quick one-click application of preset styles
- Visual indication of the currently active preset
- Descriptions of each preset to help you choose
- Seamless transition between presets and custom configurations

## Adding Custom Presets

To add a custom preset:

1. Create a new JSON file in this directory (e.g., `my-preset.json`)
2. Follow the format above
3. Rebuild the app (`npm run tauri:build`) to bundle the new preset

## Loading Presets at Runtime

Presets are bundled as resources and accessible via Tauri commands:

**List all available presets:**
```typescript
import { invoke } from '@tauri-apps/api/core'
import type { PresetMetadata } from '@/types/watermark'

const presets = await invoke<PresetMetadata[]>('list_presets')
// Returns: [{ id: 'default', name: 'Default', description: '...' }, ...]
```

**Load a specific preset:**
```typescript
import type { WatermarkConfig } from '@/types/watermark'

const config = await invoke<WatermarkConfig>('load_preset', { presetId: 'photography' })
```

**Recommended approach in React components:**
```typescript
import { usePresets } from '@/hooks/usePresets'

function MyComponent() {
  const { presets, loadPresetConfig } = usePresets()
  
  const handleApplyPreset = async (id: string) => {
    const config = await loadPresetConfig(id)
    // Apply config to your state
  }
}
```

The `useWatermarkStore` hook loads the default preset on first launch (see `src/hooks/useWatermarkStore.ts`).

## Future Enhancements

- ✅ ~~Add a preset selector UI component (dropdown or gallery)~~ - Implemented
- Support for preset thumbnails/previews
- Allow users to save custom presets (user-defined presets stored separately from bundled ones)
- Preset import/export functionality
- Preset categories/tags for better organization
- Rotation support for diagonal watermarks (requires FFmpeg enhancement)

This provides complete documentation for the preset system and instructions for adding custom presets.