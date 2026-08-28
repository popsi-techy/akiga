'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { Button, DirectoryListPage, StatusChip, type Column } from '@ds/components';

type DemoRow = { id: string; name: string; status: string };

const ROWS: DemoRow[] = [
  { id: '1', name: 'GitLab Testing Env', status: 'Active' },
  { id: '2', name: 'Bitbucket Production', status: 'Draft' },
  { id: '3', name: 'Okta Break-glass', status: 'Active' },
];

const COLUMNS: Column<DemoRow>[] = [
  { id: 'name', header: 'Name', sortable: true, value: (r) => r.name, render: (r) => <span className="text-body-sm-strong text-text-primary">{r.name}</span> },
  {
    id: 'status',
    header: 'Status',
    sortable: true,
    value: (r) => r.status,
    render: (r) => <StatusChip intent={r.status === 'Active' ? 'success' : 'warning'} label={r.status} />,
  },
];

export default function DirectoryListPageDocs() {
  const [opened, setOpened] = React.useState('None');

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Directory List Page"
        description="The catalog-list frame: title, search, optional filter, fill-height DataTable, row-click to open. Directory, Emergency Access, certifications, SoD policies and System Settings catalogs share this so the chrome cannot drift."
      />

      <Section
        title="Search, then the table"
        description="`hideTitle` is for System Settings, where the breadcrumb already names the screen. `hideFilter` keeps search when there is nothing to filter yet."
      >
        <Example label="catalog">
          <div className="h-[360px]">
            <DirectoryListPage<DemoRow>
              title="Emergency Access"
              description="Profiles that hand over access for a session, then take it back."
              searchPlaceholder="Search profiles"
              columns={COLUMNS}
              rows={ROWS}
              matches={(row, q) => row.name.toLowerCase().includes(q)}
              onOpen={(id) => setOpened(id)}
              emptyTitle="No profiles"
              emptyMessage="Create one to get started."
              hideFilter
              actions={<Button size="sm">Create</Button>}
            />
          </div>
          <p className="mt-3 text-body-sm text-text-secondary">Last opened: {opened}</p>
        </Example>
      </Section>

      <Section title="When to use">
        <DoDont
          dos={[
            'Any catalog of records with search and a row that opens a detail.',
            '`hideTitle` + `hideFilter` on a System Settings catalog.',
            'Pass `layout="fixed"` once every column has a width.',
          ]}
          donts={[
            'A Settings page. That is named settings with section saves, not a catalog.',
            'A second search field above this. The toolbar already has one.',
            'A Card around the table. The page is the frame.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { DirectoryListPage } from '@ds/components';`}</Code>
        </p>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'title / description', type: 'string', description: 'Page heading. Hidden visually when `hideTitle` is set (sr-only remains).' },
            { name: 'hideTitle / hideFilter', type: 'boolean', description: 'Settings catalogs: no h1, no Filter button.' },
            { name: 'searchPlaceholder', type: 'string', description: 'Search field copy.' },
            { name: 'columns / rows', type: 'Column[] / Row[]', description: 'Forwarded to DataTable. Row must have `id`.' },
            { name: 'matches', type: '(row, query) => boolean', description: 'Search predicate. Query is already trimmed and lowercased.' },
            { name: 'onOpen', type: '(id) => void', description: 'Row click.' },
            { name: 'emptyTitle / emptyMessage', type: 'string', description: 'DataTable empty state.' },
            { name: 'filterGroups / filterMatches', type: 'FilterGroup[] / (row, sel) => boolean', description: 'Optional FilterDrawer. Omit and Filter toasts “coming soon”.' },
            { name: 'actions / summary / downloadable', type: 'ReactNode / boolean', description: 'Toolbar primary, optional strip under the title, demo download.' },
          ]}
        />
      </Section>
    </>
  );
}
