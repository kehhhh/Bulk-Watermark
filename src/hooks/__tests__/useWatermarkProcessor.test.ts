import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

import { useWatermarkProcessor } from '@/hooks/useWatermarkProcessor'
import {
  createBatchResult,
  createProgressPayload,
  createFileResult,
} from '@/test/mocks'
import type { FileItem, WatermarkConfig } from '@/types/watermark'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}))

const sampleFiles: FileItem[] = [
  { path: '/input/a.jpg', name: 'a.jpg', type: 'image' },
  { path: '/input/b.jpg', name: 'b.jpg', type: 'image' },
]

const sampleConfig: WatermarkConfig = {
  watermarkType: 'text',
  text: 'Demo',
  imagePath: null,
  position: 'bottom-right',
  opacity: 80,
  textColor: '#ffffff',
  fontSize: 32,
  fontFamily: 'Arial',
}

// Listener registry for manual triggering
let progressListeners: Array<(event: { payload: any, event: string, id: number }) => void> = []
let completeListeners: Array<(event: { payload: any, event: string, id: number }) => void> = []
let unlistenCallbacks: Array<() => void> = []

function triggerProgress(payload: any) {
  progressListeners.forEach(listener => listener({ payload, event: 'watermark-progress', id: Date.now() }))
}

function triggerComplete(payload: any) {
  completeListeners.forEach(listener => listener({ payload, event: 'watermark-complete', id: Date.now() }))
}

beforeEach(async () => {
  const { invoke } = await import('@tauri-apps/api/core')
  const { listen } = await import('@tauri-apps/api/event')

  vi.mocked(invoke).mockReset()
  vi.mocked(listen).mockReset()
  
  // Reset listeners
  progressListeners = []
  completeListeners = []
  unlistenCallbacks = []

  // Setup default invoke behavior
  vi.mocked(invoke).mockResolvedValue(createBatchResult({
    total: sampleFiles.length,
    successful: sampleFiles.length,
    failed: 0,
    files: sampleFiles.map(file =>
      createFileResult({
        inputPath: file.path,
        outputPath: `/output/${file.name}`,
        status: 'success',
      }),
    ),
  }))

  // Setup listen mock
  vi.mocked(listen).mockImplementation((eventName: string, callback: any) => {
    const unlisten = vi.fn()
    unlistenCallbacks.push(unlisten)

    if (eventName === 'watermark-progress') {
      progressListeners.push(callback)
    } else if (eventName === 'watermark-complete') {
      completeListeners.push(callback)
    }

    return Promise.resolve(unlisten)
  })
})

describe('useWatermarkProcessor', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useWatermarkProcessor())

    expect(result.current.processingState).toBe('idle')
    expect(result.current.isProcessing).toBe(false)
    expect(result.current.progressArray).toHaveLength(0)
    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('processes a batch and handles events', async () => {
    const { result } = renderHook(() => useWatermarkProcessor())

    await act(async () => {
      await result.current.processBatch(sampleFiles, sampleConfig, '/output')
    })

    expect(result.current.processingState).toBe('processing')

    act(() => {
      triggerProgress(createProgressPayload({
        filePath: sampleFiles[0].path,
        fileIndex: 0,
        totalFiles: sampleFiles.length,
        status: 'processing',
      }))
    })

    await waitFor(() => {
      expect(result.current.progressArray).toHaveLength(1)
    })

    const batchResult = createBatchResult({
      total: sampleFiles.length,
      successful: sampleFiles.length,
      failed: 0,
      files: sampleFiles.map(file =>
        createFileResult({
          inputPath: file.path,
          outputPath: `/output/${file.name}`,
          status: 'success',
        }),
      ),
    })

    act(() => {
      triggerComplete(batchResult)
    })

    await waitFor(() => {
      expect(result.current.processingState).toBe('complete')
    })

    expect(result.current.result).toEqual(batchResult)
  })

  it('validates inputs before processing', async () => {
    const { result } = renderHook(() => useWatermarkProcessor())

    await act(async () => {
      await result.current.processBatch([], sampleConfig, '/output')
    })

    expect(result.current.processingState).toBe('error')
    expect(result.current.error).toBe('Add files before processing.')

    await act(async () => {
      await result.current.processBatch(sampleFiles, sampleConfig, '')
    })

    expect(result.current.error).toBe('Please select an output directory.')
  })

  it('handles catastrophic errors from invoke', async () => {
    const { invoke } = await import('@tauri-apps/api/core')
    const error = new Error('FFmpeg binary not found')
    vi.mocked(invoke).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useWatermarkProcessor())

    await act(async () => {
      await result.current.processBatch(sampleFiles, sampleConfig, '/output')
    })

    await waitFor(() => {
      expect(result.current.processingState).toBe('error')
    })

    expect(result.current.error).toBe(error.message)
  })

  it('supports cancellation and ignores subsequent events', async () => {
    const { result } = renderHook(() => useWatermarkProcessor())

    await act(async () => {
      await result.current.processBatch(sampleFiles, sampleConfig, '/output')
    })

    act(() => {
      result.current.cancelProcessing()
    })

    expect(result.current.processingState).toBe('cancelled')

    act(() => {
      triggerComplete(createBatchResult())
    })

    expect(result.current.processingState).toBe('cancelled')
  })

  it('cleans up event listeners on unmount', async () => {
    const { listen } = await import('@tauri-apps/api/event')
    const { unmount } = renderHook(() => useWatermarkProcessor())

    await waitFor(() => {
      expect(vi.mocked(listen)).toHaveBeenCalled()
    })

    await act(async () => {
      unmount()
    })

    expect(unlistenCallbacks.length).toBeGreaterThan(0)
    unlistenCallbacks.forEach(unlisten => {
      expect(unlisten).toHaveBeenCalledTimes(1)
    })
  })
})
