'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import { Avatar, Button, DataTable, Dialog, Menu, StatusChip, useToast, type Column } from '@ds/components';
import {
  deleteReportV2,
  describeOrganization,
  listReportsV2,
  timelineById,
  type ReportV2,
} from '@/data/governance-analytics-v2';
import { formatDate } from '@/lib/datetime';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';

/**
 * Governance Analytics V2 — the reports list.
 *
 * The landing page is the report-management surface rather than a dashboard, for the same
 * reason V1's is: a dashboard here answers questions nobody asked and buries the one thing
 * the feature is for, which is producing a specific answer about a specific part of the
 * organisation over a specific period.
 *
 * What V2 changes sits downstream of this page — how a report is configured — so the list
 * only swaps V1's Type/Scope pair for the two things that are now the report's whole
 * global definition: what part of the organisation, and which period.
 */
export default function GovernanceAnalyticsV2Page() {
  const router = useRouter();
  const toast = useToast();
  useSetBreadcrumbs([{ label: 'Governance Analytics V2' }]);

  // localStorage-backed, so read after mount — `null` keeps DataTable in its skeleton
  // rather than flashing an empty state the store would contradict.
  const [reports, setReports] = React.useState<ReportV2[] | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<ReportV2 | null>(null);
  const reload = React.useCallback(() => setReports(listReportsV2()), []);
  React.useEffect(reload, [reload]);

  const open = (id: string) => router.push(`/iga/governance-analytics-v2/report/${id}`);

  const columns: Column<ReportV2>[] = [
    {
      id: 'name',
      header: 'Report',
      sortable: true,
      width: '30%',
      value: (r) => r.name,
      // Plain text, not a link: the row already opens the report, and a value is not a
      // control (visual-language §5.1a).
      render: (r) => <span className="text-body-sm-strong text-text-primary">{r.name}</span>,
    },
    {
      id: 'organization',
      header: 'About',
      sortable: true,
      width: '22%',
      value: (r) => describeOrganization(r.organization),
    },
    {
      id: 'period',
      header: 'Period',
      sortable: true,
      width: '18%',
      value: (r) => timelineById(r.timelineId)?.label ?? '—',
    },
    // No section count: it is the least decision-relevant fact here — the report itself
    // shows its sections — and an eighth column costs every other one width it needs more.
    {
      id: 'createdBy',
      header: 'Created by',
      sortable: true,
      width: '18%',
      value: (r) => r.createdBy,
      render: (r) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={r.createdBy} size="s" kind="person" />
          <span className="min-w-0 truncate text-body-sm text-text-primary">{r.createdBy}</span>
        </div>
      ),
    },
    { id: 'updated', header: 'Updated', sortable: true, width: 110, value: (r) => formatDate(r.updatedAt) },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      width: 96,
      // A chip's border and dot paint on the edge of its own box, so it opts out of the
      // clipping the default truncation applies.
      wrap: true,
      value: (r) => (r.status === 'ready' ? 'Ready' : 'Draft'),
      render: (r) =>
        r.status === 'ready' ? (
          <StatusChip intent="success" label="Ready" />
        ) : (
          <StatusChip intent="neutral" label="Draft" />
        ),
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
            // Edit differs from View only in landing with the dock already open, which is
            // exactly what "edit" means here: change the definition, and the definition
            // lives in the dock.
            {
              label: 'Edit',
              onClick: () => router.push(`/iga/governance-analytics-v2/report/${r.id}?edit=1`),
            },
            { label: 'Delete', danger: true, onClick: () => setConfirmDelete(r) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 shrink-0">
        <h1 className="text-h2 text-text-primary">Governance Analytics V2</h1>
        <p className="mt-1 max-w-2xl text-body-sm text-text-secondary">
          A report is one part of the organisation over one period. Every section brings its own
          filters, so narrowing one table never quietly rewrites the rest of the document.
        </p>
      </div>

      <div className="mb-4 flex shrink-0 items-center">
        <div className="ml-auto">
          <Button
            startIcon={<AddIcon />}
            onClick={() => router.push('/iga/governance-analytics-v2/templates')}
          >
            Create report
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <DataTable<ReportV2>
          layout="fixed"
          columns={columns}
          rows={reports ?? []}
          loading={reports === null}
          fillHeight
          onRowClick={(r) => open(r.id)}
          emptyTitle="No reports yet"
          emptyMessage="Create a report to analyse a department, an application, a governance team, or the whole organisation."
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
          deleteReportV2(confirmDelete.id);
          toast.success(`“${confirmDelete.name}” deleted`);
          setConfirmDelete(null);
          reload();
        }}
      >
        <p className="text-body-sm text-text-secondary">
          “{confirmDelete?.name}” and its configuration will be removed. The governance data it reads is
          untouched.
        </p>
      </Dialog>
    </div>
  );
}
