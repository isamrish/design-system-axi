import {useState} from 'react'
import {ActionList, ActionMenu, Banner, IconButton, SegmentedControl, Stack, Text, ToggleSwitch} from '@primer/react'
import {Blankslate} from '@primer/react/experimental'
import {IssueOpenedIcon, KebabHorizontalIcon} from '@primer/octicons-react'

export type RepoSettingsPageProps = {
  /** Whether the repository currently has any open issues */
  hasIssues?: boolean
  /** Called when the user creates the first issue from the empty state */
  onCreateFirstIssue?: () => void
  /** Called when the user chooses "Rename" from the repository actions menu */
  onRename?: () => void
  /** Called when the user chooses "Archive" from the repository actions menu */
  onArchive?: () => void
  /** Called when the user chooses "Delete" from the repository actions menu */
  onDelete?: () => void
}

export function RepoSettingsPage({
  hasIssues = false,
  onCreateFirstIssue,
  onRename,
  onArchive,
  onDelete,
}: RepoSettingsPageProps) {
  const [showMaintenanceNotice, setShowMaintenanceNotice] = useState(true)
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true)
  const [selectedViewIndex, setSelectedViewIndex] = useState(0)

  return (
    <Stack direction="vertical" gap="normal" padding="spacious">
      {showMaintenanceNotice && (
        <Banner
          title="Scheduled maintenance tonight"
          description="This repository may be briefly unavailable while we perform scheduled maintenance tonight."
          onDismiss={() => setShowMaintenanceNotice(false)}
        />
      )}

      <Stack
        direction="horizontal"
        justify="space-between"
        align="center"
        style={{width: '100%'}}
      >
        <Text as="h1" style={{fontSize: 'var(--text-title-size-medium)', fontWeight: 'var(--base-text-weight-semibold)'}}>
          Repository settings
        </Text>
        <ActionMenu>
          <ActionMenu.Anchor>
            <IconButton icon={KebabHorizontalIcon} aria-label="Repository actions" />
          </ActionMenu.Anchor>
          <ActionMenu.Overlay width="small">
            <ActionList>
              <ActionList.Item onSelect={onRename}>Rename</ActionList.Item>
              <ActionList.Item onSelect={onArchive}>Archive</ActionList.Item>
              <ActionList.Divider />
              <ActionList.Item variant="danger" onSelect={onDelete}>
                Delete
              </ActionList.Item>
            </ActionList>
          </ActionMenu.Overlay>
        </ActionMenu>
      </Stack>

      <Stack direction="horizontal" justify="space-between" align="center" style={{width: '100%'}}>
        <div>
          <Text as="span" id="email-notifications-label" style={{display: 'block', fontWeight: 'var(--base-text-weight-semibold)'}}>
            Email notifications
          </Text>
          <Text as="span" id="email-notifications-caption" style={{display: 'block', color: 'var(--fgColor-muted)'}}>
            Receive email updates for activity on this repository
          </Text>
        </div>
        <ToggleSwitch
          checked={emailNotificationsEnabled}
          onChange={setEmailNotificationsEnabled}
          aria-labelledby="email-notifications-label"
          aria-describedby="email-notifications-caption"
        />
      </Stack>

      <SegmentedControl aria-label="View" onChange={setSelectedViewIndex}>
        <SegmentedControl.Button selected={selectedViewIndex === 0}>Preview</SegmentedControl.Button>
        <SegmentedControl.Button selected={selectedViewIndex === 1}>Code</SegmentedControl.Button>
      </SegmentedControl>

      {!hasIssues && (
        <Blankslate border>
          <Blankslate.Visual>
            <IssueOpenedIcon size="medium" />
          </Blankslate.Visual>
          <Blankslate.Heading>No issues yet</Blankslate.Heading>
          <Blankslate.Description>
            Use issues to track ideas, bugs, and feature requests for this repository.
          </Blankslate.Description>
          <Blankslate.PrimaryAction onClick={onCreateFirstIssue}>Create the first issue</Blankslate.PrimaryAction>
        </Blankslate>
      )}
    </Stack>
  )
}
