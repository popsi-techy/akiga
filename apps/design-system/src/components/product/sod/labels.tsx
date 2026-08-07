'use client';

import * as React from 'react';
import { AppIcon, StatusChip, type StatusIntent } from '@ds/components';
import type { Severity, ReviewStatus, ReviewerStatus, AccessType } from '@/data/sod-types';

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

export const STATUS_META: Record<ReviewStatus, { label: string; intent: Intent }> = {
  unassigned: { label: 'Unassigned', intent: 'neutral' },
  assigned: { label: 'Assigned', intent: 'info' },
  inProgress: { label: 'In Progress', intent: 'warning' },
  completed: { label: 'Completed', intent: 'success' },
  overdue: { label: 'Overdue', intent: 'danger' },
};
export function StatusPill({ status }: { status: ReviewStatus }) {
  const m = STATUS_META[status];
  return <StatusChip intent={m.intent} label={m.label} />;
}

export const REVIEWER_STATUS_META: Record<ReviewerStatus, { label: string; intent: Intent }> = {
  notStarted: { label: 'Not Started', intent: 'neutral' },
  inProgress: { label: 'In Progress', intent: 'warning' },
  completed: { label: 'Completed', intent: 'success' },
  revising: { label: 'Revising', intent: 'info' },
};
/** V3 list + workspace — open reviews read as Pending, not Not Started.
 *  `revising` is info (blue), so amending a submitted resolution reads as neither
 *  "still open" (warning) nor "done" (success). */
export const REVIEWER_STATUS_META_V3: Record<ReviewerStatus, { label: string; intent: Intent }> = {
  notStarted: { label: 'Pending', intent: 'warning' },
  inProgress: { label: 'In Progress', intent: 'warning' },
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
        'inline-flex shrink-0 items-center justify-center rounded-md text-caption font-semibold text-text-secondary',
        variant === 'surface' ? 'bg-surface' : 'bg-subtle',
      ].join(' ')}
      style={{ width: size, height: size }}
      title={app}
    >
      {app.charAt(0).toUpperCase()}
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
