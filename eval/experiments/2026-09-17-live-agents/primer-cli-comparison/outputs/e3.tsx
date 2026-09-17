import { useState } from "react";
import { Banner, Button, Label, PageHeader, UnderlineNav } from "@primer/react";
import { Blankslate, DataTable } from "@primer/react/experimental";
import { GitPullRequestIcon, RepoForkedIcon, StarIcon } from "@primer/octicons-react";

type Section = "code" | "issues" | "pull-requests";

interface Deployment {
  id: string;
  environment: string;
  status: "Active" | "Failed" | "In progress";
  date: string;
}

const deployments: Deployment[] = [
  { id: "1", environment: "production", status: "Active", date: "2 hours ago" },
  { id: "2", environment: "staging", status: "In progress", date: "5 hours ago" },
  { id: "3", environment: "production", status: "Failed", date: "1 day ago" },
];

function statusVariant(status: Deployment["status"]) {
  switch (status) {
    case "Active":
      return "success" as const;
    case "Failed":
      return "danger" as const;
    case "In progress":
      return "attention" as const;
  }
}

export function RepositoryPage() {
  const [showArchivedBanner, setShowArchivedBanner] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>("code");

  return (
    <div>
      {showArchivedBanner ? (
        <Banner
          title="This repository has been archived"
          description="It is now read-only. Issues, pull requests, and pushes are disabled."
          variant="warning"
          onDismiss={() => setShowArchivedBanner(false)}
        />
      ) : null}

      <PageHeader role="banner" aria-label="Repository">
        <PageHeader.TitleArea>
          <PageHeader.Title>octocat/hello-world</PageHeader.Title>
        </PageHeader.TitleArea>
        <PageHeader.Description>
          A friendly greeting library used across our example applications.
        </PageHeader.Description>
        <PageHeader.Actions>
          <Button leadingVisual={StarIcon}>Star</Button>
          <Button leadingVisual={RepoForkedIcon}>Fork</Button>
        </PageHeader.Actions>
      </PageHeader>

      <UnderlineNav aria-label="Repository">
        <UnderlineNav.Item
          aria-current={activeSection === "code" ? "page" : undefined}
          onSelect={(event) => {
            event.preventDefault();
            setActiveSection("code");
          }}
        >
          Code
        </UnderlineNav.Item>
        <UnderlineNav.Item
          aria-current={activeSection === "issues" ? "page" : undefined}
          onSelect={(event) => {
            event.preventDefault();
            setActiveSection("issues");
          }}
        >
          Issues
        </UnderlineNav.Item>
        <UnderlineNav.Item
          aria-current={activeSection === "pull-requests" ? "page" : undefined}
          onSelect={(event) => {
            event.preventDefault();
            setActiveSection("pull-requests");
          }}
        >
          Pull requests
        </UnderlineNav.Item>
      </UnderlineNav>

      {activeSection === "code" ? (
        <DataTable
          aria-labelledby="deployments-heading"
          data={deployments}
          columns={[
            { header: "Environment", field: "environment" },
            {
              header: "Status",
              field: "status",
              renderCell: (row) => <Label variant={statusVariant(row.status)}>{row.status}</Label>,
            },
            { header: "Date", field: "date" },
          ]}
        />
      ) : null}

      {activeSection === "issues" ? <p>No open issues to show.</p> : null}

      {activeSection === "pull-requests" ? (
        <Blankslate>
          <Blankslate.Visual>
            <GitPullRequestIcon size="medium" />
          </Blankslate.Visual>
          <Blankslate.Heading>There aren&apos;t any open pull requests</Blankslate.Heading>
          <Blankslate.Description>
            Pull requests help you collaborate on code by proposing changes.
          </Blankslate.Description>
          <Blankslate.PrimaryAction onClick={() => setActiveSection("pull-requests")}>
            Create pull request
          </Blankslate.PrimaryAction>
        </Blankslate>
      ) : null}
    </div>
  );
}

export default RepositoryPage;
