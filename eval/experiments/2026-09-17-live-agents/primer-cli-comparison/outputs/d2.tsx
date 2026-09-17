import React from 'react'
import {
  Banner,
  Button,
  PageHeader,
  UnderlineNav,
  Label,
  type LabelColorOptions,
} from '@primer/react'
import { Blankslate, DataTable, Table, type Column } from '@primer/react/experimental'
import { StarIcon, RepoForkedIcon } from '@primer/octicons-react'

interface Deployment {
  id: string
  environment: string
  status: string
  date: string
}

const deployments: Deployment[] = [
  { id: '1', environment: 'Production', status: 'Active', date: '2026-09-15' },
  { id: '2', environment: 'Staging', status: 'Failed', date: '2026-09-14' },
  { id: '3', environment: 'Development', status: 'In progress', date: '2026-09-16' },
]

const statusColors: Record<string, LabelColorOptions> = {
  Active: 'success',
  Failed: 'danger',
  'In progress': 'attention',
}

const deploymentColumns: Array<Column<Deployment>> = [
  {
    header: 'Environment',
    field: 'environment',
    rowHeader: true,
  },
  {
    header: 'Status',
    field: 'status',
    renderCell: (row) => <Label variant={statusColors[row.status] ?? 'default'}>{row.status}</Label>,
  },
  {
    header: 'Date',
    field: 'date',
  },
]

const hasPullRequests = false

export function RepositoryPage() {
  const [showArchivedBanner, setShowArchivedBanner] = React.useState(true)

  return (
    <div>
      {showArchivedBanner ? (
        <Banner
          title="This repository has been archived"
          description="It is now read-only and cannot accept new issues, pull requests, or pushes."
          variant="warning"
          onDismiss={() => setShowArchivedBanner(false)}
        />
      ) : null}

      <PageHeader role="banner" aria-label="Repository">
        <PageHeader.TitleArea>
          <PageHeader.Title>octo-widgets</PageHeader.Title>
        </PageHeader.TitleArea>
        <PageHeader.Description>A small library of reusable widgets for internal tools.</PageHeader.Description>
        <PageHeader.Actions>
          <Button leadingVisual={StarIcon}>Star</Button>
          <Button leadingVisual={RepoForkedIcon}>Fork</Button>
        </PageHeader.Actions>
        <PageHeader.Navigation>
          <UnderlineNav aria-label="Repository">
            <UnderlineNav.Item href="#code" aria-current="page">
              Code
            </UnderlineNav.Item>
            <UnderlineNav.Item href="#issues">Issues</UnderlineNav.Item>
            <UnderlineNav.Item href="#pull-requests">Pull requests</UnderlineNav.Item>
          </UnderlineNav>
        </PageHeader.Navigation>
      </PageHeader>

      {!hasPullRequests ? (
        <Blankslate>
          <Blankslate.Heading>No pull requests yet</Blankslate.Heading>
          <Blankslate.Description>
            Use pull requests to propose changes and get feedback before merging.
          </Blankslate.Description>
          <Blankslate.PrimaryAction>Create pull request</Blankslate.PrimaryAction>
        </Blankslate>
      ) : null}

      <Table.Container>
        <Table.Title as="h2" id="deployments">
          Recent deployments
        </Table.Title>
        <DataTable aria-labelledby="deployments" data={deployments} columns={deploymentColumns} />
      </Table.Container>
    </div>
  )
}

export default RepositoryPage
