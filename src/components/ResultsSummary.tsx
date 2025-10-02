import {
  Modal,
  Stack,
  Group,
  Text,
  Badge,
  Button,
  Divider,
  Alert,
  Code,
  ThemeIcon,
  Box,
  Timeline,
  CopyButton,
  Tooltip,
  ActionIcon,
} from '@mantine/core'
import { IconCheck, IconX, IconAlertCircle, IconInfoCircle, IconCopy, IconFolderOpen } from '@tabler/icons-react'
import { invoke } from '@tauri-apps/api/core'

import type { BatchResult } from '@/types/watermark'

interface ResultsSummaryProps {
  result: BatchResult | null
  isOpen: boolean
  onClose: () => void
}

function getFilename(path: string) {
  const segments = path.split(/\\|\//)
  return segments[segments.length - 1] || path
}

function getDirectoryPath(filePath: string): string {
  const segments = filePath.split(/\\|\//)
  segments.pop() // Remove filename
  return segments.join('\\') || segments.join('/')
}

export function ResultsSummary({ result, isOpen, onClose }: ResultsSummaryProps) {
  const titleText = result && result.failed === 0 ? 'Processing Complete! 🎉' : result && result.failed > 0 ? 'Processing Finished with Errors' : 'Processing Complete'
  const successPercentage = result ? (result.successful / result.total) * 100 : 0

  const handleOpenFolder = async () => {
    if (result && result.files.length > 0) {
      const firstSuccessfulFile = result.files.find(f => f.status === 'success' && f.outputPath)
      if (firstSuccessfulFile?.outputPath) {
        const folderPath = getDirectoryPath(firstSuccessfulFile.outputPath)
        try {
          await invoke('open_folder_in_explorer', { path: folderPath })
        } catch (error) {
          console.error('Failed to open folder:', error)
        }
      }
    }
  }

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      size="xl"
      centered
      overlayProps={{ opacity: 0.55, blur: 3 }}
      transitionProps={{ transition: 'slide-up', duration: 300 }}
      title={
        <Group gap="xs">
          <ThemeIcon size="lg" radius="xl" variant="light" color={result && result.failed === 0 ? 'green' : 'orange'}>
            {result && result.failed === 0 ? <IconCheck size={20} /> : <IconAlertCircle size={20} />}
          </ThemeIcon>
          <Text fw={600} size="lg">{titleText}</Text>
        </Group>
      }
    >
      {result ? (
        <Stack gap="lg">
          {/* Summary Badges */}
          <Box p="md" style={{ backgroundColor: 'var(--mantine-color-dark-6)', borderRadius: 'var(--mantine-radius-md)' }}>
            <Group gap="sm" wrap="wrap" justify="center">
              <Badge color="green" size="xl" variant="filled" leftSection={<IconCheck size={16} />}>
                {result.successful} Successful {successPercentage === 100 && '(100%)'}
              </Badge>
              <Badge color="red" size="xl" variant={result.failed > 0 ? 'filled' : 'light'} leftSection={<IconX size={16} />}>
                {result.failed} Failed
              </Badge>
              <Badge color="gray" size="xl" variant="light" leftSection={<IconInfoCircle size={16} />}>
                {result.total} Total
              </Badge>
            </Group>
          </Box>

          {/* Success Alert */}
          {result.successful > 0 && (
            <Alert color="green" icon={<IconCheck size={24} />} variant={result.failed === 0 ? 'filled' : 'light'}>
              <Stack gap="sm">
                <Text fw={500}>
                  {result.failed === 0 ? '🎊 All files processed successfully!' : `${result.successful} file${result.successful === 1 ? '' : 's'} processed successfully.`}
                </Text>
                <Text size="sm">Watermarked files are saved in your selected output directory.</Text>
                <Button
                  variant={result.failed === 0 ? 'white' : 'light'}
                  color="green"
                  size="sm"
                  leftSection={<IconFolderOpen size={16} />}
                  onClick={handleOpenFolder}
                  mt="xs"
                >
                  Open Output Folder
                </Button>
              </Stack>
            </Alert>
          )}

          {/* Failure Alert */}
          {result.failed > 0 && (
            <Alert color="red" icon={<IconAlertCircle size={24} />} variant="light">
              <Stack gap={4}>
                <Text fw={500}>Some files encountered issues. Don&apos;t worry, we&apos;ve saved the successful ones!</Text>
                <Text size="sm">Review the error messages below for troubleshooting. {result.failed} file{result.failed === 1 ? '' : 's'} failed to process.</Text>
              </Stack>
            </Alert>
          )}

          {/* Timeline View */}
          <Divider label="Processing Results" labelPosition="center" my="lg" />

          <Timeline active={result.files.length} bulletSize={24} lineWidth={2}>
            {result.files.map((file) => (
              <Timeline.Item
                key={file.inputPath}
                bullet={file.status === 'success' ? <IconCheck size={12} /> : <IconX size={12} />}
                color={file.status === 'success' ? 'green' : 'red'}
                title={
                  <Group justify="space-between">
                    <Text fw={600}>{getFilename(file.inputPath)}</Text>
                    <Badge size="sm" color={file.status === 'success' ? 'green' : 'red'}>
                      {file.status === 'success' ? 'Success' : 'Failed'}
                    </Badge>
                  </Group>
                }
              >
                {file.status === 'success' && file.outputPath ? (
                  <Stack gap="xs" mt="xs">
                    <Group justify="space-between" gap="xs">
                      <Text size="xs" c="dimmed" style={{ wordBreak: 'break-all', flex: 1 }}>
                        Output: {file.outputPath}
                      </Text>
                      <CopyButton value={file.outputPath}>
                        {({ copied, copy }) => (
                          <Tooltip label={copied ? 'Copied!' : 'Copy path'}>
                            <ActionIcon size="sm" variant="subtle" onClick={copy}>
                              <IconCopy size={14} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </CopyButton>
                    </Group>
                  </Stack>
                ) : file.status === 'failed' && file.error ? (
                  <Alert color="red" variant="light" mt="xs">
                    <Stack gap={4}>
                      <Text size="sm" fw={500}>Error Details:</Text>
                      <Code block style={{ fontSize: '11px' }}>{file.error}</Code>
                    </Stack>
                  </Alert>
                ) : null}
              </Timeline.Item>
            ))}
          </Timeline>

          {/* Action Buttons */}
          <Group justify="space-between" mt="lg">
            <Text size="xs" c="dimmed">
              Processing completed at {new Date().toLocaleTimeString()}
            </Text>
            <Group gap="sm">
              {result.successful > 0 && (
                <Button
                  variant="light"
                  color="blue"
                  leftSection={<IconFolderOpen size={16} />}
                  onClick={handleOpenFolder}
                >
                  Open Folder
                </Button>
              )}
              <Button variant="light" onClick={onClose}>
                Done
              </Button>
            </Group>
          </Group>
        </Stack>
      ) : (
        <Stack gap="md" align="center" justify="center" py="xl">
          <ThemeIcon size={80} radius="xl" variant="light">
            <IconInfoCircle size={40} />
          </ThemeIcon>
          <Text fw={600}>No results available</Text>
          <Text size="sm" c="dimmed">This shouldn&apos;t happen!</Text>
          <Button onClick={onClose} mt="md">Close</Button>
        </Stack>
      )}
    </Modal>
  )
}
