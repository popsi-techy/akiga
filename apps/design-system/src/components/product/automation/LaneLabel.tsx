'use client';

import * as React from 'react';
import { FlowStem } from '@ds/components/FlowCanvas/FlowStem';
import type { ConditionGroup } from '@/data/automation-types';
import { isConditionGroupValid } from '@/lib/policy-tree';
import { attributeLabel } from '@/data/attributes';
import { ConditionPreviewLabel } from '@/components/product/ConditionPreviewChip';
import { isPolicyOperand, policyRuleParts } from '@/data/policy-conditions';
import { flattenRules, ruleParts } from './condition-format';

export type LaneTone = 'success' | 'danger' | 'warning' | 'neutral' | 'info';

const TONE_CLASS: Record<LaneTone, string> = {
  success: 'border border-[var(--ds-color-status-success-border)] bg-[var(--ds-color-status-success-subtle)] text-[var(--ds-color-status-success-fg)]',
  danger: 'border border-[var(--ds-color-status-danger-border)] bg-[var(--ds-color-status-danger-subtle)] text-[var(--ds-color-status-danger-fg)]',
  warning: 'border border-[var(--ds-color-status-warning-border)] bg-[var(--ds-color-status-warning-subtle)] text-[var(--ds-color-status-warning-fg)]',
  neutral: 'border border-border bg-surface text-text-secondary',
  info: 'border border-[var(--ds-color-status-info-border)] bg-[var(--ds-color-status-info-subtle)] text-[var(--ds-color-status-info-fg)]',
};

/** Outcome-branch labels → semantic tone (Approved green, Rejected red, exceptions amber). */
export const OUTCOME_TONE: Record<string, LaneTone> = {
  Approved: 'success',
  Rejected: 'danger',
  'SLA Breached': 'warning',
  'Approver Not Found': 'warning',
  'Fallback SLA Breached': 'warning',
};

/** Interactive affordance for a clickable lane chip — a subtle lift on hover and a
    focus ring, applied to the pill itself so lane spacing is unaffected. */
const INTERACTIVE_LANE = 'cursor-pointer transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle';
/** Shared attributes turning a lane chip into a button that selects its parent node.
    Stops propagation so the canvas viewport's clear-selection handler doesn't fire. */
function laneOpenProps(onOpen?: () => void): { attrs: Record<string, unknown>; className: string } {
  if (!onOpen) return { attrs: {}, className: '' };
  return {
    attrs: {
      role: 'button',
      tabIndex: 0,
      title: 'Open configuration',
      onClick: (e: React.MouseEvent) => { e.stopPropagation(); onOpen(); },
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onOpen(); }
      },
    },
    className: INTERACTIVE_LANE,
  };
}

const PILL =
  'mb-0 inline-flex w-max max-w-[280px] min-w-0 items-center gap-1.5 rounded-pill border border-border bg-surface px-2 py-1 text-caption text-text-secondary';

/** A branch-lane heading pill on the canvas. Outcome lanes use `upper` + a tone.
    Pass `onOpen` to make the chip select its parent node on click. */
export function LaneLabel({ text, tone = 'neutral', upper = false, onOpen }: { text: string; tone?: LaneTone; upper?: boolean; onOpen?: () => void }) {
  const typ = upper ? 'text-caption-strong uppercase tracking-wide' : 'text-caption-strong';
  const ip = laneOpenProps(onOpen);
  return <div {...ip.attrs} className={['mb-0 inline-flex w-max max-w-[280px] truncate rounded-pill px-3 py-1', typ, TONE_CLASS[tone], ip.className].join(' ')}>{text}</div>;
}

/** Canvas lane label for a condition branch: an IF/ELSE-IF badge, the first rule
    in plain text, and a "+N" badge when more rules exist. */
export function ConditionLaneLabel({ label, group, onOpen }: { label: string; group?: ConditionGroup; onOpen?: () => void }) {
  const rules = group ? flattenRules(group) : [];
  const valid = group ? isConditionGroupValid(group) : false;
  const ip = laneOpenProps(onOpen);
  return (
    <div {...ip.attrs} className={[PILL, ip.className].join(' ')}>
      <span className="shrink-0 rounded-pill bg-[var(--ds-color-status-info-subtle)] px-2 py-0.5 text-micro uppercase tracking-wide text-[var(--ds-color-status-info-fg)]">{label}</span>
      {valid ? (
        <>
          <ConditionPreviewLabel
            {...(isPolicyOperand(rules[0].attribute) ? policyRuleParts(rules[0]) : ruleParts(rules[0]))}
          />
          {rules.length > 1 && (
            <span className="shrink-0 rounded bg-subtle px-1.5 py-0.5 text-caption-strong text-text-secondary">+{rules.length - 1}</span>
          )}
        </>
      ) : (
        <span className="text-text-tertiary">Not set</span>
      )}
    </div>
  );
}

/** Canvas lane label for a Multisplit branch: a branch-name badge, the first
    attribute = value match in plain text, and "+N" when more attributes match. */
export function SplitLaneLabel({ label, matchValues, onOpen }: { label: string; matchValues?: Record<string, string[]>; onOpen?: () => void }) {
  const matches = Object.entries(matchValues ?? {})
    .filter(([, vals]) => vals && vals.length > 0)
    .map(([attrId, vals]) => `${attributeLabel(attrId) || attrId} = ${vals.join(', ')}`);
  const ip = laneOpenProps(onOpen);
  return (
    <div {...ip.attrs} className={[PILL, ip.className].join(' ')}>
      <span className="max-w-[96px] shrink-0 truncate rounded-pill bg-[var(--ds-color-status-info-subtle)] px-2 py-0.5 text-caption-medium text-[var(--ds-color-status-info-fg)]">{label}</span>
      {matches.length ? (
        <>
          <span className="min-w-0 truncate text-text-primary">{matches[0]}</span>
          {matches.length > 1 && (
            <span className="shrink-0 rounded bg-subtle px-1.5 py-0.5 text-caption-strong text-text-secondary">+{matches.length - 1}</span>
          )}
        </>
      ) : (
        <span className="text-text-tertiary">Any value</span>
      )}
    </div>
  );
}

/** Canvas lane label for a Parallel approver lane: a branch-name badge (blue chip,
    like IF / ELSE-IF) followed by the approver in plain text. */
export function ParallelLaneLabel({ label, approver, onOpen }: { label: string; approver?: string; onOpen?: () => void }) {
  const ip = laneOpenProps(onOpen);
  return (
    <div {...ip.attrs} className={[PILL, ip.className].join(' ')}>
      <span className="max-w-[110px] shrink-0 truncate rounded-pill bg-[var(--ds-color-status-info-subtle)] px-2 py-0.5 text-caption-medium text-[var(--ds-color-status-info-fg)]">{label}</span>
      {approver ? (
        <span className="min-w-0 truncate text-text-primary">{approver}</span>
      ) : (
        <span className="text-text-tertiary">Not configured</span>
      )}
    </div>
  );
}

/** Tinted variants of the auto-resolve body pill — same status token families as
    TONE_CLASS, but with a dashed border to read as "automatic, nothing to configure". */
const BODY_TONE_CLASS: Record<LaneTone, string> = {
  success:
    'border-dashed border-[var(--ds-color-status-success-border)] bg-[var(--ds-color-status-success-subtle)] text-[var(--ds-color-status-success-fg)]',
  danger:
    'border-dashed border-[var(--ds-color-status-danger-border)] bg-[var(--ds-color-status-danger-subtle)] text-[var(--ds-color-status-danger-fg)]',
  warning:
    'border-dashed border-[var(--ds-color-status-warning-border)] bg-[var(--ds-color-status-warning-subtle)] text-[var(--ds-color-status-warning-fg)]',
  neutral: 'border-dashed border-border bg-subtle text-text-secondary',
  // Notify-style: white fill + solid blue outline
  info: 'border-solid border-[var(--ds-color-status-info-solid)] bg-surface text-[var(--ds-color-status-info-fg)]',
};

/** Body of a sealed (or intro) outcome lane that auto-resolves — e.g. SLA /
    Approver Not Found set to Auto Approve. Optional `detail` (email) sits
    above the resolution pill; optional `icon` leads the resolution label.
    Stems use `FlowStem` so the SVG overlay owns every stroke (ADR-0007). */
export function AutoResolveBody({
  resolution,
  detail,
  icon,
  tone = 'neutral',
  onOpen,
}: {
  resolution: string;
  detail?: string;
  icon?: React.ReactNode;
  tone?: LaneTone;
  onOpen?: () => void;
}) {
  const ip = laneOpenProps(onOpen);
  return (
    <div className="flex flex-col items-center">
      <FlowStem height={20} />
      {detail ? (
        <>
          <div
            {...ip.attrs}
            className={[
              'inline-flex w-max max-w-[280px] items-center rounded-pill border border-dashed border-border bg-surface px-3 py-1.5 text-caption-medium text-text-secondary',
              ip.className,
            ].join(' ')}
          >
            <span className="truncate">{detail}</span>
          </div>
          <FlowStem height={20} />
        </>
      ) : null}
      <div
        {...(detail ? {} : ip.attrs)}
        className={[
          'inline-flex w-max max-w-[280px] items-center gap-1.5 rounded-pill border px-3 py-1.5 text-caption-medium',
          BODY_TONE_CLASS[tone],
          detail ? '' : ip.className,
          detail && onOpen ? 'cursor-pointer' : '',
        ].join(' ')}
        {...(detail && onOpen
          ? {
              role: 'button',
              tabIndex: 0,
              title: 'Open configuration',
              onClick: (e: React.MouseEvent) => {
                e.stopPropagation();
                onOpen();
              },
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpen();
                }
              },
            }
          : {})}
      >
        {icon ? <span className="flex shrink-0 items-center">{icon}</span> : null}
        <span className="truncate">{resolution}</span>
      </div>
    </div>
  );
}

export default LaneLabel;
