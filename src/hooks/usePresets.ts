import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import type { PresetMetadata, WatermarkConfig } from '@/types/watermark'

interface UsePresetsReturn {
  presets: PresetMetadata[]
  isLoading: boolean
  error: string | null
  loadPresetConfig: (id: string) => Promise<WatermarkConfig | null>
  refreshPresets: () => Promise<void>
}

export function usePresets(): UsePresetsReturn {
  const [presets, setPresets] = useState<PresetMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPresets = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const loadedPresets = await invoke<PresetMetadata[]>('list_presets')
      setPresets(loadedPresets)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load presets'
      setError(errorMessage)
      console.error('Failed to fetch presets:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadPresetConfig = useCallback(async (id: string): Promise<WatermarkConfig | null> => {
    try {
      const config = await invoke<WatermarkConfig>('load_preset', { presetId: id })
      return config
    } catch (err) {
      console.error(`Failed to load preset ${id}:`, err)
      return null
    }
  }, [])

  const refreshPresets = useCallback(async () => {
    await fetchPresets()
  }, [fetchPresets])

  useEffect(() => {
    fetchPresets()
  }, [fetchPresets])

  return {
    presets,
    isLoading,
    error,
    loadPresetConfig,
    refreshPresets,
  }
}
