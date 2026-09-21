'use client';

import * as React from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import PlayArrowOutlined from '@mui/icons-material/PlayArrowOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import PauseOutlined from '@mui/icons-material/PauseOutlined';
import { Button, DataTable, Menu, useToast, type Column } from '@ds/components';
import { REPORT_SCHEDULES, nextScheduledRun, type ReportSchedule } from '@/data/reports';
import { formatDateTime } from '@/lib/datetime';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import { ReportStateChip } from './ReportStateChip';
import { ScheduleDrawer } from './ScheduleDrawer';

/**
 * How sealed packages get produced without anyone asking — a page under Reports.
 *
 * Registers, packages and custom reports are the catalogue. This is the machine behind
 * the packages, so it is not a fourth tab. You open it to change a cadence, run one now,
 * or see why a live subscription skipped.
 *
 * Two states per row, and they are not the same state: **Last run** is what happened;
 * **State** is whether it will fire again. "Enabled, last run skipped" is a live
 * subscription that quietly produced nothing.
 */
export function SchedulesScreen() {
  const toast = useToast();
  const next = nextScheduledRun();
  const [drawer, setDrawer] = React.useState<{ open: boolean; schedule: ReportSchedule | null }>({
    open: false,
    schedule: null,
  });

  useSetBreadcrumbs([{ label: 'Reports', href: '/iga/reports' }, { label: 'Schedules' }]);

  const columns: Column<ReportSchedule>[] = [
    {
      id: 'name',
      header: 'Name',
      width: '21%',
      sortable: true,
      render: (s) => (
        <div className="min-w-0">
          <div className="truncate text-body-sm-medium text-text-primary">{s.name}</div>
          <div className="truncate text-caption text-text-secondary">{s.frameworkLabel}</div>
        </div>
      ),
    },
    { id: 'cadence', header: 'Cadence', width: '9%', sortable: true, render: (s) => s.cadence },
    { id: 'covers', header: 'Covers', width: '22%', render: (s) => s.covers },
    { id: 'timezone', header: 'Timezone', width: '14%', render: (s) => s.timezone },
    {
      id: 'lastRun',
      header: 'Last run',
      width: '17%',
      wrap: true,
      render: (s) => (
        <span className="flex flex-wrap items-center gap-2">
          <ReportStateChip state={s.lastRunState} />
          {s.lastRunAt && <span className="text-caption text-text-secondary">{formatDateTime(s.lastRunAt)}</span>}
        </span>
      ),
    },
    {
      id: 'state',
      header: 'State',
      width: '9%',
      wrap: true,
      render: (s) => <ReportStateChip state={s.enabled ? 'enabled' : 'paused'} />,
    },
    {
      id: 'actions',
      header: '',
      width: 56,
      align: 'right',
      wrap: true,
      render: (s) => (
        <Menu
          ariaLabel={`Actions for ${s.name}`}
          items={[
            {
              label: 'Run now',
              icon: <PlayArrowOutlined sx={{ fontSize: 18 }} />,
              onClick: () => toast.success(`${s.name} queued. The package appears under Package history.`),
            },
            {
              label: 'Edit',
              icon: <EditOutlined sx={{ fontSize: 18 }} />,
              onClick: () => setDrawer({ open: true, schedule: s }),
            },
            {
              label: s.enabled ? 'Pause' : 'Resume',
              icon: s.enabled ? <PauseOutlined sx={{ fontSize: 18 }} /> : <PlayArrowOutlined sx={{ fontSize: 18 }} />,
              onClick: () => toast.info(`${s.name} ${s.enabled ? 'paused' : 'resumed'}.`),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-h2 text-text-primary">Schedules</h1>
          <p className="mt-1 max-w-2xl text-body text-text-secondary">
            Subscriptions seal a package on a cadence and mail a download link. The period is a
            rule, so the same subscription produces the right window every time it fires.
          </p>
        </div>
        <Button startIcon={<AddOutlined />} onClick={() => setDrawer({ open: true, schedule: null })}>
          New subscription
        </Button>
      </div>

      {next ? (
        <p className="mb-4 shrink-0 rounded-lg border border-border bg-subtle px-4 py-3 text-body-sm text-text-secondary">
          Next run <span className="font-emphasis text-text-primary">{formatDateTime(next.nextRunAt)}</span>{' '}
          {next.timezone} — {next.name}, covering the {next.covers.toLowerCase()}.
        </p>
      ) : (
        <p className="mb-4 shrink-0 rounded-lg border border-border bg-subtle px-4 py-3 text-body-sm text-text-secondary">
          <span className="font-emphasis text-text-primary">Nothing is scheduled.</span> Every package would have to
          be sealed by hand.
        </p>
      )}

      <div className="min-h-0 flex-1">
        <DataTable
          fillHeight
          layout="fixed"
          columns={columns}
          rows={REPORT_SCHEDULES}
          onRowClick={(s) => setDrawer({ open: true, schedule: s })}
          emptyTitle="No subscriptions yet"
          emptyMessage="Create one to have a sealed package produced and mailed on a cadence."
        />
      </div>

      <ScheduleDrawer
        open={drawer.open}
        schedule={drawer.schedule}
        onClose={() => setDrawer({ open: false, schedule: null })}
      />
    </div>
  );
}
