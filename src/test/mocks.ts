import { vi } from 'vitest'

import type { BatchResult, FileResult, ProgressPayload } from '@/types/watermark'

export function mockInvoke(defaultResult?: BatchResult) {
  const fallbackResult: BatchResult =
    defaultResult ?? {
      total: 1,
      successful: 1,
      failed: 0,
      files: [
        {
          inputPath: '/input/file.txt',
          outputPath: '/output/file.txt',
          status: 'success',
          error: null,
        },
      ],
    }

  const invokeMock = vi.fn().mockResolvedValue(fallbackResult)

  return invokeMock
}

interface TriggerableListeners {
  trigger: <T>(event: string, payload: T) => void
  listen: ReturnType<typeof vi.fn>
  unlistenCallbacks: Array<ReturnType<typeof vi.fn>>
}

export function mockListen(): TriggerableListeners {
  const listeners = new Map<string, Set<(event: { event: string; payload: unknown }) => void>>()
  const unlistenCallbacks: Array<ReturnType<typeof vi.fn>> = []

  const listen = vi.fn((eventName: string, callback: (event: { event: string; payload: unknown }) => void) => {
    if (!listeners.has(eventName)) {
      listeners.set(eventName, new Set())
    }

    listeners.get(eventName)!.add(callback)

    const unlisten = vi.fn(() => {
      listeners.get(eventName)?.delete(callback)
    })

    unlistenCallbacks.push(unlisten)

    return Promise.resolve(unlisten)
  })

  const trigger = <T,>(eventName: string, payload: T) => {
    const handlers = listeners.get(eventName)

    handlers?.forEach((handler) => {
      handler({ event: eventName, payload })
    })
  }

  return { trigger, listen, unlistenCallbacks }
}

export function mockDialog(result?: string | string[] | null) {
  const open = vi.fn(async () => result ?? '/mock/output')
  return { open }
}

interface StoreOptions {
  initialData?: Record<string, unknown>
}

export function mockStore(options: StoreOptions = {}) {
  const data = new Map<string, unknown>(Object.entries(options.initialData ?? {}))

  const get = vi.fn(async (key: string) => data.get(key))
  const set = vi.fn(async (key: string, value: unknown) => {
    data.set(key, value)
  })
  const save = vi.fn(async () => undefined)
  const load = vi.fn(async () => Object.fromEntries(data.entries()))

  return { get, set, save, load, data }
}

export function createBatchResult(overrides: Partial<BatchResult> = {}): BatchResult {
  const base: BatchResult = {
    total: 0,
    successful: 0,
    failed: 0,
    files: [],
  }

  return { ...base, ...overrides }
}

export function createFileResult(overrides: Partial<FileResult> = {}): FileResult {
  const base: FileResult = {
    inputPath: '/input/file.txt',
    outputPath: '/output/file.txt',
    status: 'success',
    error: null,
  }

  return { ...base, ...overrides }
}

export function createProgressPayload(overrides: Partial<ProgressPayload> = {}): ProgressPayload {
  const base: ProgressPayload = {
    filePath: '/input/file.txt',
    fileIndex: 0,
    totalFiles: 1,
    status: 'processing',
  }

  return { ...base, ...overrides }
}
