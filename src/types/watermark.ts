export type WatermarkPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export type WatermarkType = 'text' | 'image'

export interface WatermarkConfig {
  watermarkType: WatermarkType
  text: string
  imagePath: string | null
  position: WatermarkPosition
  opacity: number
  textColor: string
  fontSize: number
  fontFamily: string
  /**
   * Image watermark scale as percentage of source image width (1-100)
   * Default: 20 (20% of source image width)
   */
  imageScale?: number;
  /**
   * Positioning mode: 'preset' uses the position field, 'custom' uses customPosition field
   */
  positionMode?: 'preset' | 'custom';
  /**
   * Custom position with normalized coordinates (0.0-1.0 range)
   * where 0,0 is top-left and 1,1 is bottom-right
   * The watermark will be centered at the specified position
   */
  customPosition?: { x: number; y: number };
}

export interface FileItem {
  path: string
  name: string
  type: 'image' | 'video'
  size?: number
}

export const DEFAULT_WATERMARK_CONFIG: WatermarkConfig = {
  watermarkType: 'text',
  text: 'Watermark',
  imagePath: null,
  position: 'bottom-right',
  opacity: 80,
  textColor: '#ffffff',
  fontSize: 48,
  fontFamily: 'Arial',
  imageScale: 20,
  positionMode: 'preset',
}

export type ProcessingStatus = 'success' | 'failed' | 'skipped'

export interface FileResult {
  inputPath: string
  outputPath: string | null
  status: ProcessingStatus
  error: string | null
}

export interface BatchResult {
  files: FileResult[]
  total: number
  successful: number
  failed: number
}

export interface ProgressPayload {
  filePath: string
  fileIndex: number
  totalFiles: number
  status: 'processing' | 'complete' | 'error'
}

export type ProcessingState = 'idle' | 'processing' | 'complete' | 'error' | 'cancelled'

/**
 * Metadata for a watermark preset (lightweight, used for listing).
 * The id corresponds to the preset filename without the .json extension.
 */
export interface PresetMetadata {
  id: string
  name: string
  description: string
}

/**
 * Complete preset structure including the full watermark configuration.
 * This is loaded when a specific preset is selected.
 */
export interface WatermarkPreset {
  name: string
  description: string
  config: WatermarkConfig
}
