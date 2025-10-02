import {
  Stack,
  Group,
  Text,
  Table,
  Badge,
  Progress,
  Loader,
  ThemeIcon,
  Box,
  RingProgress,
  Card,
} from '@mantine/core'
import { IconCheck, IconX, IconClock, IconPlayerPlay } from '@tabler/icons-react'

import type { ProgressPayload, ProcessingState } from '@/types/watermark'

interface ProgressDisplayProps {
  progressArray: ProgressPayload[]
  processingState: ProcessingState
}

const STATUS_COLORS: Record<ProgressPayload['status'], string> = {
  processing: 'blue',
  complete: 'green',
  error: 'red',
}

function getFilename(path: string) {
  const segments = path.split(/\\|\//)
  return segments[segments.length - 1] || path
}

function getRowStatusBadge(status: ProgressPayload['status']) {
  switch (status) {
    case 'processing':
      return (
        <Badge variant="light" color={STATUS_COLORS[status]} leftSection={<Loader size={12} />}>
          Processing
        </Badge>
      )
    case 'complete':
      return (
        <Badge variant="light" color={STATUS_COLORS[status]} leftSection={<IconCheck size={12} />}>
          Complete
        </Badge>
      )
    case 'error':
      return (
        <Badge variant="light" color={STATUS_COLORS[status]} leftSection={<IconX size={12} />}>
          Failed
        </Badge>
      )
    default:
      return (
        <Badge variant="light" color="gray" leftSection={<IconClock size={12} />}>
          Pending
        </Badge>
      )
  }
}

export function ProgressDisplay({ progressArray, processingState }: ProgressDisplayProps) {
  const totalFiles = progressArray.reduce((acc, payload) => Math.max(acc, payload.totalFiles), 0)
  const completedCount = progressArray.filter(payload => payload.status === 'complete').length
  const processingCount = progressArray.filter(payload => payload.status === 'processing').length
  const failedCount = progressArray.filter(payload => payload.status === 'error').length
  const finishedCount = completedCount + failedCount
  const percentage = totalFiles ? Math.min(100, (finishedCount / totalFiles) * 100) : 0
  const progressLabel = totalFiles ? `${finishedCount} / ${totalFiles} files` : '0 / 0 files'

  const titleText = processingState === 'complete' ? 'Processing Complete' : processingState === 'error' ? 'Processing Failed' : 'Processing Files...'
  const progressColor = processingState === 'error' ? 'red' : processingState === 'complete' ? 'green' : 'blue'

  const rows = progressArray
    .slice()
    .sort((a, b) => a.fileIndex - b.fileIndex)
    .map(payload => {
      const isProcessing = payload.status === 'processing'
      const borderColor = payload.status === 'processing' ? 'blue' : payload.status === 'complete' ? 'green' : payload.status === 'error' ? 'red' : 'gray'

      return (
        <Table.Tr
          key={payload.filePath}
          style={{
            backgroundColor: isProcessing ? 'var(--mantine-color-blue-light-hover)' : undefined,
            borderLeft: `3px solid var(--mantine-color-${borderColor}-6)`,
            transition: 'all 0.3s ease',
          }}
        >
          <Table.Td>
            <Group gap="xs">
              <ThemeIcon size="sm" variant="light" color="blue">
                �
              </ThemeIcon>
              <div>
                <Text fw={600} size="sm">{getFilename(payload.filePath)}</Text>
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {payload.filePath}
                </Text>
              </div>
            </Group>
          </Table.Td>
          <Table.Td>{getRowStatusBadge(payload.status)}</Table.Td>
          <Table.Td>
            <div>
              <Progress value={((payload.fileIndex + 1) / payload.totalFiles) * 100} size="xs" mb={4} />
              <Text size="sm" c="dimmed">
                {payload.fileIndex + 1} of {payload.totalFiles}
              </Text>
            </div>
          </Table.Td>
        </Table.Tr>
      )
    })

  return (
    <Card shadow="md" radius="lg" withBorder p="lg">
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <ThemeIcon size="lg" variant="light" color={progressColor}>
              {processingState === 'complete' ? <IconCheck size={20} /> : <IconPlayerPlay size={20} />}
            </ThemeIcon>
            <Text fw={600} size="lg">
              {titleText}
            </Text>
          </Group>
          <Badge size="lg" variant="light" color={progressColor}>
            {progressLabel}
          </Badge>
        </Group>

        {/* Visual Progress Ring */}
        <Group justify="center" my="md">
          <RingProgress
            size={120}
            thickness={12}
            sections={[{ value: percentage, color: progressColor }]}
            label={
              <Text size="xl" fw={700} ta="center">
                {percentage.toFixed(0)}%
              </Text>
            }
          />
        </Group>

        {/* Linear Progress Bar */}
        <Stack gap={4}>
          <Progress
            value={percentage}
            color={progressColor}
            animated={processingState === 'processing'}
            striped
            size="xl"
            radius="xl"
          />
          <Text size="xs" c="dimmed" ta="center">
            {processingState === 'processing' ? 'Processing...' : processingState === 'complete' ? 'All files processed!' : 'Processing complete with errors'}
          </Text>
        </Stack>

        {/* Status Summary Cards */}
        {progressArray.length > 0 && (
          <Group grow mt="md">
            <Box p="sm" style={{ backgroundColor: 'var(--mantine-color-dark-6)', borderRadius: 'var(--mantine-radius-md)', textAlign: 'center', border: '1px solid var(--mantine-color-green-8)' }}>
              <Text size="xl" fw={700} c="green">{completedCount}</Text>
              <Text size="xs" c="dimmed">Completed</Text>
            </Box>
            <Box p="sm" style={{ backgroundColor: 'var(--mantine-color-dark-6)', borderRadius: 'var(--mantine-radius-md)', textAlign: 'center', border: '1px solid var(--mantine-color-blue-8)' }}>
              <Text size="xl" fw={700} c="blue">{processingCount}</Text>
              <Text size="xs" c="dimmed">Processing</Text>
            </Box>
            <Box p="sm" style={{ backgroundColor: 'var(--mantine-color-dark-6)', borderRadius: 'var(--mantine-radius-md)', textAlign: 'center', border: '1px solid var(--mantine-color-red-8)' }}>
              <Text size="xl" fw={700} c="red">{failedCount}</Text>
              <Text size="xs" c="dimmed">Failed</Text>
            </Box>
          </Group>
        )}

        {/* File Table */}
        {progressArray.length ? (
          <Table.ScrollContainer minWidth={500} mah={300}>
            <Table striped highlightOnHover verticalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>
                    <Group gap="xs">
                      <Text fw={700} size="sm">File</Text>
                    </Group>
                  </Table.Th>
                  <Table.Th>
                    <Text fw={700} size="sm">Status</Text>
                  </Table.Th>
                  <Table.Th>
                    <Text fw={700} size="sm">Order</Text>
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        ) : (
          <Box p="xl" style={{ textAlign: 'center' }}>
            <ThemeIcon size={60} radius="xl" variant="light" color="gray">
              <IconClock size={30} />
            </ThemeIcon>
            <Text fw={600} mt="md">Waiting to start...</Text>
            <Text size="sm" c="dimmed">Files will appear here once processing begins</Text>
          </Box>
        )}
      </Stack>
    </Card>
  )
}
