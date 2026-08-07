'use client';

import * as React from 'react';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { Meter, StatusChip, Tooltip } from '@ds/components';
import { getAccess } from '@/data/sod';
import type { SodRule } from '@/data/sod-types';
import { formatDateTime } from './labels';

/**
 * Shared building blocks for the SoD Resolution workspaces (V3 / V4), so the two
 * versions stop copy-pasting the same helpers. All UI here is built on the design
 * system (StatusChip, Meter, Tooltip) rather than hand-rolled markup.
 */

/** Whole calendar days between two ISO dates (negative when `to` is before `from`). */
export function daySpan(fromIso: string, toIso: string): number {
  const a = new Date(fromIso);
  const b = new Date(toIso);
  const aDay = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const bDay = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.round((bDay - aDay) / 86_400_000);
}

/** Access names of an access combination joined with " + " — e.g. "Journal Post + Payment Release". */
export function ruleAccessText(rule: SodRule): string {
  return rule.accessIds
    .map((id) => getAccess(id)?.name)
    .filter(Boolean)
    .join(' + ');
}

/** Per–access-combination status pill via the canonical DS StatusChip.
 *  Pending = warning · Will resolve / Resolved = success ·
 *  Will accept (staged) / Risk accepted (committed) = danger. */
export type RuleUiStatus = 'pending' | 'will-resolve' | 'will-accept' | 'risk-accepted' | 'resolved';
export function RuleStatusPill({ status }: { status: RuleUiStatus }) {
  if (status === 'pending') return <StatusChip intent="warning" label="Pending" />;
  if (status === 'will-accept') return <StatusChip intent="danger" label="Will accept" />;
  if (status === 'risk-accepted') return <StatusChip intent="danger" label="Risk accepted" />;
  return <StatusChip intent="success" label={status === 'resolved' ? 'Resolved' : 'Will resolve'} />;
}

/** Right-aligned topbar meter: "N Days Remaining" + info tooltip + remaining-time
    bar (DS Meter). Green fill = remaining share of the assignment window. */
export function DueCountdown({
  dueDate,
  assignedAt,
  className,
}: {
  dueDate?: string;
  assignedAt?: string;
  /** Override width/layout — default stays compact for toolbars. */
  className?: string;
}) {
  if (!dueDate) return null;
  const days = daySpan(new Date().toISOString(), dueDate);
  const overdue = days < 0;
  const label =
    days === 0
      ? 'Due Today'
      : overdue
        ? `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`
        : `${days} Day${days === 1 ? '' : 's'} Remaining`;

  const windowDays = assignedAt ? Math.max(1, daySpan(assignedAt, dueDate)) : Math.max(days, 14);
  const remainingPct = overdue ? 0 : Math.max(0, Math.min(100, (days / windowDays) * 100));
  const tone = overdue ? 'danger' : days <= 3 ? 'warning' : 'success';
  const dueLabel = `Due ${formatDateTime(dueDate)}`;

  return (
    <div className={['flex flex-col gap-1.5', className ?? 'w-[180px] shrink-0'].join(' ')}>
      <div className="flex items-center justify-between gap-2">
        <span className={['text-body-sm font-medium', overdue ? 'text-[var(--ds-color-status-danger-fg)]' : 'text-text-primary'].join(' ')}>
          {label}
        </span>
        <Tooltip title={dueLabel} placement="bottom">
          <span
            tabIndex={0}
            role="img"
            aria-label={dueLabel}
            className="grid h-4 w-4 shrink-0 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
          >
            <InfoOutlined sx={{ fontSize: 16, color: 'var(--ds-color-status-info-fg)' }} />
          </span>
        </Tooltip>
      </div>
      <Meter value={remainingPct} max={100} tone={tone} size="sm" />
    </div>
  );
}
