'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import AddOutlined from '@mui/icons-material/AddOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import LinkOutlined from '@mui/icons-material/LinkOutlined';
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined';
import { Button, DataTable, Input, Menu, StatusChip, useToast, type Column } from '@ds/components';
import {
  describeOrganization,
  timelineById,
  type ReportV2,
} from '@/data/governance-analytics-v2';
import { COMPLIANCE_FRAMEWORKS } from '@/data/reports';
import { formatDate } from '@/lib/datetime';

/**
 * Custom reports — questions the registers do not answer.
 *
 * Creating is a flow, not a gallery on this tab. One button goes to Create report, where
 * you pick a template or start blank.
 */
export function CustomAnalyticsTab({ reports }: { reports: ReportV2[] | null }) {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = React.useState('');
  const live = COMPLIANCE_FRAMEWORKS.filter((f) => f.href);

  const q = query.trim().toLowerCase();
  const rows = (reports ?? []).filter(
    (r) => !q || r.name.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q),
  );

  const columns: Column<ReportV2>[] = [
    {
      id: 'name',
      header: 'Report',
      width: '34%',
      sortable: true,
      render: (r) => (
        <div className="min-w-0">
          <div className="truncate text-body-sm-medium text-text-primary" title={r.name}>
            {r.name}
          </div>
          {r.description && (
            <div className="truncate text-caption text-text-secondary" title={r.description}>
              {r.description}
            </div>
          )}
        </div>
      ),
    },
    { id: 'about', header: 'About', width: '20%', render: (r) => describeOrganization(r.organization) },
    {
      id: 'period',
      header: 'Period',
      width: '16%',
      render: (r) => (
        <span className="truncate" title={timelineById(r.timelineId)?.label}>
          {timelineById(r.timelineId)?.label ?? '—'}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      width: '12%',
      wrap: true,
      render: (r) => (
        <StatusChip intent={r.status === 'ready' ? 'success' : 'info'} label={r.status === 'ready' ? 'Ready' : 'Draft'} />
      ),
    },
    { id: 'updated', header: 'Updated', width: '12%', sortable: true, render: (r) => formatDate(r.updatedAt) },
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <Input
            aria-label="Search custom reports"
            placeholder="Search reports"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            startAdornment={<SearchOutlined sx={{ fontSize: 18 }} className="text-icon-subtle" />}
          />
        </div>
        <div className="ml-auto">
          <Button startIcon={<AddOutlined />} onClick={() => router.push('/iga/governance-analytics-v2/templates')}>
            Create report
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <DataTable
          fillHeight
          layout="fixed"
          columns={columns}
          rows={rows}
          loading={reports === null}
          onRowClick={(r) => router.push(`/iga/governance-analytics-v2/report/${r.id}`)}
          emptyTitle={q ? 'No reports match that search' : 'No custom reports yet'}
          emptyMessage={q ? 'Try a different name, or create a new report.' : 'Create one from a template, or build it from blank.'}
        />
      </div>
    </div>
  );
}
