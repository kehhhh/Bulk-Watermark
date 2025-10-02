import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'

import type {
  WatermarkConfig,
  FileItem,
  BatchResult,
  ProgressPayload,
  ProcessingState,
} from '@/types/watermark'

interface UseWatermarkProcessorReturn {
  processBatch: (files: FileItem[], config: WatermarkConfig, outputDir: string) => Promise<void>
  cancelProcessing: () => void
  processingState: ProcessingState
  isProcessing: boolean
  progressArray: ProgressPayload[]
  result: BatchResult | null
  error: string | null
}

const VALIDATION_MESSAGES = {
  noFiles: 'Add files before processing.',
  noOutput: 'Please select an output directory.',
  emptyText: 'Watermark text cannot be empty.',
  missingImage: 'Select a watermark image before processing.',
}

export function useWatermarkProcessor(): UseWatermarkProcessorReturn {
  const [processingState, setProcessingState] = useState<ProcessingState>('idle')
  const [progress, setProgress] = useState<Map<string, ProgressPayload>>(new Map())
  const [result, setResult] = useState<BatchResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const unlistenProgressRef = useRef<UnlistenFn | null>(null)
  const unlistenCompleteRef = useRef<UnlistenFn | null>(null)
  const isCancelledRef = useRef<boolean>(false)

  useEffect(() => {
    let isMounted = true

    const registerListeners = async () => {
      try {
        const progressUnlisten = await listen<ProgressPayload>('watermark-progress', event => {
          if (!isMounted || isCancelledRef.current) {
            return
          }

          const payload = event.payload

          setProgress(prev => {
            const next = new Map(prev)
            next.set(payload.filePath, payload)
            return next
          })

          if (payload.status === 'error') {
            console.error('Watermark processing error', payload)
          }
        })

        unlistenProgressRef.current = progressUnlisten

        const completeUnlisten = await listen<BatchResult>('watermark-complete', event => {
          if (!isMounted) {
            return
          }

          const payload = event.payload

          if (isCancelledRef.current) {
            setResult(payload)
            setProcessingState('cancelled')
            return
          }

          setResult(payload)
          setProcessingState('complete')
        })

        unlistenCompleteRef.current = completeUnlisten
      } catch (err) {
        console.error('Failed to register watermark event listeners', err)
      }
    }

    registerListeners()

    return () => {
      isMounted = false

      if (unlistenProgressRef.current) {
        unlistenProgressRef.current()
        unlistenProgressRef.current = null
      }

      if (unlistenCompleteRef.current) {
        unlistenCompleteRef.current()
        unlistenCompleteRef.current = null
      }

      setProgress(new Map())
      setResult(null)
    }
  }, [])

  const validateInputs = useCallback(
    (files: FileItem[], config: WatermarkConfig, outputDir: string): string | null => {
      if (!files.length) {
        return VALIDATION_MESSAGES.noFiles
      }

      if (!outputDir) {
        return VALIDATION_MESSAGES.noOutput
      }

      if (config.watermarkType === 'text' && !config.text.trim()) {
        return VALIDATION_MESSAGES.emptyText
      }

      if (config.watermarkType === 'image' && !config.imagePath) {
        return VALIDATION_MESSAGES.missingImage
      }

      return null
    },
    [],
  )

  const processBatch = useCallback<UseWatermarkProcessorReturn['processBatch']>(
    async (files, config, outputDir) => {
      const validationError = validateInputs(files, config, outputDir)

      if (validationError) {
        setError(validationError)
        setProcessingState('error')
        console.warn('Watermark processing validation failed', validationError)
        return
      }

      setProcessingState('processing')
      setError(null)
      setResult(null)
      setProgress(new Map())
      isCancelledRef.current = false

      try {
        await invoke<BatchResult>('process_batch', {
          files,
          config,
          outputDir,
        })
        console.info('Watermark batch processing started')
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('Watermark batch processing failed', err)
        setError(message)
        setProcessingState('error')
      }
    },
    [validateInputs],
  )

  const cancelProcessing = useCallback(() => {
    if (processingState !== 'processing') {
      return
    }

    isCancelledRef.current = true
    setProcessingState('cancelled')
    console.info('Watermark batch processing cancelled (UI only)')
  }, [processingState])

  const isProcessing = processingState === 'processing'

  const progressArray = useMemo(() => {
    return Array.from(progress.values()).sort((a, b) => a.fileIndex - b.fileIndex)
  }, [progress])

  return {
    processBatch,
    cancelProcessing,
    processingState,
    isProcessing,
    progressArray,
    result,
    error,
  }
}

export type UseWatermarkProcessor = ReturnType<typeof useWatermarkProcessor>
