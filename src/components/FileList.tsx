import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Box,
  Tooltip,
} from '@mantine/core'
import { IconPlus, IconTrash, IconPhoto, IconVideo, IconCloudUpload } from '@tabler/icons-react'

import type { FileItem } from '@/types/watermark'

interface FileListProps {
  files: FileItem[]
  onAddFiles: () => void
  onRemoveFile: (path: string) => void
  onSelectFile?: (file: FileItem) => void
  onClearFiles?: () => void
}

const getBadgeColor = (type: FileItem['type']) => (type === 'image' ? 'blue' : 'teal')

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return 'Unknown'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileList({ files, onAddFiles, onRemoveFile, onSelectFile, onClearFiles }: FileListProps) {
  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between" align="center">
        <div>
          <Text fw={700} size="lg">{files.length} Files</Text>
          <Text size="xs" c="dimmed">Ready to process</Text>
        </div>
        <Tooltip label="Select images or videos to watermark">
          <Button
            leftSection={<IconPlus size={16} />}
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan' }}
            size="sm"
            onClick={onAddFiles}
          >
            Add Files
          </Button>
        </Tooltip>
      </Group>

      {/* Empty State */}
      {files.length === 0 ? (
        <Box p="xl" style={{ textAlign: 'center', backgroundColor: 'var(--mantine-color-dark-6)', borderRadius: 'var(--mantine-radius-md)' }}>
          <ThemeIcon size={80} radius="xl" variant="light" color="gray">
            <IconCloudUpload size={40} />
          </ThemeIcon>
          <Text fw={600} size="lg" mt="md">No files selected</Text>
          <Text size="sm" c="dimmed" mt="xs">
            Click "Add Files" to select images or videos for watermarking
          </Text>
          <Button
            variant="light"
            mt="md"
            onClick={onAddFiles}
            leftSection={<IconPlus size={16} />}
          >
            Add Files
          </Button>
        </Box>
      ) : (
        <>
          {/* File Table */}
          <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>
                  <Text fw={700} size="sm">Name</Text>
                </Table.Th>
                <Table.Th>
                  <Text fw={700} size="sm">Type</Text>
                </Table.Th>
                <Table.Th>
                  <Text fw={700} size="sm">Path</Text>
                </Table.Th>
                <Table.Th style={{ width: 50 }}>
                  <Text fw={700} size="sm">Actions</Text>
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {files.map((file) => (
                <Table.Tr
                  key={file.path}
                  onClick={() => onSelectFile?.(file)}
                  style={{
                    cursor: onSelectFile ? 'pointer' : 'default',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <Table.Td>
                    <Group gap="xs">
                      <ThemeIcon size="md" variant="light" color={file.type === 'image' ? 'blue' : 'teal'}>
                        {file.type === 'image' ? <IconPhoto size={16} /> : <IconVideo size={16} />}
                      </ThemeIcon>
                      <div>
                        <Text fw={600} size="sm">{file.name}</Text>
                        <Text size="xs" c="dimmed">{formatFileSize(file.size)}</Text>
                      </div>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={getBadgeColor(file.type)}
                      variant="light"
                      size="md"
                      leftSection={file.type === 'image' ? <IconPhoto size={12} /> : <IconVideo size={12} />}
                    >
                      {file.type}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Tooltip label={file.path}>
                      <Text size="sm" c="dimmed" style={{ maxWidth: 180 }} truncate>
                        {file.path}
                      </Text>
                    </Tooltip>
                  </Table.Td>
                  <Table.Td>
                    <Tooltip label="Remove file">
                      <ActionIcon
                        variant="light"
                        color="red"
                        size="lg"
                        aria-label={`Remove ${file.name}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          onRemoveFile(file.path)
                        }}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {/* File Count Summary */}
          <Group justify="space-between" mt="sm">
            <Text size="xs" c="dimmed">{files.length} file(s) selected</Text>
            {onClearFiles && files.length > 0 && (
              <Button
                size="xs"
                variant="subtle"
                color="red"
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all files?')) {
                    onClearFiles()
                  }
                }}
              >
                Clear All
              </Button>
            )}
          </Group>
        </>
      )}
    </Stack>
  )
}
