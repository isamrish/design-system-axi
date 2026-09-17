import {useState} from 'react'
import {Banner, PageHeader, Button, UnderlineNav, Label, RelativeTime} from '@primer/react'
import {Blankslate, DataTable, Table} from '@primer/react/experimental'
import {StarIcon, RepoForkedIcon, CodeIcon, IssueOpenedIcon, GitPullRequestIcon} from '@primer/octicons-react'

type NavSection = 'code' | 'issues' | 'pulls'

type DeploymentStatus = 'success' | 'failed' | 'in_progress'

interface Deployment {
  id: string
  environment: string
  status: DeploymentStatus
  deployedAt: string
}

const deployments: Deployment[] = [
  {id: '1', environment: 'production', status: 'success', deployedAt: '2026-09-15T18:32:00Z'},
  {id: '2', environment: 'staging', status: 'success', deployedAt: '2026-09-14T21:05:00Z'},
  {id: '3', environment: 'production', status: 'failed', deployedAt: '2026-09-12T09:47:00Z'},
  {id: '4', environment: 'preview', status: 'in_progress', deployedAt: '2026-09-11T16:20:00Z'},
]

const statusLabel: Record<DeploymentStatus, {text: string; variant: 'success' | 'danger' | 'attention'}> = {
  success: {text: 'Active', variant: 'success'},
  failed: {text: 'Failed', variant: 'danger'},
  in_progress: {text: 'In progress', variant: 'attention'},
}

const pullRequests: Array<{id: string}> = []

export function RepositoryPage() {
  const [showArchivedBanner, setShowArchivedBanner] = useState(true)
  const [activeSection, setActiveSection] = useState<NavSection>('code')

  return (
    <div>
      {showArchivedBanner ? (
        <Banner
          title="This repository has been archived"
          description="The owner has marked this repository as archived. It is now read-only."
          variant="warning"
          onDismiss={() => setShowArchivedBanner(false)}
        />
      ) : null}

      <PageHeader role="banner" aria-label="Repository">
        <PageHeader.TitleArea>
          <PageHeader.Title>octo-widgets</PageHeader.Title>
        </PageHeader.TitleArea>
        <PageHeader.Description>A small library of reusable widgets for the Octo platform.</PageHeader.Description>
        <PageHeader.Actions>
          <Button leadingVisual={StarIcon}>Star</Button>
          <Button leadingVisual={RepoForkedIcon}>Fork</Button>
        </PageHeader.Actions>
        <PageHeader.Navigation>
          <UnderlineNav aria-label="Repository">
            <UnderlineNav.Item
              icon={CodeIcon}
              aria-current={activeSection === 'code' ? 'page' : undefined}
              onSelect={(event) => {
                event.preventDefault()
                setActiveSection('code')
              }}
            >
              Code
            </UnderlineNav.Item>
            <UnderlineNav.Item
              icon={IssueOpenedIcon}
              aria-current={activeSection === 'issues' ? 'page' : undefined}
              onSelect={(event) => {
                event.preventDefault()
                setActiveSection('issues')
              }}
            >
              Issues
            </UnderlineNav.Item>
            <UnderlineNav.Item
              icon={GitPullRequestIcon}
              counter={pullRequests.length}
              aria-current={activeSection === 'pulls' ? 'page' : undefined}
              onSelect={(event) => {
                event.preventDefault()
                setActiveSection('pulls')
              }}
            >
              Pull requests
            </UnderlineNav.Item>
          </UnderlineNav>
        </PageHeader.Navigation>
      </PageHeader>

      {activeSection === 'pulls' && pullRequests.length === 0 ? (
        <Blankslate>
          <Blankslate.Heading>This repository has no open pull requests</Blankslate.Heading>
          <Blankslate.Description>
            Pull requests help you collaborate on code. Open one to propose and discuss changes.
          </Blankslate.Description>
          <Blankslate.PrimaryAction onClick={() => alert('Create a new pull request')}>
            New pull request
          </Blankslate.PrimaryAction>
        </Blankslate>
      ) : null}

      {activeSection === 'code' ? (
        <Table.Container>
          <Table.Title as="h2" id="deployments">
            Recent deployments
          </Table.Title>
          <Table.Subtitle as="p" id="deployments-subtitle">
            The latest deployments for this repository.
          </Table.Subtitle>
          <DataTable
            aria-labelledby="deployments"
            aria-describedby="deployments-subtitle"
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
                renderCell: (row) => {
                  const {text, variant} = statusLabel[row.status]
                  return <Label variant={variant}>{text}</Label>
                },
              },
              {
                header: 'Date',
                field: 'deployedAt',
                renderCell: (row) => <RelativeTime date={new Date(row.deployedAt)} />,
              },
            ]}
          />
        </Table.Container>
      ) : null}
    </div>
  )
}

export default RepositoryPage
