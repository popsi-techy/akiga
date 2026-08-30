'use client';

import * as React from 'react';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import { Tooltip } from '@ds/components';
import { formatDateTime } from '@/lib/datetime';

/**
 * Provenance, not an action: a clock and a datetime. The tooltip names the
 * fact so a scan of the cell does not have to infer what the clock means.
 *
 * Same treatment on a list row and on an object header — the stamp the reader
 * scans in the table is the stamp they see when they open the row.
 */
export function LastModified({
  at,
  className = '',
}: {
  at: string;
  className?: string;
}) {
  const stamp = formatDateTime(at);
  const label = `Last modified ${stamp}`;

  return (
    <Tooltip title={label}>
      <span
        aria-label={label}
        className={`inline-flex max-w-full cursor-default items-center gap-1.5 text-caption text-text-tertiary ${className}`}
      >
        <ScheduleOutlined sx={{ fontSize: 16 }} className="shrink-0 text-icon-subtle" aria-hidden />
        <span className="min-w-0 truncate tabular-nums">{stamp}</span>
      </span>
    </Tooltip>
  );
}
