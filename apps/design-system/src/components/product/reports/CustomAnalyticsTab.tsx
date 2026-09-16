'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import AddOutlined from '@mui/icons-material/AddOutlined';
import LinkOutlined from '@mui/icons-material/LinkOutlined';
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined';
import { Button, DataTable, Menu, StatusChip, useToast, type Column } from '@ds/components';
import {
  describeOrganization,
  timelineById,
  type ReportV2,
} from '@/data/governance-analytics-v2';
import { COMPLIANCE_FRAMEWORKS } from '@/data/reports';
import { formatDate } from '@/lib/datetime';

/**
 * Governance Analytics, folded into the hub as its Custom Analytics tab.
 *
 * It reads `governance-analytics-v2` rather than copying it. The module already owns
 * templates, the builder and the saved reports; what it never had was a reason to sit
 * beside Reports in the sidebar as though it were a second reporting product. Here it is
 * the third answer to one question: the registers are fixed, the packages are fixed and
 * dated, and this is where you ask something nobody pre-built.
 *
 * **The tab is the list, and creating is a flow.** Templates are not laid out here — one
 * button goes to Create report, and that step is where you choose a template or start
 * blank, with the gallery, the search and the preview it already has. Putting a second,
 * flatter copy of the gallery on this tab would have given the same choice two shapes, and
 * whichever one you used the other would be the stale one.
 *
 * Positioned as an operational tool first: JML drift, licence reclamation and orphan sweeps
 * are what people build here week to week. The audit use — mapping a finished report into a
 * compliance package — rides on the report row rather than leading the page, because it is
 * a claim about *this* report answering *that* clause and has to start from a row that
 * names one.
 *
 * The rows come from the hub rather than from a read of the store here: the rail counts
 * this section, and a count that reads the store separately from the table under it is one
 * render away from disagreeing with it. `null` is "not loaded yet", which keeps the table
 * in its skeleton rather than flashing an empty state the store is about to contradict.
 */
export function CustomAnalyticsTab({ reports }: { reports: ReportV2[] | null }) {
  const router = useRouter();
  const toast = useToast();

  const live = COMPLIANCE_FRAMEWORKS.filter((f) => f.href);

  const columns: Column<ReportV2>[] = [
    {
      id: 'name',
      header: 'Report',
      width: '34%',
      sortable: true,
      render: (r) => (
        <div className="min-w-0">
          <div className="truncate text-body-sm-medium text-text-primary">{r.name}</div>
          {r.description && <div className="truncate text-caption text-text-secondary">{r.description}</div>}
        </div>
      ),
    },
    { id: 'about', header: 'About', width: '20%', render: (r) => describeOrganization(r.organization) },
    { id: 'period', header: 'Period', width: '14%', render: (r) => timelineById(r.timelineId)?.label ?? '—' },
    {
      id: 'status',
      header: 'Status',
      width: '11%',
      wrap: true,
      render: (r) => (
        <StatusChip intent={r.status === 'ready' ? 'success' : 'info'} label={r.status === 'ready' ? 'Ready' : 'Draft'} />
      ),
    },
    { id: 'updated', header: 'Updated', width: '14%', sortable: true, render: (r) => formatDate(r.updatedAt) },
    {
      id: 'actions',
      header: '',
      width: 56,
      align: 'right',
      wrap: true,
      render: (r) => (
        <Menu
          ariaLabel={`Actions for ${r.name}`}
          items={[
            {
              label: 'Open',
              icon: <OpenInNewOutlined sx={{ fontSize: 18 }} />,
              onClick: () => router.push(`/iga/governance-analytics-v2/report/${r.id}`),
            },
            {
              label: 'Map to compliance package',
              icon: <LinkOutlined sx={{ fontSize: 18 }} />,
              onClick: () =>
                toast.success(
                  live.length === 1
                    ? `“${r.name}” queued to map into ${live[0].name}.`
                    : `“${r.name}” queued for mapping.`,
                ),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* No heading: the rail already names this section, and a title repeated three
          inches to the right of itself is the kind of chrome that makes a page feel
          filled in rather than designed. The sentence stays — it says what belongs here,
          which the label cannot. */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="max-w-3xl text-body-sm text-text-secondary">
            For the questions the registers do not answer — JML drift, licence reclamation, orphan sweeps. Start from a
            template or build one from blank.
          </p>
        </div>
        <Button startIcon={<AddOutlined />} onClick={() => router.push('/iga/governance-analytics-v2/templates')}>
          Create report
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={reports ?? []}
        loading={reports === null}
        onRowClick={(r) => router.push(`/iga/governance-analytics-v2/report/${r.id}`)}
        emptyTitle="No custom reports yet"
        emptyMessage="Create one from a template, or build it from blank."
      />
    </div>
  );
}
