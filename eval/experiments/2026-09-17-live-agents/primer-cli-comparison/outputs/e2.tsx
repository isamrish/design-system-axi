import {useState} from 'react'
import {Banner} from '@primer/react'
import {PageHeader} from '@primer/react'
import {Button} from '@primer/react'
import {UnderlineNav} from '@primer/react'
import {Blankslate} from '@primer/react/experimental'
import {DataTable, Table} from '@primer/react/experimental'
import {StarIcon, RepoForkedIcon, GitPullRequestIcon, RocketIcon} from '@primer/octicons-react'

type NavSection = 'code' | 'issues' | 'pulls'

interface Deployment {
  id: string
  environment: string
  status: string
  date: string
}

const deployments: Deployment[] = [
  {id: '1', environment: 'production', status: 'Active', date: '2026-09-15'},
  {id: '2', environment: 'staging', status: 'Active', date: '2026-09-14'},
  {id: '3', environment: 'production', status: 'Failed', date: '2026-09-10'},
]

export function RepositoryPage() {
  const [showArchivedBanner, setShowArchivedBanner] = useState(true)
  const [activeSection, setActiveSection] = useState<NavSection>('code')
  const hasPullRequests = false

  return (
    <div>
      {showArchivedBanner ? (
        <Banner
          title="This repository has been archived by the owner"
          description="It is now read-only."
          variant="warning"
          onDismiss={() => setShowArchivedBanner(false)}
        />
      ) : null}

      <PageHeader role="banner" aria-label="Repository">
        <PageHeader.TitleArea>
          <PageHeader.Title>octo-widgets</PageHeader.Title>
        </PageHeader.TitleArea>
        <PageHeader.Description>A small widget toolkit for building internal dashboards.</PageHeader.Description>
        <PageHeader.Actions>
          <Button leadingVisual={StarIcon}>Star</Button>
          <Button leadingVisual={RepoForkedIcon}>Fork</Button>
        </PageHeader.Actions>
        <PageHeader.Navigation>
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
        </PageHeader.Navigation>
      </PageHeader>

      {activeSection === 'pulls' && !hasPullRequests ? (
        <Blankslate>
          <Blankslate.Visual>
            <GitPullRequestIcon size="medium" />
          </Blankslate.Visual>
          <Blankslate.Heading>No open pull requests</Blankslate.Heading>
          <Blankslate.Description>
            Use pull requests to propose changes and discuss them before merging.
          </Blankslate.Description>
          <Blankslate.PrimaryAction href="#">Create pull request</Blankslate.PrimaryAction>
        </Blankslate>
      ) : null}

      <Table.Container>
        <Table.Title as="h2" id="deployments">
          Recent deployments
        </Table.Title>
        <DataTable
          aria-labelledby="deployments"
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
                return (
                  <>
                    <RocketIcon /> {row.status}
                  </>
                )
              },
            },
            {
              header: 'Date',
              field: 'date',
            },
          ]}
        />
      </Table.Container>
    </div>
  )
}

export default RepositoryPage
