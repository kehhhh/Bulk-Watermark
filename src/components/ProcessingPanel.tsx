import { useState, useCallback } from 'react'
import {
  Stack,
  Group,
  Button,
  Text,
  TextInput,
  ActionIcon,
  Tooltip,
  ThemeIcon,
  Alert,
  Badge,
  Box,
  Divider,
  Progress,
} from '@mantine/core'
import { IconFolderOpen, IconPlayerPlay, IconPlayerStop, IconFiles, IconAlertCircle, IconInfoCircle, IconCheck, IconX } from '@tabler/icons-react'
import { open } from '@tauri-apps/plugin-dialog'

import type { WatermarkConfig, FileItem, ProcessingState } from '@/types/watermark'

interface ProcessingPanelProps {
  files: FileItem[]
  config: WatermarkConfig
  processingState: ProcessingState
  onProcess: (outputDir: string) => void
  onCancel: () => void
}

export function ProcessingPanel({
  files,
  config,
  processingState,
  onProcess,
  onCancel,
}: ProcessingPanelProps) {
  const [outputDir, setOutputDir] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const selectOutputDir = useCallback(async () => {
    try {
      const selection = await open({ directory: true, multiple: false })

      if (!selection) {
        return
      }

      const selectedPath = Array.isArray(selection) ? selection[0] ?? '' : selection
      setOutputDir(selectedPath ?? '')
      setErrorMessage(null)
    } catch (err) {
      console.error('Failed to select output directory', err)
      setErrorMessage('Unable to select output directory. Please try again.')
    }
  }, [])

  const handleProcess = useCallback(() => {
    if (!files.length) {
      setErrorMessage('Add files before processing.')
      return
    }

    if (!outputDir) {
      setErrorMessage('Please select an output directory.')
      return
    }

    setErrorMessage(null)
    onProcess(outputDir)
  }, [files.length, onProcess, outputDir])

  const handleCancel = useCallback(() => {
    onCancel()
  }, [onCancel])

  const disabled = processingState === 'processing'
  const filesCountLabel = files.length
    ? `Ready to process ${files.length} file${files.length === 1 ? '' : 's'}`
    : 'No files selected'
  
  const isWatermarkValid = config.watermarkType === 'text' ? config.text.trim() !== '' : !!config.imagePath
  const validationsComplete = files.length > 0 && !!outputDir && isWatermarkValid
  const readinessPercentage = (files.length > 0 ? 33 : 0) + (outputDir ? 33 : 0) + (isWatermarkValid ? 34 : 0)

  return (
    <Stack gap="md">
      {/* Status Indicator */}
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <ThemeIcon variant="light" size="lg">
            <IconFiles size={20} />
          </ThemeIcon>
          <div>
            <Text fw={600}>{filesCountLabel}</Text>
            <Text size="xs" c="dimmed">Selected for processing</Text>
          </div>
        </Group>
        <Badge size="lg" variant="light">
          {config.watermarkType === 'text' ? 'Text Watermark' : 'Image Watermark'}
        </Badge>
      </Group>

      {/* Configuration Summary */}
      <Divider my="sm" />
      <Alert icon={<IconInfoCircle />} color="blue" variant="light" title="Watermark Configuration">
        {config.watermarkType === 'text' ? (
          <Stack gap={4}>
            <Text size="sm">Text: "{config.text || 'Not set'}"</Text>
            <Text size="sm">Font: {config.fontFamily}, {config.fontSize}px</Text>
            <Text size="sm">Color: {config.textColor}</Text>
          </Stack>
        ) : (
          <Text size="sm">
            Image: {config.imagePath ? config.imagePath.split(/[/\\]/).pop() : 'Not selected'}
          </Text>
        )}
      </Alert>

      {/* Output Directory Section */}
      <Divider my="sm" />
      <Stack gap="xs">
        <Text fw={600} size="sm">Output Location</Text>
        <Group gap="xs">
          <IconInfoCircle size={16} />
          <Text size="sm" c="dimmed">Choose where processed files will be saved.</Text>
        </Group>
        <Box p="xs" style={{ border: '1px solid var(--mantine-color-dark-4)', borderRadius: 'var(--mantine-radius-md)', backgroundColor: 'var(--mantine-color-dark-6)' }}>
          <Group align="flex-end" gap="sm">
            <TextInput
              label="Output directory"
              value={outputDir}
              onChange={() => {}}
              placeholder="Select output directory"
              style={{ flex: 1 }}
              readOnly
              disabled={disabled}
              data-autofocus={false}
            />
            <Tooltip label="Browse for output directory">
              <ActionIcon
                size="xl"
                variant="light"
                color="blue"
                onClick={selectOutputDir}
                disabled={disabled}
                aria-label="Select output directory"
              >
                <IconFolderOpen size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Box>
        {errorMessage && (
          <Alert icon={<IconAlertCircle />} color="red" variant="light" mt="xs">
            {errorMessage}
          </Alert>
        )}
      </Stack>

      {/* Validation Checklist */}
      <Divider my="sm" />
      <Stack gap="xs">
        <Group gap="xs">
          {files.length > 0 ? (
            <IconCheck size={16} color="var(--mantine-color-green-6)" />
          ) : (
            <IconX size={16} color="var(--mantine-color-gray-5)" />
          )}
          <Text size="sm" c={files.length > 0 ? 'green' : 'dimmed'}>
            Files selected ({files.length})
          </Text>
        </Group>
        <Group gap="xs">
          {outputDir ? (
            <IconCheck size={16} color="var(--mantine-color-green-6)" />
          ) : (
            <IconX size={16} color="var(--mantine-color-gray-5)" />
          )}
          <Text size="sm" c={outputDir ? 'green' : 'dimmed'}>
            Output directory set
          </Text>
        </Group>
        <Group gap="xs">
          {isWatermarkValid ? (
            <IconCheck size={16} color="var(--mantine-color-green-6)" />
          ) : (
            <IconX size={16} color="var(--mantine-color-gray-5)" />
          )}
          <Text size="sm" c={isWatermarkValid ? 'green' : 'dimmed'}>
            Watermark configured
          </Text>
        </Group>
      </Stack>

      {/* Progress Indicator */}
      <Box>
        <Group justify="space-between" mb={4}>
          <Text size="xs" fw={500}>Ready to process</Text>
          <Text size="xs" c="dimmed">{readinessPercentage}%</Text>
        </Group>
        <Progress value={readinessPercentage} size="xs" color="blue" />
        <Text size="xs" c="dimmed" ta="center" mt={4}>
          {validationsComplete ? 'Ready to process' : 'Complete setup to continue'}
        </Text>
      </Box>

      {/* Action Buttons */}
      <Divider my="sm" />
      <Stack gap="xs">
        <Group gap="sm">
          <Button
            leftSection={<IconPlayerPlay size={16} />}
            variant={validationsComplete && !disabled ? 'gradient' : 'filled'}
            gradient={{ from: 'blue', to: 'cyan' }}
            size="lg"
            onClick={handleProcess}
            disabled={!validationsComplete || disabled}
            loading={disabled}
            style={{ flex: 1 }}
          >
            Start Processing
          </Button>

          {processingState === 'processing' && (
            <Tooltip label="Backend processing continues; UI progress will stop." withArrow>
              <Button
                leftSection={<IconPlayerStop size={16} />}
                color="red"
                variant="outline"
                size="lg"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </Tooltip>
          )}
        </Group>
        {processingState === 'processing' && (
          <Text size="xs" c="dimmed" ta="center">
            Processing in progress... This may take a few minutes.
          </Text>
        )}
        <Text size="xs" c="dimmed" ta="center">
          Tip: Press Enter to start processing when ready
        </Text>
      </Stack>
    </Stack>
  )
}
