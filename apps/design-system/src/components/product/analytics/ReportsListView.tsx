'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { Avatar, Button, DataTable, Dialog, Input, Menu, Select, StatusChip, useToast, type Column } from '@ds/components';
import {
  SCOPE_TYPE_LABEL,
  deleteReport,
  duplicateReport,
  listReports,
  reportKindLabel,
  reportTypeLabel,
  type Report,
} from '@/data/governance-analytics';
import { formatDate } from '@/lib/datetime';

interface Row {
  id: string;
  name: string;
  kind: string;
  scope: string;
  lastGenerated: string;
  createdBy: string;
  ready: boolean;
}

const toRow = (r: Report): Row => ({
  id: r.id,
  name: r.name,
  kind: reportTypeLabel(r),
  // The value alone. "Department = Engineering" under a header that already says
  // Scope spends half the column restating the column.
  scope: r.scope.value || 'Not scoped',
  lastGenerated: r.lastGeneratedAt ? formatDate(r.lastGeneratedAt) : '—',
  createdBy: r.createdBy,
  ready: r.status === 'ready',
});

/**
 * The Governance Analytics landing page: a list of reports, never a dashboard.
 *
 * A generic dashboard here would answer questions nobody asked and bury the one
 * thing this feature is for — producing a specific, downloadable answer about a
 * specific part of the organisation. So the landing page is the management
 * surface, and every report is a record with a scope, a generation time and an
 * author, because those three are what make it evidence.
 */
export function ReportsListView() {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = React.useState<Report[] | null>(null);
  const [query, setQuery] = React.useState('');
  const [kind, setKind] = React.useState('all');
  const [confirmDelete, setConfirmDelete] = React.useState<Report | null>(null);

  // localStorage-backed, so read after mount — `null` keeps DataTable in its
  // skeleton rather than flashing an empty state the store would contradict.
  const reload = React.useCallback(() => setRows(listReports()), []);
  React.useEffect(reload, [reload]);

  // Same label the Type column shows — a filter offering "Department Governance
  // Overview" for a column reading "Department" is two names for one thing.
  const kinds = React.useMemo(() => [...new Set((rows ?? []).map(reportTypeLabel))].sort(), [rows]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows ?? [])
      .filter((r) => kind === 'all' || reportTypeLabel(r) === kind)
      .filter(
        (r) =>
          !q ||
          r.name.toLowerCase().includes(q) ||
          r.scope.value.toLowerCase().includes(q) ||
          reportKindLabel(r).toLowerCase().includes(q),
      );
  }, [rows, query, kind]);

  const open = (id: string) => router.push(`/iga/governance-analytics/report/${id}`);

  const columns: Column<Row>[] = [
    {
      id: 'name',
      header: 'Report',
      sortable: true,
      /**
       * The widest share, and plain text.
       *
       * It was a blue link, which was wrong twice. The row already opens the report
       * on click, so the link was a second control for the same action — and it put
       * the link colour on the one thing in the row the reader came to *read*. A
       * value is not a control (visual-language §5.1a): the name is what identifies
       * the row, and the row is the affordance.
       *
       * The second line — "6 sections · 4 plots · Identity Status = Active" — is
       * gone with it. Those facts are on the report's own header, where there is
       * room for them, and here they doubled the row height to restate what the
       * Type and Scope columns already say.
       */
      width: '34%',
      value: (r) => r.name,
      render: (r) => <span className="text-body-sm-strong text-text-primary">{r.name}</span>,
    },
    { id: 'kind', header: 'Type', sortable: true, width: '16%', value: (r) => r.kind },
    { id: 'scope', header: 'Scope', sortable: true, width: '18%', value: (r) => r.scope },
    // A formatted date is a known length, so it takes pixels rather than a share.
    { id: 'lastGenerated', header: 'Last generated', sortable: true, width: 120, value: (r) => r.lastGenerated },
    {
      id: 'createdBy',
      header: 'Created by',
      sortable: true,
      width: '20%',
      value: (r) => r.createdBy,
      // A person reads as a person. The avatar also gives the column a fixed
      // left edge, so a list of authors scans as a column rather than ragged text.
      render: (r) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={r.createdBy} size="sm" kind="person" />
          <span className="min-w-0 truncate text-body-sm text-text-primary">{r.createdBy}</span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      width: 96,
      // A chip has a border and a dot that sit on the edge of its own box, so it
      // opts out of the clipping the default truncation applies.
      wrap: true,
      value: (r) => (r.ready ? 'Ready' : 'Draft'),
      // Dot plus label, never colour alone.
      render: (r) =>
        r.ready ? <StatusChip intent="success" label="Ready" /> : <StatusChip intent="neutral" label="Draft" />,
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      width: 72,
      render: (r) => (
        <Menu
          items={[
            { label: 'View', onClick: () => open(r.id) },
            // Edit differs from View only in landing with the panel open, which is
            // the whole point: "edit" means "change the definition", and the
            // definition lives in the panel.
            { label: 'Edit', onClick: () => router.push(`/iga/governance-analytics/report/${r.id}?configure=1`) },
            {
              label: 'Duplicate',
              onClick: () => {
                const copy = duplicateReport(r.id);
                reload();
                toast.success(copy ? `“${copy.name}” created` : 'Could not duplicate that report');
              },
            },
            {
              label: 'Download',
              onClick: () => toast.info('Export is mocked in this prototype.'),
            },
            {
              label: 'Delete',
              danger: true,
              onClick: () => setConfirmDelete((rows ?? []).find((x) => x.id === r.id) ?? null),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 flex shrink-0 flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h2 text-text-primary">Governance Analytics</h1>
          <p className="mt-1 max-w-2xl text-body-sm text-text-secondary">
            Generate evidence-backed reports on identities, access, applications, policies, ownership, and
            risk.
          </p>
        </div>
        <Button startIcon={<AddIcon />} onClick={() => router.push('/iga/governance-analytics/create')}>
          Create report
        </Button>
      </div>

      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <Input
            placeholder="Search reports"
            aria-label="Search reports"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
          />
        </div>
        <div className="w-56">
          <Select
            aria-label="Filter by report type"
            value={kind}
            onChange={setKind}
            options={[{ value: 'all', label: 'All report types' }, ...kinds.map((k) => ({ value: k, label: k }))]}
          />
        </div>
        {rows && (
          <span className="text-caption tabular-nums text-text-tertiary">
            {filtered.length} of {rows.length} reports
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1">
        <DataTable<Row>
          columns={columns}
          rows={filtered.map(toRow)}
          loading={rows === null}
          // Every column declares its share, so the table never overflows and every
          // row is one height — see the `layout` prop for what auto layout does to
          // a row carrying a report name and a scope in the same breath.
          layout="fixed"
          fillHeight
          onRowClick={(r) => open(r.id)}
          emptyTitle={query || kind !== 'all' ? 'No reports match' : 'No reports yet'}
          emptyMessage={
            query || kind !== 'all'
              ? 'Nothing here matches that search. Clear it to see every report.'
              : 'Create a report to capture the governance posture of a department, application, policy or team.'
          }
        />
      </div>

      <Dialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Delete this report?"
        confirmLabel="Delete report"
        tone="danger"
        onConfirm={() => {
          if (!confirmDelete) return;
          deleteReport(confirmDelete.id);
          toast.success(`“${confirmDelete.name}” deleted`);
          setConfirmDelete(null);
          reload();
        }}
      >
        <p className="text-body-sm text-text-secondary">
          “{confirmDelete?.name}” and its configuration will be removed. The governance data it read is
          untouched.
        </p>
      </Dialog>
    </div>
  );
}
