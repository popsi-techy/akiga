'use client';

import * as React from 'react';
import { AppIcon, StatusChip, type StatusIntent } from '@ds/components';
import type { Severity, ReviewerStatus, AccessType } from '@/data/sod-types';

/** The DS union rather than a local copy — a duplicate silently misses new intents
 *  (it had no `caution`, so severity could not reach the orange step). */
type Intent = StatusIntent;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const ACCESS_TYPE_LABEL: Record<AccessType, string> = {
  entitlement: 'Entitlement',
  technicalRole: 'Technical role',
  businessRole: 'Business role',
};
export const isRole = (t: AccessType) => t !== 'entitlement';
/** Same one-hue-per-level ramp as `RiskScoreChip` — blue → yellow → orange → red —
 *  so a policy's severity and an access's risk score read on one scale. */
const SEV_INTENT: Record<Severity, Intent> = {
  critical: 'danger', // red
  high: 'caution', // orange
  medium: 'warning', // yellow
  low: 'info', // blue
};

export function SeverityChip({ severity, score }: { severity: Severity; score?: number }) {
  return <StatusChip intent={SEV_INTENT[severity]} dot={false} label={score != null ? `${cap(severity)} (${score})` : cap(severity)} />;
}

export const REVIEWER_STATUS_META: Record<ReviewerStatus, { label: string; intent: Intent }> = {
  notStarted: { label: 'Not Started', intent: 'neutral' },
  inProgress: { label: 'In Progress', intent: 'warning' },
  completed: { label: 'Completed', intent: 'success' },
  revising: { label: 'Revising', intent: 'info' },
};
/**
 * V3 list + workspace — open reviews read as Pending, not Not Started.
 *
 * Three states, three hues: Pending amber (untouched, waiting on the reviewer),
 * In Progress blue (started — work in hand, nothing outstanding to prompt), Completed
 * green. In Progress was amber too, which made the two open states indistinguishable
 * at a glance in the Status column.
 *
 * `revising` keeps the same blue but nothing renders it — V3 reports only the three
 * states above, and a resolution being amended stays Completed.
 */
export const REVIEWER_STATUS_META_V3: Record<ReviewerStatus, { label: string; intent: Intent }> = {
  notStarted: { label: 'Pending', intent: 'warning' },
  inProgress: { label: 'In Progress', intent: 'info' },
  completed: { label: 'Completed', intent: 'success' },
  revising: { label: 'Revising', intent: 'info' },
};
export function ReviewerStatusPill({ status }: { status: ReviewerStatus }) {
  const m = REVIEWER_STATUS_META[status];
  return <StatusChip intent={m.intent} label={m.label} />;
}
export function ReviewerStatusPillV3({ status }: { status: ReviewerStatus }) {
  const m = REVIEWER_STATUS_META_V3[status];
  return <StatusChip intent={m.intent} label={m.label} />;
}

/** Access conflicts column — tab-aware count pill for the SoD Resolution list. */
export function AccessConflictPill({
  tab,
  pendingCount,
  acceptedRiskCount,
}: {
  tab: 'active' | 'acceptedRisk' | 'history';
  pendingCount: number;
  acceptedRiskCount: number;
}) {
  if (tab === 'acceptedRisk') {
    return (
      <StatusChip intent="danger" label={`${acceptedRiskCount} accepted risk`} />
    );
  }
  const n = tab === 'history' ? 0 : pendingCount;
  return <StatusChip intent={n === 0 ? 'success' : 'warning'} label={`${n} pending`} />;
}

/**
 * App mark, muted app name, emphasised access name — the SoD access pill.
 *
 * `children` is the trailing affordance (the info tip on SoD chips). Preview
 * and other summaries omit it. `danger` tints the names when that access is
 * staged for removal, same as the resolution chips.
 */
export function AccessChip({
  appName,
  name,
  danger = false,
  children,
}: {
  appName: string;
  name: string;
  danger?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-pill bg-subtle py-1 pl-1.5 pr-2 text-caption',
        danger ? 'text-[var(--ds-color-status-danger-fg)]' : '',
      ].join(' ')}
      title={`${appName} ${name}`}
    >
      <AppBadge app={appName} size={18} variant="surface" appearance="logo" />
      <span className={danger ? 'shrink-0' : 'shrink-0 text-text-tertiary'}>{appName}</span>
      <span className={['min-w-0 truncate font-emphasis', danger ? '' : 'text-text-primary'].join(' ')}>
        {name}
      </span>
      {children}
    </span>
  );
}

/** Compact app marker.
 *  - `appearance="initial"` (default) — letter tile for dense lists elsewhere.
 *  - `appearance="logo"` — Design System AppIcon with real brand marks when known.
 *  `variant` picks the tile fill: `subtle` on canvas/surface, or `surface` inside tinted chips. */
export function AppBadge({
  app,
  size = 22,
  variant = 'subtle',
  appearance = 'initial',
}: {
  app: string;
  size?: number;
  variant?: 'subtle' | 'surface';
  appearance?: 'initial' | 'logo';
}) {
  if (appearance === 'logo') {
    return <AppIcon app={app} size={size} variant={variant} />;
  }
  return (
    <span
      className={[
        'inline-flex shrink-0 items-center justify-center rounded-md text-caption-strong text-text-secondary',
        variant === 'surface' ? 'bg-surface' : 'bg-subtle',
      ].join(' ')}
      style={{ width: size, height: size }}
      title={app}
    >
      {app?.charAt(0).toUpperCase() || '?'}
    </span>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}
/**
 * Risk-acceptance expiry, e.g. "Nov 4, 2026, 9:30 AM".
 *
 * `AcceptedRisk.untilAt` is a local wall-clock `YYYY-MM-DDTHH:MM`, so this parses
 * the parts directly rather than going through `Date` — no timezone shift, and the
 * output matches exactly what the reviewer typed.
 */
export function formatUntil(untilAt?: string): string {
  if (!untilAt) return '—';
  const [date, time] = untilAt.split('T');
  const [y, m, d] = (date ?? '').split('-').map(Number);
  const [hhRaw, mm] = (time ?? '').split(':');
  if (!y || !m || !d || hhRaw === undefined) return '—';
  const hh = Number(hhRaw);
  const ampm = hh >= 12 ? 'PM' : 'AM';
  return `${MONTHS[m - 1]} ${d}, ${y}, ${hh % 12 || 12}:${mm ?? '00'} ${ampm}`;
}
/** Date + time, e.g. "Jul 26, 2026, 11:04 PM" (UTC, deterministic). */
export function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  let h = d.getUTCHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}, ${h}:${String(d.getUTCMinutes()).padStart(2, '0')} ${ampm}`;
}
