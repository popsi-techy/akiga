'use client';

import * as React from 'react';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { Tooltip } from '@ds/components';

/**
 * How close a draft is to being switchable on, sized to sit beside the button
 * that does it.
 *
 * A segmented donut rather than a `Meter` or the page-scale `DonutChart`: a Meter
 * is a continuous proportion, and a chart is a composition with a legend. These
 * are a small countable set of discrete steps — four bites with gaps read as
 * "four things, three of them done", where a 75%-filled bar reads as a
 * measurement and invites "75% of what?".
 *
 * Counts only what actually gates activation. Sitting next to a disabled button,
 * an indicator that included the optional steps could read 4 of 5 while the
 * button stayed dead, and the reader would have no way to reconcile the two.
 *
 * The donut leads the remaining count. The ring is how far along; the words say
 * what is still in the way. An info icon names the unfinished steps on hover —
 * the same list the Activate button already uses — so the footer does not have
 * to compete with the tab strip for those names.
 */
export function SetupProgress({
  done,
  total,
  /**
   * Names of unfinished required steps, in the reader's words. When passed, an
   * info icon lists them on hover. Omit it when there is no room for the icon
   * (the compact V2 header on small screens still works without it).
   */
  pendingDetails,
  /**
   * Which edge the count hangs off. `'end'` for the header it was built for,
   * where it sits against the action group; `'start'` in a left-hand column.
   */
  align = 'end',
  layout: _layout = 'stack',
  className = '',
}: {
  done: number;
  total: number;
  pendingDetails?: string[];
  align?: 'start' | 'end';
  /**
   * Kept for callers. Both layouts put the donut in front of the count —
   * `inline` is the docked footer, `stack` the header.
   */
  layout?: 'stack' | 'inline';
  /** Replaces the default `hidden sm:flex` when the count must always show. */
  className?: string;
}) {
  const pending = Math.max(0, total - done);
  const copy = pendingCopy(pending);

  return (
    <div
      className={[
        className || 'hidden sm:flex',
        'flex-row items-center gap-2',
        align === 'end' ? 'justify-end' : 'justify-start',
      ].join(' ')}
      role="group"
      aria-label={copy}
    >
      {/* aria-hidden: the label already says the number. */}
      <SegmentedDonut done={done} total={total} />
      <span className="whitespace-nowrap text-overline tabular-nums text-text-tertiary">
        {copy}
      </span>
      {pendingDetails && <PendingTip pending={pendingDetails} />}
    </div>
  );
}

function pendingCopy(pending: number): string {
  if (pending === 0) return 'All required steps complete';
  if (pending === 1) return '1 required step pending';
  return `${pending} required steps pending`;
}

function prettyStep(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function PendingTip({ pending }: { pending: string[] }) {
  const title =
    pending.length === 0 ? (
      'All required steps are done. You can activate this profile.'
    ) : (
      <div className="w-[220px] px-3 py-2.5 text-left">
        <p className="text-overline text-text-tertiary">Still needed</p>
        <ul className="mt-1.5 space-y-1">
          {pending.map((step) => (
            <li key={step} className="text-body-sm text-text-primary">
              {prettyStep(step)}
            </li>
          ))}
        </ul>
      </div>
    );

  return (
    <Tooltip
      variant={pending.length === 0 ? 'label' : 'card'}
      placement="top"
      title={title}
    >
      <span
        tabIndex={0}
        aria-label={
          pending.length === 0
            ? 'All required steps are done'
            : `Still needed: ${pending.join(' and ')}`
        }
        className="inline-grid shrink-0 cursor-help place-items-center rounded-full text-icon-subtle transition-colors hover:text-icon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
      >
        <InfoOutlined sx={{ fontSize: 14 }} />
      </span>
    </Tooltip>
  );
}

/**
 * Equal bites around the ring, with a gap so they stay countable. Green from
 * the first completed step — the same success fill the checklist tick uses —
 * so the header keeps one orange (Activate) and a done step is a done step.
 */
function SegmentedDonut({ done, total, size = 18, thickness = 3 }: { done: number; total: number; size?: number; thickness?: number }) {
  const safeTotal = Math.max(1, total);
  const complete = Math.max(0, Math.min(done, safeTotal));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const slot = c / safeTotal;
  const gap = Math.min(slot * 0.2, 3.5);
  const len = Math.max(slot - gap, 1);
  const mid = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
      aria-hidden
      focusable="false"
    >
      {Array.from({ length: safeTotal }, (_, i) => (
        <circle
          key={i}
          cx={mid}
          cy={mid}
          r={r}
          fill="none"
          stroke={
            i < complete
              ? 'var(--ds-color-status-success-fill)'
              : 'var(--ds-color-border-default)'
          }
          strokeWidth={thickness}
          strokeDasharray={`${len} ${c - len}`}
          strokeDashoffset={-i * slot}
          transform={`rotate(-90 ${mid} ${mid})`}
        />
      ))}
    </svg>
  );
}

export default SetupProgress;
