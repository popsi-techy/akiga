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
 * The cadences that produce sealed packages without anyone asking — its own page.
 *
 * It used to be the hub's fourth tab, filed beside the registers, the packages and the
 * custom reports as though it were a fourth kind of report. It is not one: those three are
 * things a reader *gets*, and this is the machine that produces the second of them. A
 * mechanism listed among its own output is what made that tab row read as a filing
 * cabinet, and it cost the hub a quarter of its most valuable row.
 *
 * Nothing is buried by the move. The hub's Next download tile names the next firing and
 * links here, every live framework card says its cadence, and this is a page you open to
 * *change* a cadence — administration, done occasionally, by one person.
 *
 * Two states per row, and they are not the same state: **Last run** is what happened, and
 * a skipped or failed firing is the reason someone opens this page; **State** is whether it
 * will fire again. A single column would have to pick one, and the pair is the whole story
 * — "enabled, last run skipped" is a live subscription that quietly produced nothing.
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-h2 text-text-primary">Schedules</h1>
          <p className="mt-1 max-w-3xl text-body text-text-secondary">
            A subscription seals a package on a cadence and mails a download link. The period is stored as a rule
            rather than as dates, so the same subscription produces the right window every time it fires.
          </p>
        </div>
        <Button startIcon={<AddOutlined />} onClick={() => setDrawer({ open: true, schedule: null })}>
          New subscription
        </Button>
      </div>

      {/*
        The next firing, above the table it comes from.

        The hub carries the same date in a tile, and that is not a duplicate: there it is
        the answer to "is anything coming", with a link to here; here the row that produces
        it is directly underneath, and the sentence is doing the job a summary should —
        telling you which of these rows matters next.
      */}
      {next ? (
        <p className="rounded-lg border border-border bg-subtle px-4 py-3 text-body-sm text-text-secondary">
          Next run <span className="font-emphasis text-text-primary">{formatDateTime(next.nextRunAt)}</span>{' '}
          {next.timezone} — {next.name}, covering the {next.covers.toLowerCase()}.
        </p>
      ) : (
        /* Nothing enabled is a finding, not an empty state: every package would have to be
           sealed by hand, by someone who remembered to. */
        <p className="rounded-lg border border-border bg-subtle px-4 py-3 text-body-sm text-text-secondary">
          <span className="font-emphasis text-text-primary">Nothing is scheduled.</span> Every package would have to
          be sealed by hand.
        </p>
      )}

      <DataTable
        columns={columns}
        rows={REPORT_SCHEDULES}
        onRowClick={(s) => setDrawer({ open: true, schedule: s })}
        emptyTitle="No subscriptions yet"
        emptyMessage="Create one to have a sealed package produced and mailed on a cadence."
      />

      <ScheduleDrawer
        open={drawer.open}
        schedule={drawer.schedule}
        onClose={() => setDrawer({ open: false, schedule: null })}
      />
    </div>
  );
}
