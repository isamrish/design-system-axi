import {useState} from 'react'
import {
  Banner,
  PageHeader,
  Button,
  ButtonGroup,
  UnderlineNav,
  Label,
  Heading,
  Text,
} from '@primer/react'
import {Blankslate, DataTable, createColumnHelper} from '@primer/react/experimental'

type Deployment = {
  id: number
  environment: string
  status: 'Active' | 'Inactive' | 'Failed'
  date: string
}

const deployments: Deployment[] = [
  {id: 1, environment: 'Production', status: 'Active', date: '2026-09-14'},
  {id: 2, environment: 'Staging', status: 'Active', date: '2026-09-12'},
  {id: 3, environment: 'Development', status: 'Failed', date: '2026-09-10'},
]

const statusColor: Record<Deployment['status'], 'success' | 'attention' | 'danger'> = {
  Active: 'success',
  Inactive: 'attention',
  Failed: 'danger',
}

const columnHelper = createColumnHelper<Deployment>()
const columns = [
  columnHelper.column({
    id: 'environment',
    header: 'Environment',
    field: 'environment',
  }),
  columnHelper.column({
    id: 'status',
    header: 'Status',
    renderCell: (row) => <Label variant={statusColor[row.status]}>{row.status}</Label>,
  }),
  columnHelper.column({
    id: 'date',
    header: 'Date',
    field: 'date',
  }),
]

type Section = 'code' | 'issues' | 'pulls'

export function RepositoryPage() {
  const [archivedNoticeVisible, setArchivedNoticeVisible] = useState(true)
  const [activeSection, setActiveSection] = useState<Section>('code')

  const pullRequests: Array<{id: number; title: string}> = []

  return (
    <div>
      {archivedNoticeVisible && (
        <Banner
          title="This repository has been archived"
          description="It is now read-only. You can still browse the code, but issues and pull requests are closed to new activity."
          variant="warning"
          onDismiss={() => setArchivedNoticeVisible(false)}
        />
      )}

      <PageHeader role="banner">
        <PageHeader.TitleArea>
          <PageHeader.Title>octo-org/ds-axi-demo</PageHeader.Title>
        </PageHeader.TitleArea>
        <PageHeader.Description>
          <Text>A demo repository used to showcase the design system.</Text>
        </PageHeader.Description>
        <PageHeader.Actions>
          <ButtonGroup>
            <Button>Star</Button>
            <Button>Fork</Button>
          </ButtonGroup>
        </PageHeader.Actions>
      </PageHeader>

      <UnderlineNav aria-label="Repository">
        <UnderlineNav.Item
          aria-current={activeSection === 'code' ? 'page' : undefined}
          onSelect={(event) => {
            event.preventDefault()
            setActiveSection('code')
          }}
        >
          Code
        </UnderlineNav.Item>
        <UnderlineNav.Item
          aria-current={activeSection === 'issues' ? 'page' : undefined}
          onSelect={(event) => {
            event.preventDefault()
            setActiveSection('issues')
          }}
        >
          Issues
        </UnderlineNav.Item>
        <UnderlineNav.Item
          aria-current={activeSection === 'pulls' ? 'page' : undefined}
          onSelect={(event) => {
            event.preventDefault()
            setActiveSection('pulls')
          }}
        >
          Pull requests
        </UnderlineNav.Item>
      </UnderlineNav>

      {pullRequests.length === 0 && (
        <Blankslate>
          <Blankslate.Heading>No open pull requests</Blankslate.Heading>
          <Blankslate.Description>
            Pull requests help you collaborate on code. Open one to propose changes to this repository.
          </Blankslate.Description>
          <Blankslate.PrimaryAction>New pull request</Blankslate.PrimaryAction>
        </Blankslate>
      )}

      <Heading as="h2" variant="medium">
        Recent deployments
      </Heading>
      <DataTable data={deployments} columns={columns} />
    </div>
  )
}
