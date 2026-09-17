import {useState} from 'react'
import {Banner, Button, Label, PageHeader, RelativeTime, Stack, Text, UnderlineNav} from '@primer/react'
import {Blankslate, DataTable, Table} from '@primer/react/experimental'
import type {LabelColorOptions} from '@primer/react'
import {CodeIcon, GitPullRequestIcon, IssueOpenedIcon, RepoForkedIcon, StarIcon} from '@primer/octicons-react'

type NavSection = 'code' | 'issues' | 'pulls'

interface Deployment {
  id: string
  environment: string
  status: 'Active' | 'Inactive' | 'Failed'
  date: string
}

const deployments: Deployment[] = [
  {id: '1', environment: 'production', status: 'Active', date: '2026-09-10T14:32:00Z'},
  {id: '2', environment: 'staging', status: 'Active', date: '2026-09-09T09:15:00Z'},
  {id: '3', environment: 'preview-482', status: 'Inactive', date: '2026-09-05T18:47:00Z'},
  {id: '4', environment: 'production', status: 'Failed', date: '2026-09-01T11:02:00Z'},
]

const statusLabelVariant: Record<Deployment['status'], LabelColorOptions> = {
  Active: 'success',
  Inactive: 'secondary',
  Failed: 'danger',
}

export function RepositoryPage() {
  const [showArchivedBanner, setShowArchivedBanner] = useState(true)
  const [activeSection, setActiveSection] = useState<NavSection>('pulls')

  // No pull requests exist for this archived repository.
  const pullRequests: Array<{id: string}> = []

  const handleSelectSection = (section: NavSection) => (event: {preventDefault: () => void}) => {
    event.preventDefault()
    setActiveSection(section)
  }

  return (
    <Stack direction="vertical" gap="none">
      {showArchivedBanner && (
        <Banner
          title="This repository has been archived by the owner."
          description="It is now read-only."
          variant="warning"
          onDismiss={() => setShowArchivedBanner(false)}
        />
      )}

      <Stack direction="vertical" gap="normal" padding="normal">
        <PageHeader role="banner" aria-label="Repository details">
          <PageHeader.TitleArea>
            <PageHeader.Title>octo-widgets</PageHeader.Title>
          </PageHeader.TitleArea>
          <PageHeader.Description>
            <Text>A collection of reusable UI widgets for internal tooling.</Text>
          </PageHeader.Description>
          <PageHeader.Actions>
            <Button leadingVisual={StarIcon}>Star</Button>
            <Button leadingVisual={RepoForkedIcon}>Fork</Button>
          </PageHeader.Actions>
        </PageHeader>

        <UnderlineNav aria-label="Repository">
          <UnderlineNav.Item
            href="#code"
            leadingVisual={<CodeIcon />}
            aria-current={activeSection === 'code' ? 'page' : undefined}
            onSelect={handleSelectSection('code')}
          >
            Code
          </UnderlineNav.Item>
          <UnderlineNav.Item
            href="#issues"
            leadingVisual={<IssueOpenedIcon />}
            aria-current={activeSection === 'issues' ? 'page' : undefined}
            onSelect={handleSelectSection('issues')}
          >
            Issues
          </UnderlineNav.Item>
          <UnderlineNav.Item
            href="#pulls"
            leadingVisual={<GitPullRequestIcon />}
            aria-current={activeSection === 'pulls' ? 'page' : undefined}
            onSelect={handleSelectSection('pulls')}
          >
            Pull requests
          </UnderlineNav.Item>
        </UnderlineNav>

        {activeSection === 'code' && <Text>Browse this repository's files and commit history.</Text>}
        {activeSection === 'issues' && <Text>Track bugs and feature requests for this repository.</Text>}
        {activeSection === 'pulls' && pullRequests.length === 0 && (
          <Blankslate>
            <Blankslate.Visual>
              <GitPullRequestIcon size="medium" />
            </Blankslate.Visual>
            <Blankslate.Heading>Nothing to see here</Blankslate.Heading>
            <Blankslate.Description>
              There aren't any open pull requests for this repository yet.
            </Blankslate.Description>
            <Blankslate.PrimaryAction onClick={() => setActiveSection('pulls')}>
              New pull request
            </Blankslate.PrimaryAction>
          </Blankslate>
        )}

        <Table.Container>
          <Table.Title as="h2" id="deployments-title">
            Recent deployments
          </Table.Title>
          <DataTable
            aria-labelledby="deployments-title"
            data={deployments}
            columns={[
              {
                header: 'Environment',
                field: 'environment',
                rowHeader: true,
              },
              {
                header: 'Status',
                field: 'status',
                renderCell: row => <Label variant={statusLabelVariant[row.status]}>{row.status}</Label>,
              },
              {
                header: 'Date',
                field: 'date',
                renderCell: row => <RelativeTime date={new Date(row.date)} />,
              },
            ]}
          />
        </Table.Container>
      </Stack>
    </Stack>
  )
}
