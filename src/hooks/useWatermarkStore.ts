import { useEffect, useState } from 'react'
import { LazyStore } from '@tauri-apps/plugin-store'
import { resolveResource } from '@tauri-apps/api/path'
import { readTextFile } from '@tauri-apps/plugin-fs'

import { DEFAULT_WATERMARK_CONFIG, type WatermarkConfig } from '@/types/watermark'

const STORE_KEY = 'watermarkConfig'
const store = new LazyStore('watermark-settings.json')

// Load order:
// 1. User's saved settings (from store)
// 2. Default preset (from bundled resources)
// 3. Hardcoded DEFAULT_WATERMARK_CONFIG (fallback)
async function loadDefaultPreset(): Promise<Partial<WatermarkConfig> | null> {
  try {
    const resourcePath = await resolveResource('resources/presets/default.json')
    const presetJson = await readTextFile(resourcePath)
    const preset = JSON.parse(presetJson)
    return preset.config ?? null
  } catch (error) {
    console.warn('Failed to load default preset, using hardcoded defaults', error)
    return null
  }
}

/**
 * Migration helper to handle existing saved configurations that don't have the new positioning fields.
 * Ensures backward compatibility by defaulting to preset mode for configurations without positionMode.
 */
function migrateConfig(config: Partial<WatermarkConfig>): Partial<WatermarkConfig> {
  // If positionMode is missing, assume preset mode for backward compatibility
  if (!config.positionMode) {
    return {
      ...config,
      positionMode: 'preset',
    };
  }
  return config;
}

export function useWatermarkStore() {
  const [config, setConfig] = useState<WatermarkConfig>(DEFAULT_WATERMARK_CONFIG)
  const [isLoading, setIsLoading] = useState(true)
  const [activePresetId, setActivePresetId] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadConfig = async () => {
      try {
        const saved = (await store.get<Partial<WatermarkConfig>>(STORE_KEY)) ?? null
        const migrated = saved ? migrateConfig(saved) : null
        
        // Load active preset ID
        const savedPresetId = await store.get<string>('activePresetId')
        if (savedPresetId && isMounted) {
          setActivePresetId(savedPresetId)
        }
        
        if (migrated && isMounted) {
          // User has saved settings, use them
          setConfig({ ...DEFAULT_WATERMARK_CONFIG, ...migrated })
        } else if (isMounted) {
          // First launch, try to load default preset
          const defaultPreset = await loadDefaultPreset()
          if (defaultPreset) {
            const presetWithPositionMode = { ...DEFAULT_WATERMARK_CONFIG, ...defaultPreset, positionMode: 'preset' as const }
            setConfig(presetWithPositionMode)
            // Save the preset to store so it persists
            await store.set(STORE_KEY, presetWithPositionMode)
            // Set default as active preset
            setActivePresetId('default')
            await store.set('activePresetId', 'default')
          } else {
            // Fallback to hardcoded defaults
            setConfig(DEFAULT_WATERMARK_CONFIG)
          }
        }
      } catch (error) {
        console.error('Failed to load watermark configuration', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadConfig()

    return () => {
      isMounted = false
    }
  }, [])

  const updateConfig = (partial: Partial<WatermarkConfig>) => {
    setConfig((previous) => {
      const updated = { ...previous, ...partial }
      
      // Validate custom position if customPosition is provided and resulting mode is 'custom'
      if (partial.customPosition && updated.positionMode === 'custom') {
        const { x, y } = partial.customPosition;
        if (x < 0 || x > 1 || y < 0 || y > 1) {
          console.warn('Invalid custom position coordinates provided, clamping to valid range:', { x, y });
          partial.customPosition = {
            x: Math.max(0, Math.min(1, x)),
            y: Math.max(0, Math.min(1, y))
          };
          // Update the final config with clamped values
          updated.customPosition = partial.customPosition;
        }
      }
      
      // Check if this is a substantial change (not just positionMode or customPosition)
      const isSubstantialChange = Object.keys(partial).some(
        key => key !== 'positionMode' && key !== 'customPosition'
      )
      
      // If substantial changes, clear the active preset
      if (isSubstantialChange && activePresetId) {
        setActivePresetId(null)
        void store.delete('activePresetId')
      }
      
      void store.set(STORE_KEY, updated)
      return updated
    })
  }

  const applyPreset = (presetId: string, presetConfig: WatermarkConfig) => {
    const mergedConfig = { 
      ...DEFAULT_WATERMARK_CONFIG, 
      ...presetConfig, 
      positionMode: 'preset' as const 
    }
    
    setConfig(mergedConfig)
    setActivePresetId(presetId)
    
    void store.set(STORE_KEY, mergedConfig)
    void store.set('activePresetId', presetId)
  }

  return { config, updateConfig, isLoading, activePresetId, applyPreset }
}
