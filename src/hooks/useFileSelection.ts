import { useState } from 'react'
import { open } from '@tauri-apps/plugin-dialog'

import type { FileItem } from '@/types/watermark'

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp']
const VIDEO_EXTENSIONS = ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv']

const FILE_FILTERS = [
  { name: 'All Media Files', extensions: [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS] },
  { name: 'Images', extensions: IMAGE_EXTENSIONS },
  { name: 'Videos', extensions: VIDEO_EXTENSIONS },
]

const IMAGE_FILTER = [{ name: 'Images', extensions: IMAGE_EXTENSIONS }]

const getExtension = (path: string) => {
  const match = /\.([^.]+)$/.exec(path)
  return match ? match[1].toLowerCase() : ''
}

const toFileItem = (path: string): FileItem => {
  const segments = path.split(/[/\\]/)
  const name = segments[segments.length - 1] ?? path
  const extension = getExtension(name)
  const type: FileItem['type'] = IMAGE_EXTENSIONS.includes(extension) ? 'image' : 'video'

  return { path, name, type }
}

export function useFileSelection() {
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([])

  const selectFiles = async () => {
    const result = await open({ multiple: true, directory: false, filters: FILE_FILTERS })
    if (!result) {
      return
    }

    const files = Array.isArray(result) ? result : [result]
    setSelectedFiles((current) => {
      const existingPaths = new Set(current.map((file) => file.path))
      const newItems = files
        .filter((path) => !existingPaths.has(path))
        .map(toFileItem)
      return [...current, ...newItems]
    })
  }

  const selectWatermarkImage = async () => {
    const result = await open({ multiple: false, directory: false, filters: IMAGE_FILTER })
    if (!result) {
      return null
    }

    return Array.isArray(result) ? result[0] ?? null : result
  }

  const removeFile = (path: string) => {
    setSelectedFiles((current) => current.filter((file) => file.path !== path))
  }

  const clearFiles = () => {
    setSelectedFiles([])
  }

  return { selectedFiles, selectFiles, selectWatermarkImage, removeFile, clearFiles }
}
