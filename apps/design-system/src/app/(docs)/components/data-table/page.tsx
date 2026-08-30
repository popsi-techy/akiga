'use client';

import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { PageHeader, Section, PropsTable, DoDont, Code, Card } from '@/components/docs/primitives';
import { DataTable, StatusChip, Button, Avatar, type Column, type StatusIntent } from '@ds/components';

type EmergencyAccess = {
  id: string;
  name: string;
  initial: string;
  status: { intent: StatusIntent; label: string };
  risk: { intent: StatusIntent; label: string } | null;
  activeUsers: number | null;
};

const DATA: EmergencyAccess[] = [
  { id: '1', name: 'Bitbucket Production Env', initial: 'B', status: { intent: 'warning', label: 'Draft' }, risk: null, activeUsers: null },
  { id: '2', name: 'GitHub Staging Env', initial: 'G', status: { intent: 'success', label: 'Active' }, risk: { intent: 'danger', label: 'Critical (94)' }, activeUsers: 48 },
  { id: '3', name: 'Docker Localhost Setup', initial: 'D', status: { intent: 'warning', label: 'Draft' }, risk: null, activeUsers: null },
  { id: '4', name: 'Azure Dev Environment', initial: 'A', status: { intent: 'success', label: 'Active' }, risk: { intent: 'danger', label: 'Critical (94)' }, activeUsers: 60 },
  { id: '5', name: 'GitLab Testing Env', initial: 'G', status: { intent: 'success', label: 'Active' }, risk: { intent: 'danger', label: 'Critical (94)' }, activeUsers: 36 },
  { id: '6', name: 'AWS QA Environment', initial: 'A', status: { intent: 'success', label: 'Active' }, risk: { intent: 'caution', label: 'High (68)' }, activeUsers: 24 },
  { id: '7', name: 'Salesforce Prod', initial: 'S', status: { intent: 'success', label: 'Active' }, risk: { intent: 'info', label: 'Low (12)' }, activeUsers: 12 },
  { id: '8', name: 'Figma Workspace', initial: 'F', status: { intent: 'neutral', label: 'Inactive' }, risk: null, activeUsers: null },
];

function AvatarCell({ initial, name }: { initial: string; name: string }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} initials={initial} size="sm" />
      <span className="text-body-sm-strong text-text-primary">{name}</span>
    </div>
  );
}

const columns: Column<EmergencyAccess>[] = [
  {
    id: 'name',
    header: 'Emergency Access',
    sortable: true,
    value: (r) => r.name,
    render: (r) => <AvatarCell initial={r.initial} name={r.name} />,
  },
  {
    id: 'status',
    header: 'Status',
    sortable: true,
    value: (r) => r.status.label,
    render: (r) => <StatusChip intent={r.status.intent} label={r.status.label} />,
  },
  {
    id: 'risk',
    header: 'Risk Score',
    render: (r) =>
      r.risk ? (
        <StatusChip intent={r.risk.intent} dot={false} label={r.risk.label} />
      ) : (
        <span className="text-text-disabled">N/A</span>
      ),
  },
  {
    id: 'activeUsers',
    header: 'Active Users',
    align: 'left',
    sortable: true,
    value: (r) => r.activeUsers ?? -1,
    render: (r) => (r.activeUsers == null ? <span className="text-text-disabled">N/A</span> : r.activeUsers),
  },
  {
    id: 'actions',
    header: 'Actions',
    align: 'right',
    width: 80,
    render: () => (
      <IconButton size="small" aria-label="Row actions" onClick={(e) => e.stopPropagation()}>
        <MoreVertIcon sx={{ fontSize: 18, color: 'var(--ds-color-icon-default)' }} />
      </IconButton>
    ),
  },
];

export default function DataTableDocs() {
  const [mode, setMode] = React.useState<'data' | 'loading' | 'empty'>('data');
  const [selectedCount, setSelectedCount] = React.useState(0);

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Data Table"
        description="The product's workhorse list — sortable columns, row selection with bulk actions, pagination, and built-in loading and empty states. Cell rendering is delegated, so status chips, risk badges, avatars, and row actions compose in cleanly."
      />

      <Section
        title="Interactive example"
        description="A real Emergency Access list. Sort columns, select rows, and toggle states."
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button size="sm" variant={mode === 'data' ? 'primary' : 'secondary'} onClick={() => setMode('data')}>
            With data
          </Button>
          <Button size="sm" variant={mode === 'loading' ? 'primary' : 'secondary'} onClick={() => setMode('loading')}>
            Loading
          </Button>
          <Button size="sm" variant={mode === 'empty' ? 'primary' : 'secondary'} onClick={() => setMode('empty')}>
            Empty
          </Button>
        </div>

        <DataTable<EmergencyAccess>
          columns={columns}
          rows={mode === 'empty' ? [] : DATA}
          loading={mode === 'loading'}
          selectable
          onSelectionChange={(ids) => setSelectedCount(ids.length)}
          selectionToolbar={
            selectedCount > 0 ? (
              <p className="text-body-sm text-text-secondary">
                {selectedCount} selected.{' '}
                <span className="text-body-sm-strong text-text-link">Clear selection</span>
              </p>
            ) : null
          }
          emptyTitle="No emergency access yet"
          emptyMessage="Create emergency access to grant time-bound, break-glass access to critical systems."
        />
      </Section>

      <Section title="States" description="Every list must ship the full matrix. This component handles them for you.">
        <div className="grid gap-3 sm:grid-cols-3 text-body-sm">
          {[
            ['Loading', 'Skeleton rows matching the column layout.'],
            ['Empty', 'A designed empty state with title, guidance, and an optional centered action.'],
            ['Populated', 'Sort, select, paginate, custom cells.'],
          ].map(([t, d]) => (
            <Card key={t} className="p-4">
              <div className="text-body-sm-strong text-text-primary">{t}</div>
              <p className="mt-1 text-text-secondary">{d}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'layout', type: "'auto' | 'fixed'", default: "'auto'", description: 'Column sizing. Prefer `fixed`: it stops the overflow auto layout causes, truncates cells to one line with the full text on hover, and keeps every row the same height. `auto` is the default only for compatibility with tables that have not declared widths.' },
            { name: 'columns', type: 'Column<Row>[]', description: 'Column defs: id, header, sortable, align, width, render, value.' },
            { name: 'rows', type: 'Row[]', description: 'Data (each row needs a unique id).' },
            { name: 'selectable', type: 'boolean', default: 'false', description: 'Row checkboxes + select-all.' },
            { name: 'loading', type: 'boolean', default: 'false', description: 'Renders skeleton rows.' },
            { name: 'emptyTitle / emptyMessage', type: 'string', description: 'Empty-state copy.' },
            { name: 'emptyAction', type: 'ReactNode', description: 'Centered under the empty copy — the one action that fills the table. Hide the matching toolbar button while the table is empty so it is not in two places.' },
            { name: 'defaultRowsPerPage', type: 'number', default: '10', description: 'Initial page size.' },
            { name: 'onRowClick', type: '(row) => void', description: 'Row click (e.g. open detail).' },
            { name: 'selectionToolbar', type: 'ReactNode', description: 'First-row selection banner while rows are selected (select-all matching, clear). Icon-only bulk actions sit on the page toolbar, to the right of Filter.' },
          ]}
        />
      </Section>

      <Section title="Column definition">
        <div className="rounded-lg border border-border bg-sunken p-4 font-mono text-caption leading-6 text-text-primary">
          <div>{`const columns: Column<EmergencyAccess>[] = [`}</div>
          <div>{`  { id: 'status', header: 'Status', sortable: true,`}</div>
          <div>{`    value: r => r.status.label,`}</div>
          <div>{`    render: r => <StatusChip intent={r.status.intent} label={r.status.label} /> },`}</div>
          <div>{`  // …`}</div>
          <div>{`];`}</div>
        </div>
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Prefer layout="fixed" for a new list, and declare a width on every column. Auto layout lets one long value widen the table past its container and makes truncation impossible.',
            'Give the identity column the largest share. Under fixed layout a column that does not ask for a width gets the same as the status column beside it.',
            'Use IdentityCell for a person or an account — s (28px) avatar, email under the name. Set Column.wrap on that column. Do not add a dedicated Email column.',
            'Use Column.wrap for a two-line cell or anything that paints outside its box — a chip’s border, an avatar’s ring — which the default clipping would shave.',
            'Provide value() for custom-rendered sortable columns.',
            'Pass selectionToolbar for the first-row selection banner (select-all matching, clear). Put icon-only bulk actions on the page toolbar, to the right of Filter.',
            'Keep column sets stable across the product.',
            'Always pass meaningful empty-state copy.',
          ]}
          donts={[
            'Don’t add nowrap to a cell under auto layout hoping for an ellipsis. The minimum width becomes the whole string and the overflow gets worse, not better.',
            'Don’t let a cell restate its own header. “Department = Engineering” under a column headed Scope spends half the column on the word the header already said — and that half is what survives truncation.',
            'Don’t build one-off tables — extend this via columns.',
            'Don’t render 10k rows unpaginated.',
            'Don’t put primary actions inside every row — use the ⋮ menu.',
            'Don’t hide column headers to make room for bulk actions. Selection is an action mode — the map of the data has to stay.',
            'Don’t put labelled bulk buttons in the first row. That row is for selection extent — this page versus the whole set.',
            'Don’t hardcode colors in cells — compose DS components.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          Built on <Code>@mui/material/Table</Code> primitives. This is the single table pattern for
          the product — approvals, certifications, identities, and applications all use it.
        </p>
      </Section>
    </>
  );
}
