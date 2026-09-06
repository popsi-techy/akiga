'use client';

import * as React from 'react';
import { formatSlaClock, slaStatusOf, type GovernanceRequest } from '@/data/request-governance';
import { SlaStatusChip } from './labels';

export function SlaTimer({ row }: { row: GovernanceRequest }) {
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const status = slaStatusOf(row);
  const clock = formatSlaClock(row);
  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <SlaStatusChip status={status} />
      <span
        className={[
          'tabular-nums text-caption',
          status === 'breached' ? 'text-[var(--ds-color-status-danger-fg)]' : 'text-text-secondary',
        ].join(' ')}
      >
        {clock}
      </span>
    </div>
  );
}
