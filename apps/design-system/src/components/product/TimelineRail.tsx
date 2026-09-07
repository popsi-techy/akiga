'use client';

import * as React from 'react';

/**
 * The tone of a timeline node — the same status families the chips use, so a stage
 * marked Done and its node agree without either side choosing a colour.
 */
export type TimelineTone = 'success' | 'info' | 'warning' | 'danger' | 'caution' | 'neutral';

/**
 * The vertical connector between nodes: a 6px dash with a 2px gap.
 *
 * Dashed rather than solid because the line joins events that are separate in time, not
 * a continuous quantity — and it is drawn in two pieces, above and below the node, so it
 * never runs under the icon.
 */
function TimelineDash({ className }: { className: string }) {
  return (
    <div
      aria-hidden
      className={['absolute left-1/2 w-px -translate-x-1/2', className].join(' ')}
      style={{
        backgroundImage:
          'repeating-linear-gradient(to bottom, var(--ds-color-border-default) 0, var(--ds-color-border-default) 6px, transparent 6px, transparent 8px)',
      }}
    />
  );
}

/**
 * One row of a vertical timeline: a tinted node with an icon, its connectors, and
 * whatever the caller wants beside it.
 *
 * ## Why this is shared
 *
 * The SoD review timeline and the request lifecycle are the same object — a column of
 * dated events, each with a state — and were drawn twice, in two files, with two sets of
 * hand-written class names. This owns the rail; each feature owns what sits beside it.
 * The bodies genuinely differ (a decision card, a stage with its approval hops), so the
 * shared part stops at the node and the line.
 *
 * `ring-4 ring-surface` is what lets the dash pass behind the node without touching it:
 * the ring paints the page's own background as a halo, so no gap has to be measured.
 */
export function TimelineItem({
  icon,
  tone,
  first = false,
  last = false,
  children,
}: {
  icon: React.ReactNode;
  tone: TimelineTone;
  /** No connector above the first node, none below the last. */
  first?: boolean;
  last?: boolean;
  children: React.ReactNode;
}) {
  const neutral = tone === 'neutral';
  return (
    <li className="relative flex gap-3.5">
      <div className="relative flex w-9 shrink-0 justify-center self-stretch">
        {!first && <TimelineDash className="top-0 h-9" />}
        {!last && <TimelineDash className="bottom-0 top-9" />}
        <span
          className="relative z-[1] grid h-9 w-9 shrink-0 place-items-center rounded-full border ring-4 ring-surface"
          style={{
            // A node nobody has reached yet is drawn on the surface rather than tinted:
            // a "waiting" stage should not carry as much colour as one that happened.
            backgroundColor: neutral
              ? 'var(--ds-color-surface-default)'
              : `var(--ds-color-status-${tone}-subtle)`,
            borderColor: neutral
              ? 'var(--ds-color-border-default)'
              : `var(--ds-color-status-${tone}-border)`,
            color: neutral ? 'var(--ds-color-text-tertiary)' : `var(--ds-color-status-${tone}-fg)`,
          }}
          aria-hidden
        >
          {icon}
        </span>
      </div>
      <div className={['min-w-0 flex-1', last ? 'pb-0' : 'pb-4'].join(' ')}>{children}</div>
    </li>
  );
}

export default TimelineItem;
