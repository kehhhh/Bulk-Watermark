import { useEffect, useState } from 'react'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { Modal, Button, Text, Progress, Group, Stack, Alert } from '@mantine/core'
import { IconDownload, IconInfoCircle } from '@tabler/icons-react'

export function UpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updateVersion, setUpdateVersion] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkForUpdates()
  }, [])

  const checkForUpdates = async () => {
    try {
      const update = await check()
      if (update?.available) {
        setUpdateAvailable(true)
        setUpdateVersion(update.version)
      }
    } catch (err) {
      console.error('Failed to check for updates:', err)
      // Don't show error to user - updates are optional
    }
  }

  const installUpdate = async () => {
    try {
      setDownloading(true)
      setError(null)
      
      const update = await check()
      if (!update?.available) {
        setError('No update available')
        return
      }

      // Download and install with progress
      await update.downloadAndInstall((event: any) => {
        switch (event.event) {
          case 'Started':
            setDownloadProgress(0)
            break
          case 'Progress':
            setDownloadProgress(event.data.chunkLength / event.data.contentLength! * 100)
            break
          case 'Finished':
            setDownloadProgress(100)
            break
        }
      })

      // Restart the app to apply the update
      await relaunch()
    } catch (err) {
      console.error('Failed to install update:', err)
      setError(err instanceof Error ? err.message : 'Failed to install update')
      setDownloading(false)
    }
  }

  const handleClose = () => {
    setUpdateAvailable(false)
  }

  return (
    <Modal
      opened={updateAvailable}
      onClose={handleClose}
      title="Update Available"
      centered
      closeOnClickOutside={!downloading}
      closeOnEscape={!downloading}
      withCloseButton={!downloading}
    >
      <Stack gap="md">
        <Alert icon={<IconInfoCircle size={16} />} title="New Version" color="blue">
          Version {updateVersion} is now available!
        </Alert>

        {error && (
          <Alert color="red" title="Update Failed">
            {error}
          </Alert>
        )}

        {downloading ? (
          <Stack gap="sm">
            <Text size="sm">Downloading update...</Text>
            <Progress value={downloadProgress} animated />
            <Text size="xs" c="dimmed" ta="center">
              {Math.round(downloadProgress)}%
            </Text>
          </Stack>
        ) : (
          <Text size="sm" c="dimmed">
            The app will restart after the update is installed.
          </Text>
        )}

        <Group justify="flex-end">
          <Button
            variant="subtle"
            onClick={handleClose}
            disabled={downloading}
          >
            Later
          </Button>
          <Button
            leftSection={<IconDownload size={16} />}
            onClick={installUpdate}
            loading={downloading}
            disabled={downloading}
          >
            Update Now
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
