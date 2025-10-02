import { useCallback, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  ColorInput,
  Group,
  Loader,
  NumberInput,
  Select,
  Slider,
  Stack,
  Text,
  TextInput,
  SegmentedControl,
  Collapse,
  Divider,
  Tooltip,
  Box,
} from '@mantine/core'
import { 
  IconRefresh, 
  IconChevronDown, 
  IconChevronUp, 
  IconInfoCircle, 
  IconSparkles 
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'

import type { WatermarkConfig } from '@/types/watermark'
import { usePresets } from '@/hooks/usePresets'

const FONT_OPTIONS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Georgia',
  'Comic Sans MS',
  'Impact',
]

const POSITION_OPTIONS = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'center-left', label: 'Center Left' },
  { value: 'center', label: 'Center' },
  { value: 'center-right', label: 'Center Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'custom', label: 'Custom (Drag in Preview)' },
]

const OPACITY_MARKS = [
  { value: 0, label: '0%' },
  { value: 25, label: '25%' },
  { value: 50, label: '50%' },
  { value: 75, label: '75%' },
  { value: 100, label: '100%' },
]

interface WatermarkControlsProps {
  config: WatermarkConfig
  onUpdate: (partial: Partial<WatermarkConfig>) => void
  onSelectWatermarkImage: () => Promise<string | null>
  activePresetId?: string | null
  onApplyPreset: (presetId: string, config: WatermarkConfig) => void
}

export function WatermarkControls({ 
  config, 
  onUpdate, 
  onSelectWatermarkImage,
  activePresetId,
  onApplyPreset 
}: WatermarkControlsProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const { presets, isLoading: presetsLoading, error: presetsError, loadPresetConfig } = usePresets()

  const handleSelectWatermarkImage = useCallback(async () => {
    const path = await onSelectWatermarkImage()
    if (path) {
      onUpdate({ imagePath: path, watermarkType: 'image' })
    }
  }, [onSelectWatermarkImage, onUpdate])

  const handlePositionChange = useCallback(
    (value: string | null) => {
      if (!value) return;
      
      if (value === 'custom') {
        // User selected custom from dropdown, re-enable stored custom coordinates
        onUpdate({ positionMode: 'custom' });
        return;
      }
      
      // User selected a preset position, switch to preset mode
      onUpdate({
        position: value as WatermarkConfig['position'],
        positionMode: 'preset'
      });
    },
    [onUpdate]
  );

  const handleResetToPreset = useCallback(() => {
    onUpdate({
      positionMode: 'preset',
      position: config.position // Keep the current preset position value
    });
  }, [onUpdate, config.position]);

  const handlePresetChange = useCallback(
    async (value: string | null) => {
      if (!value || value === 'custom') {
        return
      }

      try {
        const loadedConfig = await loadPresetConfig(value)
        if (loadedConfig) {
          onApplyPreset(value, loadedConfig)
          notifications.show({
            title: 'Preset applied',
            message: `Successfully applied ${presets.find(p => p.id === value)?.name || value} preset`,
            color: 'blue',
          })
        } else {
          notifications.show({
            title: 'Error',
            message: 'Failed to load preset configuration',
            color: 'red',
          })
        }
      } catch (error) {
        console.error('Error applying preset:', error)
        notifications.show({
          title: 'Error',
          message: 'An error occurred while applying the preset',
          color: 'red',
        })
      }
    },
    [loadPresetConfig, onApplyPreset, presets]
  )

  // Get the current preset description
  const selectedPresetDescription = activePresetId 
    ? presets.find(p => p.id === activePresetId)?.description 
    : undefined

  return (
    <Stack gap="md">
      {/* Preset Selector */}
      <Stack gap="xs">
        <Group gap="xs">
          <IconSparkles size={16} />
          <Text size="sm" fw={500}>Preset Styles</Text>
        </Group>
        
        {presetsLoading ? (
          <Group gap="xs">
            <Loader size="xs" />
            <Text size="xs" c="dimmed">Loading presets...</Text>
          </Group>
        ) : presetsError ? (
          <Alert color="red" title="Error loading presets">
            {presetsError}
          </Alert>
        ) : (
          <>
            <Select
              value={activePresetId || 'custom'}
              onChange={handlePresetChange}
              data={[
                ...presets.map(preset => ({
                  value: preset.id,
                  label: preset.name,
                })),
                { value: 'custom', label: 'Custom' },
              ]}
              placeholder="Choose a preset style"
              searchable
              description={selectedPresetDescription}
            />
            {activePresetId && (
              <Badge color="blue" variant="light" size="sm">
                Active: {presets.find(p => p.id === activePresetId)?.name || activePresetId}
              </Badge>
            )}
          </>
        )}
      </Stack>

      <Divider my="sm" />

      {/* Watermark Type Selector */}
      <div>
        <Text size="sm" fw={500} mb="xs">Active Watermark Type</Text>
        <SegmentedControl
          value={config.watermarkType}
          onChange={(value) => onUpdate({ watermarkType: value as WatermarkConfig['watermarkType'] })}
          data={[
            { label: 'Text', value: 'text' },
            { label: 'Logo', value: 'image' },
          ]}
          fullWidth
          size="md"
        />
        <Text size="xs" c="dimmed" mt={4}>
          Configure both below, switch between them here
        </Text>
      </div>

      <Divider />

      {/* Text Watermark Controls */}
      <div>
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={600}>Text Watermark</Text>
          {config.watermarkType === 'text' && (
            <Badge color="blue" size="sm" variant="light">Active</Badge>
          )}
        </Group>
        {true && (
        <Stack gap="md">
          <div>
            <TextInput
              label="Watermark Text"
              placeholder="Enter your watermark text"
              value={config.text}
              onChange={(event) => onUpdate({ text: event.currentTarget.value })}
            />
            <Text size="xs" c="dimmed" ta="right" mt={4}>
              {config.text.length} characters
            </Text>
          </div>

          <Group grow>
            <ColorInput
              label="Text Color"
              value={config.textColor}
              onChange={(value) => onUpdate({ textColor: value })}
            />
            <NumberInput
              label="Font Size (px)"
              min={12}
              max={3000}
              step={1}
              value={config.fontSize}
              onChange={(value) => {
                if (typeof value === 'number') {
                  onUpdate({ fontSize: value })
                }
              }}
              allowDecimal={false}
              clampBehavior="blur"
            />
          </Group>

          <Select
            label="Font Family"
            data={FONT_OPTIONS.map((font) => ({ value: font, label: font }))}
            value={config.fontFamily}
            onChange={(value) => {
              if (value) {
                onUpdate({ fontFamily: value })
              }
            }}
            searchable
          />
        </Stack>
      )}
      </div>

      <Divider />
      
      {/* Logo Watermark Controls */}
      <div>
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={600}>Logo Watermark</Text>
          {config.watermarkType === 'image' && (
            <Badge color="blue" size="sm" variant="light">Active</Badge>
          )}
        </Group>
        {true && (
        <Stack gap="sm">
          {config.imagePath ? (
            <Stack gap="md">
              <Box>
                <Text size="sm" fw={500} mb="xs">Your Logo/Watermark</Text>
                <Text size="xs" c="dimmed" style={{ wordBreak: 'break-all' }}>
                  {config.imagePath}
                </Text>
                <Group gap="xs" mt="sm">
                  <Button variant="light" onClick={handleSelectWatermarkImage} size="sm">
                    Change Logo
                  </Button>
                  <Button 
                    variant="light" 
                    color="red" 
                    onClick={() => onUpdate({ imagePath: null })} 
                    size="sm"
                  >
                    Remove Logo
                  </Button>
                </Group>
              </Box>
              
              <NumberInput
                label="Logo Size (% of image width)"
                description="Size of your logo relative to the photos being watermarked"
                min={1}
                max={100}
                step={1}
                value={config.imageScale || 20}
                onChange={(value) => {
                  const numeric = typeof value === 'number' ? value : parseInt(value as string, 10)
                  if (!Number.isNaN(numeric)) {
                    onUpdate({ imageScale: Math.max(1, Math.min(100, numeric)) })
                  }
                }}
                suffix="%"
              />
            </Stack>
          ) : (
            <Box
              p="lg"
              style={{
                border: '2px dashed var(--mantine-color-gray-4)',
                borderRadius: 'var(--mantine-radius-md)',
                textAlign: 'center',
                cursor: 'pointer',
              }}
              onClick={handleSelectWatermarkImage}
            >
              <Text size="sm" c="dimmed">No logo selected</Text>
              <Text size="xs" c="dimmed" mt={4}>Click to upload your logo/watermark image</Text>
            </Box>
          )}
          {!config.imagePath && (
            <Button variant="light" onClick={handleSelectWatermarkImage}>
              Upload Your Logo
            </Button>
          )}
        </Stack>
      )}
      </div>

      {/* Advanced Options */}
      <Divider my="sm" />

      <Box
        onClick={() => setAdvancedOpen(!advancedOpen)}
        style={{ cursor: 'pointer' }}
      >
        <Group justify="space-between">
          <Group gap="xs">
            <IconInfoCircle size={16} />
            <Text size="sm" fw={500}>Advanced Options</Text>
          </Group>
          {advancedOpen ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
        </Group>
      </Box>

      <Collapse in={advancedOpen}>
        <Stack gap="md" mt="md">
          {/* Position Controls */}
          <Stack gap="xs">
            <Tooltip label="Choose a preset position or drag the watermark in the preview for custom placement">
              <Select
                label="Position"
                data={POSITION_OPTIONS}
                value={config.positionMode === 'custom' ? 'custom' : config.position}
                onChange={handlePositionChange}
              />
            </Tooltip>
            
            {config.positionMode === 'custom' && config.customPosition && (
              <Group gap="xs" align="center">
                <Badge size="sm" variant="light" color="blue">
                  Custom Position: ({(config.customPosition.x * 100).toFixed(1)}%, {(config.customPosition.y * 100).toFixed(1)}%)
                </Badge>
                <Button
                  size="xs"
                  variant="subtle"
                  leftSection={<IconRefresh size={14} />}
                  onClick={handleResetToPreset}
                >
                  Reset to Preset
                </Button>
              </Group>
            )}
            
            {config.positionMode !== 'custom' && (
              <Group gap="xs">
                <IconInfoCircle size={14} />
                <Text size="xs" c="dimmed">
                  Drag the watermark in the preview to set a custom position
                </Text>
              </Group>
            )}
          </Stack>

          {/* Opacity Controls */}
          <Stack gap={4}>
            <Group justify="space-between">
              <Text size="sm" fw={500}>Opacity</Text>
              <Text size="sm" c="dimmed">{config.opacity}%</Text>
            </Group>
            <Slider
              value={config.opacity}
              onChange={(value) => onUpdate({ opacity: value })}
              min={0}
              max={100}
              step={1}
              marks={OPACITY_MARKS}
            />
            <Group gap="xs" mt="xs">
              <Button
                size="xs"
                variant="subtle"
                onClick={() => onUpdate({ opacity: 25 })}
              >
                25%
              </Button>
              <Button
                size="xs"
                variant="subtle"
                onClick={() => onUpdate({ opacity: 50 })}
              >
                50%
              </Button>
              <Button
                size="xs"
                variant="subtle"
                onClick={() => onUpdate({ opacity: 75 })}
              >
                75%
              </Button>
              <Button
                size="xs"
                variant="subtle"
                onClick={() => onUpdate({ opacity: 100 })}
              >
                100%
              </Button>
            </Group>
          </Stack>
        </Stack>
      </Collapse>
    </Stack>
  )
}
