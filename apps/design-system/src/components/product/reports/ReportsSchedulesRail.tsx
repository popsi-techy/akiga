'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import EventRepeat from '@mui/icons-material/EventRepeat';
import { Button, Card } from '@ds/components';
import { REPORT_SCHEDULES, nextScheduledRun, type ReportSchedule } from '@/data/reports';
import { formatDateTime } from '@/lib/datetime';
import { ReportStateChip } from './ReportStateChip';
import { ScheduleDrawer } from './ScheduleDrawer';

/**
 * The machine beside the catalogue — next run first, then the rest.
 *
 * Schedules are not a fourth report type. They produce packages. Sitting in a
 * narrow column next to the catalogue keeps that hierarchy: the left is what you
 * open, the right is what will fire without being asked. The full table stays at
 * `/iga/reports/schedules` for anyone who needs to edit cadences in bulk.
 */
export function ReportsSchedulesRail() {
  const router = useRouter();
  const next = nextScheduledRun();
  const rest = REPORT_SCHEDULES.filter((s) => s.id !== next?.id).slice().sort((a, b) =>
    a.nextRunAt.localeCompare(b.nextRunAt),
  );
  const [drawer, setDrawer] = React.useState<ReportSchedule | null>(null);

  return (
    <>
      <Card
        title="Schedules"
        icon={<EventRepeat />}
        padding="none"
        className="min-h-0 lg:h-full"
        action={
          <Button variant="tertiary" size="sm" onClick={() => router.push('/iga/reports/schedules')}>
            View all
          </Button>
        }
      >
        <div className="ds-scroll h-full min-h-0 overflow-y-auto py-2">
          {REPORT_SCHEDULES.length === 0 ? (
            <p className="px-1 py-6 text-center text-body-sm text-text-secondary">
              Nothing is scheduled. Every package would have to be sealed by hand.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {next && (
                <ScheduleRow
                  schedule={next}
                  featured
                  onOpen={() => setDrawer(next)}
                />
              )}
              {rest.map((s) => (
                <ScheduleRow key={s.id} schedule={s} onOpen={() => setDrawer(s)} />
              ))}
            </div>
          )}
        </div>
      </Card>

      <ScheduleDrawer open={Boolean(drawer)} schedule={drawer} onClose={() => setDrawer(null)} />
    </>
  );
}

function ScheduleRow({
  schedule,
  featured,
  onOpen,
}: {
  schedule: ReportSchedule;
  featured?: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={[
        'w-full rounded-lg px-3 py-2.5 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
        featured
          ? 'bg-subtle hover:bg-surface-hover'
          : 'hover:bg-subtle',
      ].join(' ')}
    >
      {featured && (
        <p className="mb-1 text-overline uppercase text-text-tertiary">Next run</p>
      )}
      <span className="block truncate text-body-sm-medium text-text-primary">{schedule.name}</span>
      <span className="mt-0.5 block truncate text-caption text-text-secondary">
        {schedule.cadence}
        {' · '}
        {formatDateTime(schedule.nextRunAt)}
      </span>
      <span className="mt-2 flex flex-wrap items-center gap-1.5">
        <ReportStateChip state={schedule.enabled ? 'enabled' : 'paused'} />
        {featured && <ReportStateChip state={schedule.lastRunState} />}
      </span>
    </button>
  );
}
