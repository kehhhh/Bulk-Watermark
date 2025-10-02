import { useCallback, useEffect, useMemo, useState } from 'react'
import { Center, Container, Loader, Stack, Text, Title, Card, Box, Flex, Group, Transition } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMediaQuery } from '@mantine/hooks'
import { IconSettings, IconFiles, IconEye } from '@tabler/icons-react'

import { FileList } from '@/components/FileList'
import { ProcessingPanel } from '@/components/ProcessingPanel'
import { ProgressDisplay } from '@/components/ProgressDisplay'
import { PreviewCanvas } from '@/components/PreviewCanvas'
import { ResultsSummary } from '@/components/ResultsSummary'
import { WatermarkControls } from '@/components/WatermarkControls'
import { useFileSelection } from '@/hooks/useFileSelection'
import { useWatermarkProcessor } from '@/hooks/useWatermarkProcessor'
import { useWatermarkStore } from '@/hooks/useWatermarkStore'
import type { FileItem } from '@/types/watermark'

export function Home() {
  const { config, updateConfig, isLoading, activePresetId, applyPreset } = useWatermarkStore()
  const {
    selectedFiles,
    selectFiles,
    selectWatermarkImage,
    removeFile,
    clearFiles,
  } = useFileSelection()
  const [currentPreviewFile, setCurrentPreviewFile] = useState<FileItem | null>(null)
  const [showResultsModal, setShowResultsModal] = useState(false)
  const isMobile = useMediaQuery('(max-width: 768px)')

  const {
    processBatch,
    cancelProcessing,
    processingState,
    isProcessing,
    progressArray,
    result,
    error,
  } = useWatermarkProcessor()

  useEffect(() => {
    if (selectedFiles.length === 0) {
      setCurrentPreviewFile(null)
      return
    }

    setCurrentPreviewFile((previous) => {
      if (!previous) {
        return selectedFiles[0]
      }

      const stillExists = selectedFiles.some((file) => file.path === previous.path)
      return stillExists ? previous : selectedFiles[0]
    })
  }, [selectedFiles])

  useEffect(() => {
    if (processingState === 'complete' && result) {
      notifications.show({
        title: 'Processing Complete',
        message: `${result.successful} file${result.successful === 1 ? '' : 's'} processed successfully`,
        color: 'green',
      })
      setShowResultsModal(true)
    }

    if (processingState === 'error' && error) {
      notifications.show({
        title: 'Processing Failed',
        message: error,
        color: 'red',
      })
    }

    if (processingState === 'cancelled') {
      notifications.show({
        title: 'Processing Cancelled',
        message: 'Processing was cancelled by the user.',
        color: 'yellow',
      })
    }
  }, [processingState, result, error])

  const handleProcess = useCallback(
    (outputDir: string) => {
      void processBatch(selectedFiles, config, outputDir)
    },
    [processBatch, selectedFiles, config],
  )

  const handleCloseResults = useCallback(() => {
    setShowResultsModal(false)
  }, [])

  const shouldShowProgress = useMemo(
    () => isProcessing || progressArray.length > 0,
    [isProcessing, progressArray.length],
  )

  if (isLoading) {
    return (
      <Center style={{ height: '100%' }}>
        <Card shadow="md" radius="lg" withBorder p="xl">
          <Stack align="center" gap="sm">
            <Loader size="lg" />
            <Text size="sm" c="dimmed">
              Loading watermark settings...
            </Text>
          </Stack>
        </Card>
      </Center>
    )
  }

  return (
    <Container size="xl" py="md">
      <Flex
        direction={{ base: 'column', md: 'row' }}
        gap="lg"
        align="flex-start"
      >
        {/* Sticky Sidebar */}
        <Box style={{ flex: isMobile ? '1 1 100%' : '0 0 320px' }}>
          <Stack gap="md">
            <Card shadow="md" radius="lg" withBorder>
              <Group gap="xs" mb="md">
                <IconSettings size={20} />
                <Text fw={600} size="lg">Watermark Settings</Text>
              </Group>
              <WatermarkControls
                config={config}
                onUpdate={updateConfig}
                onSelectWatermarkImage={selectWatermarkImage}
                activePresetId={activePresetId}
                onApplyPreset={applyPreset}
              />
            </Card>

            <Card shadow="md" radius="lg" withBorder>
              <Group gap="xs" mb="md">
                <IconFiles size={20} />
                <Text fw={600} size="lg">Batch Files</Text>
              </Group>
              <FileList
                files={selectedFiles}
                onAddFiles={selectFiles}
                onRemoveFile={removeFile}
                onSelectFile={setCurrentPreviewFile}
                onClearFiles={clearFiles}
              />
            </Card>
          </Stack>
        </Box>

        {/* Main Content Area */}
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Stack gap="lg">
            <Card shadow="sm" radius="lg" withBorder p="lg">
              <Title
                order={1}
                style={{
                  background: 'linear-gradient(45deg, var(--mantine-color-blue-6), var(--mantine-color-cyan-6))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Bulk Watermark Editor
              </Title>
              <Text c="dimmed" mt="xs">Configure your watermark and select files to process</Text>
            </Card>

            <Card shadow="md" radius="lg" withBorder p="lg">
              <Group justify="space-between" mb="md">
                <Group gap="xs">
                  <IconEye size={20} />
                  <Text fw={600} size="lg">Live Preview</Text>
                </Group>
              </Group>
              <PreviewCanvas config={config} previewFile={currentPreviewFile} onConfigUpdate={updateConfig} />
              <Text size="xs" c="dimmed" ta="center" mt="sm">
                Drag the watermark to reposition it
              </Text>
            </Card>

            <Card shadow="md" radius="lg" withBorder p="lg">
              <ProcessingPanel
                files={selectedFiles}
                config={config}
                processingState={processingState}
                onProcess={handleProcess}
                onCancel={cancelProcessing}
              />
            </Card>

            {shouldShowProgress && (
              <Transition mounted={shouldShowProgress} transition="slide-up" duration={300}>
                {(styles) => (
                  <div style={styles}>
                    <ProgressDisplay progressArray={progressArray} processingState={processingState} />
                  </div>
                )}
              </Transition>
            )}
          </Stack>
        </Box>
      </Flex>

      <ResultsSummary result={result} isOpen={showResultsModal} onClose={handleCloseResults} />
    </Container>
  )
}
