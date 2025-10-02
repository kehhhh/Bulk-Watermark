import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'

import { ProcessingPanel } from '@/components/ProcessingPanel'
import type { FileItem, WatermarkConfig } from '@/types/watermark'

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
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

function renderWithMantine(component: React.ReactElement) {
  return render(<MantineProvider>{component}</MantineProvider>)
}

describe('ProcessingPanel', () => {
  const defaultProps = {
    files: sampleFiles,
    config: sampleConfig,
    processingState: 'idle' as const,
    onProcess: vi.fn(),
    onCancel: vi.fn(),
  }

  beforeEach(async () => {
    const { open } = await import('@tauri-apps/plugin-dialog')
    vi.mocked(open).mockClear()
    defaultProps.onProcess.mockClear()
    defaultProps.onCancel.mockClear()
  })

  it('renders with empty output directory', () => {
    renderWithMantine(<ProcessingPanel {...defaultProps} />)

    expect(screen.getByDisplayValue('')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start processing/i })).toBeDisabled()
  })

  it('selects output directory via dialog', async () => {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const user = userEvent.setup()
    vi.mocked(open).mockResolvedValueOnce('/selected/output')

    renderWithMantine(<ProcessingPanel {...defaultProps} />)

    const folderButton = screen.getByRole('button', { name: /select output directory/i })
    await user.click(folderButton)

    await waitFor(() => {
      expect(screen.getByDisplayValue('/selected/output')).toBeInTheDocument()
    })

    expect(vi.mocked(open)).toHaveBeenCalledWith({
      directory: true,
      multiple: false,
    })
  })

  it('enables process button when files and output directory are set', async () => {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const user = userEvent.setup()
    vi.mocked(open).mockResolvedValueOnce('/output')

    renderWithMantine(<ProcessingPanel {...defaultProps} />)

    const folderButton = screen.getByRole('button', { name: /select output directory/i })
    await user.click(folderButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start processing/i })).toBeEnabled()
    })
  })

  it('calls onProcess when process button is clicked', async () => {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const user = userEvent.setup()
    vi.mocked(open).mockResolvedValueOnce('/output')

    renderWithMantine(<ProcessingPanel {...defaultProps} />)

    const folderButton = screen.getByRole('button', { name: /select output directory/i })
    await user.click(folderButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start processing/i })).toBeEnabled()
    })

    const processButton = screen.getByRole('button', { name: /start processing/i })
    await user.click(processButton)

    expect(defaultProps.onProcess).toHaveBeenCalledWith('/output')
  })

  it('disables process button when no files', () => {
    renderWithMantine(
      <ProcessingPanel {...defaultProps} files={[]} />
    )

    expect(screen.getByRole('button', { name: /start processing/i })).toBeDisabled()
    expect(screen.getByText(/no files selected/i)).toBeInTheDocument()
  })

  it('shows cancel button during processing', () => {
    renderWithMantine(
      <ProcessingPanel {...defaultProps} processingState="processing" />
    )

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()

    renderWithMantine(
      <ProcessingPanel {...defaultProps} processingState="processing" />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(defaultProps.onCancel).toHaveBeenCalled()
  })

  it('disables controls during processing', () => {
    renderWithMantine(
      <ProcessingPanel {...defaultProps} processingState="processing" />
    )

    expect(screen.getByRole('textbox')).toBeDisabled()
    expect(screen.getByRole('button', { name: /select output directory/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /start processing/i })).toBeDisabled()
  })

  it('shows watermark configuration summary', () => {
    renderWithMantine(<ProcessingPanel {...defaultProps} />)

    expect(screen.getByText(/text: "demo"/i)).toBeInTheDocument()
  })

  it('shows file count', () => {
    renderWithMantine(<ProcessingPanel {...defaultProps} />)

    expect(screen.getByText(/ready to process 2 files/i)).toBeInTheDocument()
  })
})