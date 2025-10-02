/**
 * Canvas utility functions for watermark positioning and drawing.
 * 
 * Note: This utility is transitioning from canvas 2D context to Konva-based rendering.
 * The drawing functions (drawTextWatermark, drawImageWatermark) are deprecated as of the
 * Konva migration and may be removed in a future refactor. The calculatePosition and
 * loadImage functions remain actively used.
 */
import type { WatermarkConfig, WatermarkPosition } from '@/types/watermark'

const PADDING = 20
const MAX_WATERMARK_SIZE = 200

export const calculatePosition = (
  position: WatermarkPosition,
  canvasWidth: number,
  canvasHeight: number,
  watermarkWidth: number,
  watermarkHeight: number
) => {
  switch (position) {
    case 'top-left':
      return { x: PADDING, y: PADDING }
    case 'top-center':
      return { x: (canvasWidth - watermarkWidth) / 2, y: PADDING }
    case 'top-right':
      return { x: canvasWidth - watermarkWidth - PADDING, y: PADDING }
    case 'center-left':
      return { x: PADDING, y: (canvasHeight - watermarkHeight) / 2 }
    case 'center':
      return { x: (canvasWidth - watermarkWidth) / 2, y: (canvasHeight - watermarkHeight) / 2 }
    case 'center-right':
      return { x: canvasWidth - watermarkWidth - PADDING, y: (canvasHeight - watermarkHeight) / 2 }
    case 'bottom-left':
      return { x: PADDING, y: canvasHeight - watermarkHeight - PADDING }
    case 'bottom-center':
      return { x: (canvasWidth - watermarkWidth) / 2, y: canvasHeight - watermarkHeight - PADDING }
    case 'bottom-right':
    default:
      return { x: canvasWidth - watermarkWidth - PADDING, y: canvasHeight - watermarkHeight - PADDING }
  }
}

/**
 * @deprecated This function is no longer used with Konva-based preview.
 * Kept for backward compatibility or potential future use.
 * Konva renders text watermarks directly via Text nodes.
 */
export const drawTextWatermark = (
  ctx: CanvasRenderingContext2D,
  config: WatermarkConfig,
  canvasWidth: number,
  canvasHeight: number
) => {
  ctx.save()
  ctx.font = `${config.fontSize}px ${config.fontFamily}`
  ctx.fillStyle = config.textColor
  ctx.globalAlpha = config.opacity / 100
  ctx.textBaseline = 'top'

  const textMetrics = ctx.measureText(config.text)
  const watermarkWidth = textMetrics.width
  const watermarkHeight = config.fontSize
  const { x, y } = calculatePosition(config.position, canvasWidth, canvasHeight, watermarkWidth, watermarkHeight)

  ctx.fillText(config.text, x, y)
  ctx.restore()
}

/**
 * @deprecated This function is no longer used with Konva-based preview.
 * Kept for backward compatibility or potential future use.
 * Konva renders image watermarks directly via Image nodes.
 */
export const drawImageWatermark = (
  ctx: CanvasRenderingContext2D,
  watermarkImage: HTMLImageElement,
  config: WatermarkConfig,
  canvasWidth: number,
  canvasHeight: number
) => {
  ctx.save()
  ctx.globalAlpha = config.opacity / 100

  const naturalWidth = watermarkImage.naturalWidth || watermarkImage.width
  const naturalHeight = watermarkImage.naturalHeight || watermarkImage.height
  const maxDimension = Math.max(naturalWidth, naturalHeight)
  const scale = maxDimension > MAX_WATERMARK_SIZE ? MAX_WATERMARK_SIZE / maxDimension : 1

  const watermarkWidth = naturalWidth * scale
  const watermarkHeight = naturalHeight * scale
  const { x, y } = calculatePosition(config.position, canvasWidth, canvasHeight, watermarkWidth, watermarkHeight)

  ctx.drawImage(watermarkImage, x, y, watermarkWidth, watermarkHeight)
  ctx.restore()
}

export const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    image.src = src
  })
