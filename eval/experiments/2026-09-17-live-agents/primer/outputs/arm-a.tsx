import {useState} from 'react'
import {ActionList, ActionMenu, Banner, Heading, IconButton, SegmentedControl, Stack, Text, ToggleSwitch} from '@primer/react'
import {Blankslate} from '@primer/react/experimental'
import {IssueOpenedIcon, KebabHorizontalIcon} from '@primer/octicons-react'

export type RepoSettingsPageProps = {
  /** Whether the repository currently has any open issues */
  hasIssues?: boolean
  /** Called when the user opts to create the first issue from the empty state */
  onCreateIssue?: () => void
  /** Called when the user renames the repository from the "..." menu */
  onRename?: () => void
  /** Called when the user archives the repository from the "..." menu */
  onArchive?: () => void
  /** Called when the user deletes the repository from the "..." menu */
  onDelete?: () => void
}

export function RepoSettingsPage({
  hasIssues = false,
  onCreateIssue,
  onRename,
  onArchive,
  onDelete,
}: RepoSettingsPageProps) {
  const [isMaintenanceNoticeVisible, setIsMaintenanceNoticeVisible] = useState(true)
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true)
  const [selectedView, setSelectedView] = useState<'preview' | 'code'>('preview')

  return (
    <Stack direction="vertical" gap="normal">
      {isMaintenanceNoticeVisible && (
        <Banner
          variant="warning"
          title="Scheduled maintenance tonight"
          description="This repository may be briefly unavailable while we perform scheduled maintenance tonight."
          onDismiss={() => setIsMaintenanceNoticeVisible(false)}
        />
      )}

      <Stack direction="horizontal" justify="space-between" align="center">
        <Heading as="h1" variant="medium">
          Repository settings
        </Heading>
        <ActionMenu>
          <ActionMenu.Anchor>
            <IconButton icon={KebabHorizontalIcon} aria-label="Repository actions" />
          </ActionMenu.Anchor>
          <ActionMenu.Overlay width="small">
            <ActionList>
              <ActionList.Item onSelect={() => onRename?.()}>Rename</ActionList.Item>
              <ActionList.Item onSelect={() => onArchive?.()}>Archive</ActionList.Item>
              <ActionList.Divider />
              <ActionList.Item variant="danger" onSelect={() => onDelete?.()}>
                Delete
              </ActionList.Item>
            </ActionList>
          </ActionMenu.Overlay>
        </ActionMenu>
      </Stack>

      <Stack direction="horizontal" justify="space-between" align="center">
        <Text id="email-notifications-label" weight="semibold">
          Email notifications
        </Text>
        <ToggleSwitch
          aria-labelledby="email-notifications-label"
          checked={emailNotificationsEnabled}
          onChange={setEmailNotificationsEnabled}
        />
      </Stack>

      <SegmentedControl aria-label="View mode" onChange={index => setSelectedView(index === 0 ? 'preview' : 'code')}>
        <SegmentedControl.Button defaultSelected={selectedView === 'preview'}>Preview</SegmentedControl.Button>
        <SegmentedControl.Button defaultSelected={selectedView === 'code'}>Code</SegmentedControl.Button>
      </SegmentedControl>

      {!hasIssues && (
        <Blankslate border>
          <Blankslate.Visual>
            <IssueOpenedIcon size="medium" />
          </Blankslate.Visual>
          <Blankslate.Heading>This repository has no issues</Blankslate.Heading>
          <Blankslate.Description>
            Use issues to track ideas, discuss enhancements, and file bugs for this repository.
          </Blankslate.Description>
          <Blankslate.PrimaryAction onClick={() => onCreateIssue?.()}>Create the first issue</Blankslate.PrimaryAction>
        </Blankslate>
      )}
    </Stack>
  )
}
