import { useCallback, useEffect, useMemo, useState } from 'react'
import { Center, Loader, Stack, Text } from '@mantine/core'
import { useElementSize } from '@mantine/hooks'
import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Line } from 'react-konva'

import type { FileItem, WatermarkConfig } from '@/types/watermark'
import { calculatePosition, loadImage } from '@/utils/canvas'

interface PreviewCanvasProps {
  config: WatermarkConfig
  previewFile: FileItem | null
  onConfigUpdate: (partial: Partial<WatermarkConfig>) => void
}

const MAX_PREVIEW_WIDTH = 800
const MAX_PREVIEW_HEIGHT = 600

export function PreviewCanvas({ config, previewFile, onConfigUpdate }: PreviewCanvasProps) {
  const { ref: containerRef, width: containerWidth } = useElementSize()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [watermarkImage, setWatermarkImage] = useState<HTMLImageElement | null>(null)
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null)
  const [scale, setScale] = useState(1)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [showVideoPlaceholder, setShowVideoPlaceholder] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Loading preview...')
  const [guideLines, setGuideLines] = useState<Array<{ points: number[]; orientation: 'h' | 'v' }>>([])

  useEffect(() => {
    const imagePath = config.imagePath
    if (config.watermarkType !== 'image' || !imagePath) {
      setWatermarkImage(null)
      setError(null)
      return
    }

    let isCancelled = false
    const load = async () => {
      try {
  const image = await loadImage(convertFileSrc(imagePath))
        if (!isCancelled) {
          setError(null)
          setWatermarkImage(image)
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError('Failed to load watermark image')
          setWatermarkImage(null)
        }
        // eslint-disable-next-line no-console
        console.error(loadError)
      }
    }

    void load()

    return () => {
      isCancelled = true
    }
  }, [config.imagePath, config.watermarkType])

  // Load source image effect
  useEffect(() => {
    if (!previewFile) {
      setSourceImage(null)
      setIsLoading(false)
      setShowVideoPlaceholder(false)
      return
    }

    let isCancelled = false
    setError(null)
    setShowVideoPlaceholder(false)
    setIsLoading(true)

    const loadSourceImage = async () => {
      try {
        if (previewFile.type === 'video') {
          // Handle video files by extracting thumbnail
          setLoadingMessage('Extracting video thumbnail...')
          
          const thumbnailPath = await invoke<string>('extract_video_thumbnail', {
            videoPath: previewFile.path,
          })
          
          if (isCancelled) {
            return
          }

          const convertedPath = convertFileSrc(thumbnailPath)
          const image = await loadImage(convertedPath)
          
          if (isCancelled) {
            return
          }

          setSourceImage(image)
          setIsLoading(false)
        } else {
          // Handle image files directly
          setLoadingMessage('Loading preview...')
          
          const image = await loadImage(convertFileSrc(previewFile.path))
          
          if (isCancelled) {
            return
          }

          setSourceImage(image)
          setIsLoading(false)
        }
      } catch (loadError) {
        if (!isCancelled) {
          if (previewFile.type === 'video') {
            // For videos, show placeholder instead of error
            setShowVideoPlaceholder(true)
            setError(null)
          } else {
            setError('Failed to load preview image')
          }
          setIsLoading(false)
        }
        // eslint-disable-next-line no-console
        console.error(loadError)
      }
    }

    void loadSourceImage()

    return () => {
      isCancelled = true
    }
  }, [previewFile])

  // Recalculate stage size when container width or source image changes
  useEffect(() => {
    if (!sourceImage) return

    const naturalWidth = sourceImage.naturalWidth || sourceImage.width
    const naturalHeight = sourceImage.naturalHeight || sourceImage.height
    
    // Use container width if available, otherwise fall back to MAX_PREVIEW_WIDTH
    const maxWidth = containerWidth > 0 ? Math.min(containerWidth, MAX_PREVIEW_WIDTH) : MAX_PREVIEW_WIDTH
    const fitScale = Math.min(maxWidth / naturalWidth, MAX_PREVIEW_HEIGHT / naturalHeight, 1)
    
    const scaledWidth = Math.round(naturalWidth * fitScale)
    const scaledHeight = Math.round(naturalHeight * fitScale)

    setScale(fitScale)
    setStageSize({ width: scaledWidth, height: scaledHeight })
  }, [sourceImage, containerWidth])

  // Memoize text dimensions to prevent constant recalculation
  const textDimensions = useMemo(() => {
    if (config.watermarkType !== 'text' || !sourceImage) return null
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    
    ctx.font = `${config.fontSize}px ${config.fontFamily}`
    const textMetrics = ctx.measureText(config.text)
    return {
      width: textMetrics.width,
      height: config.fontSize
    }
  }, [config.watermarkType, config.text, config.fontSize, config.fontFamily, sourceImage])

  // Memoize watermark image dimensions
  const watermarkImageDimensions = useMemo(() => {
    if (config.watermarkType !== 'image' || !watermarkImage || !sourceImage) return null
    
    // Scale based on source image width (default 20% of source width)
    const scalePercentage = config.imageScale || 20
    const targetWidth = (sourceImage.naturalWidth * scalePercentage) / 100
    
    const wmWidth = watermarkImage.naturalWidth
    const wmHeight = watermarkImage.naturalHeight
    const aspectRatio = wmHeight / wmWidth
    
    return {
      width: targetWidth,
      height: targetWidth * aspectRatio
    }
  }, [config.watermarkType, config.imageScale, watermarkImage, sourceImage])

  // Memoize watermark position
  const watermarkPosition = useMemo(() => {
    if (!sourceImage) return { x: 0, y: 0 }
    
    let wmWidth = 0
    let wmHeight = 0
    
    if (config.watermarkType === 'text' && textDimensions) {
      wmWidth = textDimensions.width
      wmHeight = textDimensions.height
    } else if (config.watermarkType === 'image' && watermarkImageDimensions) {
      wmWidth = watermarkImageDimensions.width
      wmHeight = watermarkImageDimensions.height
    }
    
    if (config.positionMode === 'custom' && config.customPosition) {
      // Center the watermark at the custom position (matching backend behavior)
      return {
        x: sourceImage.naturalWidth * config.customPosition.x - wmWidth / 2,
        y: sourceImage.naturalHeight * config.customPosition.y - wmHeight / 2
      }
    }
    
    return calculatePosition(
      config.position,
      sourceImage.naturalWidth,
      sourceImage.naturalHeight,
      wmWidth,
      wmHeight
    )
  }, [
    sourceImage,
    config.watermarkType,
    config.position,
    config.positionMode,
    config.customPosition,
    textDimensions,
    watermarkImageDimensions
  ])

  // Calculate and show alignment guides during drag
  const updateGuideLines = useCallback((node: any, elementWidth: number, elementHeight: number) => {
    if (!sourceImage) return;
    
    const SNAP_THRESHOLD = 8; // pixels
    const guides: Array<{ points: number[]; orientation: 'h' | 'v' }> = [];
    
    const nodeX = node.x();
    const nodeY = node.y();
    const nodeCenterX = nodeX + elementWidth / 2;
    const nodeCenterY = nodeY + elementHeight / 2;
    const nodeRight = nodeX + elementWidth;
    const nodeBottom = nodeY + elementHeight;
    
    const canvasWidth = sourceImage.naturalWidth;
    const canvasHeight = sourceImage.naturalHeight;
    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;
    
    // Calculate thirds for rule of thirds grid
    const oneThirdX = canvasWidth / 3;
    const twoThirdX = (canvasWidth * 2) / 3;
    const oneThirdY = canvasHeight / 3;
    const twoThirdY = (canvasHeight * 2) / 3;
    
    // Vertical guides (for horizontal alignment)
    // Left edge alignment (element left edge at canvas left)
    if (Math.abs(nodeX) < SNAP_THRESHOLD) {
      guides.push({ points: [0, 0, 0, canvasHeight], orientation: 'v' });
    }
    // Left edge to center (element center at canvas left)
    if (Math.abs(nodeCenterX) < SNAP_THRESHOLD) {
      guides.push({ points: [0, 0, 0, canvasHeight], orientation: 'v' });
    }
    // Center left alignment (element left at one-third)
    if (Math.abs(nodeX - oneThirdX) < SNAP_THRESHOLD) {
      guides.push({ points: [oneThirdX, 0, oneThirdX, canvasHeight], orientation: 'v' });
    }
    // Center alignment (element center at canvas center)
    if (Math.abs(nodeCenterX - canvasCenterX) < SNAP_THRESHOLD) {
      guides.push({ points: [canvasCenterX, 0, canvasCenterX, canvasHeight], orientation: 'v' });
    }
    // Element left at center
    if (Math.abs(nodeX - canvasCenterX) < SNAP_THRESHOLD) {
      guides.push({ points: [canvasCenterX, 0, canvasCenterX, canvasHeight], orientation: 'v' });
    }
    // Element right at center
    if (Math.abs(nodeRight - canvasCenterX) < SNAP_THRESHOLD) {
      guides.push({ points: [canvasCenterX, 0, canvasCenterX, canvasHeight], orientation: 'v' });
    }
    // Center right alignment (element right at two-thirds)
    if (Math.abs(nodeRight - twoThirdX) < SNAP_THRESHOLD) {
      guides.push({ points: [twoThirdX, 0, twoThirdX, canvasHeight], orientation: 'v' });
    }
    // Right edge alignment (element right edge at canvas right)
    if (Math.abs(nodeRight - canvasWidth) < SNAP_THRESHOLD) {
      guides.push({ points: [canvasWidth, 0, canvasWidth, canvasHeight], orientation: 'v' });
    }
    // Right edge to center (element center at canvas right)
    if (Math.abs(nodeCenterX - canvasWidth) < SNAP_THRESHOLD) {
      guides.push({ points: [canvasWidth, 0, canvasWidth, canvasHeight], orientation: 'v' });
    }
    
    // Horizontal guides (for vertical alignment)
    // Top edge alignment (element top edge at canvas top)
    if (Math.abs(nodeY) < SNAP_THRESHOLD) {
      guides.push({ points: [0, 0, canvasWidth, 0], orientation: 'h' });
    }
    // Top edge to center (element center at canvas top)
    if (Math.abs(nodeCenterY) < SNAP_THRESHOLD) {
      guides.push({ points: [0, 0, canvasWidth, 0], orientation: 'h' });
    }
    // Center top alignment (element top at one-third)
    if (Math.abs(nodeY - oneThirdY) < SNAP_THRESHOLD) {
      guides.push({ points: [0, oneThirdY, canvasWidth, oneThirdY], orientation: 'h' });
    }
    // Center alignment (element center at canvas center)
    if (Math.abs(nodeCenterY - canvasCenterY) < SNAP_THRESHOLD) {
      guides.push({ points: [0, canvasCenterY, canvasWidth, canvasCenterY], orientation: 'h' });
    }
    // Element top at center
    if (Math.abs(nodeY - canvasCenterY) < SNAP_THRESHOLD) {
      guides.push({ points: [0, canvasCenterY, canvasWidth, canvasCenterY], orientation: 'h' });
    }
    // Element bottom at center
    if (Math.abs(nodeBottom - canvasCenterY) < SNAP_THRESHOLD) {
      guides.push({ points: [0, canvasCenterY, canvasWidth, canvasCenterY], orientation: 'h' });
    }
    // Center bottom alignment (element bottom at two-thirds)
    if (Math.abs(nodeBottom - twoThirdY) < SNAP_THRESHOLD) {
      guides.push({ points: [0, twoThirdY, canvasWidth, twoThirdY], orientation: 'h' });
    }
    // Bottom edge alignment (element bottom edge at canvas bottom)
    if (Math.abs(nodeBottom - canvasHeight) < SNAP_THRESHOLD) {
      guides.push({ points: [0, canvasHeight, canvasWidth, canvasHeight], orientation: 'h' });
    }
    // Bottom edge to center (element center at canvas bottom)
    if (Math.abs(nodeCenterY - canvasHeight) < SNAP_THRESHOLD) {
      guides.push({ points: [0, canvasHeight, canvasWidth, canvasHeight], orientation: 'h' });
    }
    
    setGuideLines(guides);
  }, [sourceImage]);

  // Clear guides when drag ends
  const clearGuides = useCallback(() => {
    setGuideLines([]);
  }, []);

  // Drag end handler for text watermarks
  const handleTextDragEnd = useCallback((e: any) => {
    if (!sourceImage || !textDimensions) return;
    
    clearGuides();
    
    const node = e.target;
    const x = node.x();
    const y = node.y();
    
    // Calculate center position of the watermark (not top-left corner)
    const centerX = x + textDimensions.width / 2;
    const centerY = y + textDimensions.height / 2;
    
    // Convert center position to normalized coordinates (0.0-1.0)
    const normalizedX = centerX / sourceImage.naturalWidth;
    const normalizedY = centerY / sourceImage.naturalHeight;
    
    // Clamp to valid range
    const clampedX = Math.max(0, Math.min(1, normalizedX));
    const clampedY = Math.max(0, Math.min(1, normalizedY));
    
    // Update store with custom position (center point)
    onConfigUpdate({
      positionMode: 'custom',
      customPosition: { x: clampedX, y: clampedY }
    });
  }, [sourceImage, textDimensions, onConfigUpdate, clearGuides]);

  // Drag move handler for text watermarks
  const handleTextDragMove = useCallback((e: any) => {
    if (!textDimensions) return;
    updateGuideLines(e.target, textDimensions.width, textDimensions.height);
  }, [textDimensions, updateGuideLines]);

  // Drag end handler for image watermarks
  const handleImageDragEnd = useCallback((e: any) => {
    if (!sourceImage || !watermarkImageDimensions) return;
    
    clearGuides();
    
    const node = e.target;
    const x = node.x();
    const y = node.y();
    
    // Calculate center position of the watermark (not top-left corner)
    const centerX = x + watermarkImageDimensions.width / 2;
    const centerY = y + watermarkImageDimensions.height / 2;
    
    // Convert center position to normalized coordinates (0.0-1.0)
    const normalizedX = centerX / sourceImage.naturalWidth;
    const normalizedY = centerY / sourceImage.naturalHeight;
    
    // Clamp to valid range
    const clampedX = Math.max(0, Math.min(1, normalizedX));
    const clampedY = Math.max(0, Math.min(1, normalizedY));
    
    // Update store with custom position (center point)
    onConfigUpdate({
      positionMode: 'custom',
      customPosition: { x: clampedX, y: clampedY }
    });
  }, [sourceImage, watermarkImageDimensions, onConfigUpdate, clearGuides]);

  // Drag move handler for image watermarks
  const handleImageDragMove = useCallback((e: any) => {
    if (!watermarkImageDimensions) return;
    updateGuideLines(e.target, watermarkImageDimensions.width, watermarkImageDimensions.height);
  }, [watermarkImageDimensions, updateGuideLines]);

  // Helper function to snap to guide positions
  const snapToGuides = useCallback((x: number, y: number, elementWidth: number, elementHeight: number) => {
    if (!sourceImage) return { x, y };
    
    const SNAP_THRESHOLD = 8;
    let snappedX = x;
    let snappedY = y;
    
    const centerX = x + elementWidth / 2;
    const centerY = y + elementHeight / 2;
    const right = x + elementWidth;
    const bottom = y + elementHeight;
    
    const canvasWidth = sourceImage.naturalWidth;
    const canvasHeight = sourceImage.naturalHeight;
    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;
    const oneThirdX = canvasWidth / 3;
    const twoThirdX = (canvasWidth * 2) / 3;
    const oneThirdY = canvasHeight / 3;
    const twoThirdY = (canvasHeight * 2) / 3;
    
    // Snap X position
    if (Math.abs(x) < SNAP_THRESHOLD) snappedX = 0;
    else if (Math.abs(centerX) < SNAP_THRESHOLD) snappedX = -elementWidth / 2;
    else if (Math.abs(x - oneThirdX) < SNAP_THRESHOLD) snappedX = oneThirdX;
    else if (Math.abs(centerX - canvasCenterX) < SNAP_THRESHOLD) snappedX = canvasCenterX - elementWidth / 2;
    else if (Math.abs(x - canvasCenterX) < SNAP_THRESHOLD) snappedX = canvasCenterX;
    else if (Math.abs(right - canvasCenterX) < SNAP_THRESHOLD) snappedX = canvasCenterX - elementWidth;
    else if (Math.abs(right - twoThirdX) < SNAP_THRESHOLD) snappedX = twoThirdX - elementWidth;
    else if (Math.abs(right - canvasWidth) < SNAP_THRESHOLD) snappedX = canvasWidth - elementWidth;
    else if (Math.abs(centerX - canvasWidth) < SNAP_THRESHOLD) snappedX = canvasWidth - elementWidth / 2;
    
    // Snap Y position
    if (Math.abs(y) < SNAP_THRESHOLD) snappedY = 0;
    else if (Math.abs(centerY) < SNAP_THRESHOLD) snappedY = -elementHeight / 2;
    else if (Math.abs(y - oneThirdY) < SNAP_THRESHOLD) snappedY = oneThirdY;
    else if (Math.abs(centerY - canvasCenterY) < SNAP_THRESHOLD) snappedY = canvasCenterY - elementHeight / 2;
    else if (Math.abs(y - canvasCenterY) < SNAP_THRESHOLD) snappedY = canvasCenterY;
    else if (Math.abs(bottom - canvasCenterY) < SNAP_THRESHOLD) snappedY = canvasCenterY - elementHeight;
    else if (Math.abs(bottom - twoThirdY) < SNAP_THRESHOLD) snappedY = twoThirdY - elementHeight;
    else if (Math.abs(bottom - canvasHeight) < SNAP_THRESHOLD) snappedY = canvasHeight - elementHeight;
    else if (Math.abs(centerY - canvasHeight) < SNAP_THRESHOLD) snappedY = canvasHeight - elementHeight / 2;
    
    return { x: snappedX, y: snappedY };
  }, [sourceImage]);

  // Drag bound function for text watermark to constrain within image bounds
  const textDragBoundFunc = useCallback((pos: any) => {
    if (!sourceImage || !textDimensions) return pos;
    
    // Apply snapping
    const snapped = snapToGuides(pos.x, pos.y, textDimensions.width, textDimensions.height);
    
    // Constrain within bounds
    const x = Math.max(0, Math.min(snapped.x, sourceImage.naturalWidth - textDimensions.width));
    const y = Math.max(0, Math.min(snapped.y, sourceImage.naturalHeight - textDimensions.height));
    
    return { x, y };
  }, [sourceImage, textDimensions, snapToGuides]);

  // Drag bound function for image watermark to constrain within image bounds
  const imageDragBoundFunc = useCallback((pos: any) => {
    if (!sourceImage || !watermarkImageDimensions) return pos;
    
    // Apply snapping
    const snapped = snapToGuides(pos.x, pos.y, watermarkImageDimensions.width, watermarkImageDimensions.height);
    
    // Constrain within bounds
    const x = Math.max(0, Math.min(snapped.x, sourceImage.naturalWidth - watermarkImageDimensions.width));
    const y = Math.max(0, Math.min(snapped.y, sourceImage.naturalHeight - watermarkImageDimensions.height));
    
    return { x, y };
  }, [sourceImage, watermarkImageDimensions, snapToGuides]);

  return (
    <Stack gap="md" style={{ minHeight: 360 }}>
      <Center style={{ flex: 1, position: 'relative' }}>
        {isLoading && (
          <Stack gap={4} align="center">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              {loadingMessage}
            </Text>
          </Stack>
        )}

        {!isLoading && error && (
          <Text size="sm" c="red">
            {error}
          </Text>
        )}

        {!isLoading && !error && !previewFile && (
          <Text size="sm" c="dimmed">
            Select a file to preview
          </Text>
        )}

        {!isLoading && !error && showVideoPlaceholder && (
          <Text size="sm" c="dimmed" ta="center">
            Unable to generate video preview. Watermark will be applied during processing.
          </Text>
        )}

        {!isLoading && !error && previewFile && !showVideoPlaceholder && sourceImage && (
          <Stack gap="sm" ref={containerRef}>
            <div className="konva-stage-container">
              <Stage
                width={stageSize.width}
                height={stageSize.height}
                scaleX={scale}
                scaleY={scale}
                draggable={false}
              >
                <Layer>
                  <KonvaImage
                    image={sourceImage}
                    width={sourceImage.naturalWidth}
                    height={sourceImage.naturalHeight}
                    listening={false}
                  />
                  
                  {config.watermarkType === 'text' && textDimensions && (
                    <>
                      <KonvaText
                        text={config.text}
                        x={watermarkPosition.x}
                        y={watermarkPosition.y}
                        fontSize={config.fontSize}
                        fontFamily={config.fontFamily}
                        fill={config.textColor}
                        opacity={config.opacity / 100}
                        draggable={true}
                        onDragMove={handleTextDragMove}
                        onDragEnd={handleTextDragEnd}
                        dragBoundFunc={textDragBoundFunc}
                        onMouseEnter={() => document.body.style.cursor = 'move'}
                        onMouseLeave={() => document.body.style.cursor = 'default'}
                      />
                    </>
                  )}
                  
                  {config.watermarkType === 'image' && watermarkImage && watermarkImageDimensions && (
                    <KonvaImage
                      image={watermarkImage}
                      x={watermarkPosition.x}
                      y={watermarkPosition.y}
                      width={watermarkImageDimensions.width}
                      height={watermarkImageDimensions.height}
                      opacity={config.opacity / 100}
                      draggable={true}
                      onDragMove={handleImageDragMove}
                      onDragEnd={handleImageDragEnd}
                      dragBoundFunc={imageDragBoundFunc}
                      onMouseEnter={() => document.body.style.cursor = 'move'}
                      onMouseLeave={() => document.body.style.cursor = 'default'}
                    />
                  )}
                  
                  {/* Alignment guide lines */}
                  {guideLines.map((guide, index) => (
                    <Line
                      key={index}
                      points={guide.points}
                      stroke="#00a8ff"
                      strokeWidth={1}
                      dash={[4, 4]}
                      listening={false}
                    />
                  ))}
                </Layer>
              </Stage>
            </div>
          </Stack>
        )}
      </Center>
    </Stack>
  )
}
