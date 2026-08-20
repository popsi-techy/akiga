'use client';

import * as React from 'react';
import CheckCircle from '@mui/icons-material/CheckCircle';
import { StatusChip } from '@ds/components';

export interface DetailRailRow {
  /** Stable key. For a setup step this is the step id; otherwise the section value. */
  id: string;
  label: string;
  /** The section this row opens. Rows that open something else (a drawer) still need
   *  a value here that no section uses, so they never read as current. */
  tab: string;
  /** How many things are behind the row, when it holds a collection. */
  count?: number;
  /** Setup only: `undefined` means this row does not report completion at all. */
  done?: boolean;
  /** Setup only: why a step counts as done, when that is not obvious. */
  doneLabel?: string;
}

export interface DetailRailGroup {
  /** Omitted for a single ungrouped list. */
  heading?: string;
  /** Read out after the heading, for what the grouping conveys only visually. */
  headingHint?: string;
  rows: DetailRailRow[];
}

/**
 * The left rail of an emergency-access profile — its section navigation, and on a draft
 * its setup checklist as well.
 *
 * ## Why a rail and not a tab strip
 *
 * The strip and the rail were the same list. On a draft, once Overview and Sessions drop
 * out, the tabs were Assignments, Eligibility criteria, Owners and Advanced configuration
 * — exactly the rail's routable rows, in the same order, stacked directly above them. Two
 * controls for one set of destinations only makes the reader work out whether they differ.
 *
 * The rail is the one that survives because a vertical list has room the strip does not:
 * per-row completion, a grouping that separates what gates activation from what does not,
 * counts that do not compete with the label for horizontal space, and a row for Basic
 * details, which was never a tab at all. On a live profile none of that applies and it is
 * a plain section list — the same rail, in the same place, holding less.
 *
 * ## It is chrome, not a card
 *
 * No rounding, no floating, no margin: one border on the right, running from the header's
 * rule to the bottom of the viewport. That continuous line is what makes it read as part
 * of the frame. A card with corners and a gap would say "this is one more thing on the
 * page"; the rail says "this is the page".
 *
 * The fill is white, so the border is the only thing separating rail from content — a
 * quiet frame, because the rail is where the reader looks *between* tasks. The current
 * row is a white fill with a brand outline: it says "you are here" without a tint that
 * competes with the page. Hover stays a quiet surface change, so it reads as "reachable"
 * rather than "here".
 *
 * ## Required and optional are groups, not asterisks
 *
 * Elsewhere required-ness is a danger asterisk per row. The draft's groups say it once
 * instead of five times, and answer the question the asterisk only hints at — required
 * *for what*. `headingHint` keeps that reachable when the grouping is visual only.
 */
export function DetailRail({
  groups,
  currentTab,
  currentId,
  ariaLabel,
  onGoTo,
  footer,
}: {
  groups: DetailRailGroup[];
  /** Which section is open, so the matching row can show as current. */
  currentTab: string;
  /**
   * Which *row* the reader arrived by, when more than one row opens the same section.
   *
   * An application's Authorization and Connection events steps are both configured on
   * Provisioning Setup, so matching on the section alone lit both — two rows claiming
   * "you are here" for one destination. This narrows it to the row that was actually
   * pressed. Leave it undefined where every row has a section of its own.
   */
  currentId?: string;
  ariaLabel: string;
  onGoTo: (row: DetailRailRow) => void;
  /**
   * Pinned under the list — a setup-guide icon, not another destination. Stays at
   * the bottom of the column while the list above it scrolls.
   */
  footer?: React.ReactNode;
}) {
  const row = (item: DetailRailRow) => {
    // The row whose section is open reads as current — narrowed by `currentId` when
    // several rows share that section. It is the page's only location indicator, so it is
    // also the only thing that can be wrong about it: hence the section still comes from
    // the same value the content switches on, and `currentId` can only ever disambiguate
    // between rows that section already matched.
    const current = item.tab === currentTab && (currentId === undefined || item.id === currentId);
    // A qualifier chip under the label is a second line, so the row top-aligns.
    // A single line (this one) centres, or the 18px type box sits high in the
    // padding and the row reads as more space below the word than above it.
    const stacked = Boolean(item.done && item.doneLabel);
    return (
      <li key={item.id}>
        <button
          type="button"
          onClick={() => onGoTo(item)}
          aria-current={current ? 'true' : undefined}
          className={[
            'flex w-full gap-2.5 rounded-md px-2 py-2 text-left transition-colors',
            stacked ? 'items-start' : 'items-center',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-subtle',
            current ? 'border border-brand bg-surface' : 'border border-transparent hover:bg-surface-hover',
          ].join(' ')}
        >
          {item.done !== undefined && (
            <span
              className={`${stacked ? 'mt-px ' : ''}grid h-4 w-4 shrink-0 place-items-center ${
                item.done ? 'text-success' : 'text-border-strong'
              }`}
            >
              <CheckCircle sx={{ fontSize: 16, color: 'inherit' }} />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span
              className={`block truncate ${
                current ? 'text-body-sm-medium text-text-primary' : 'text-body-sm text-text-primary'
              }`}
            >
              {item.label}
            </span>
            {/* Under the label, not beside it: at this width a chip on the same line
                spends 90px of a 200px run and turns "Advanced configuration" into an
                ellipsis. The qualifier is worth less than the name of the step. */}
            {stacked && (
              <span className="mt-1 block">
                <StatusChip intent="info" label={item.doneLabel!} dot={false} />
              </span>
            )}
          </span>
          {item.count != null && (
            <span
              className={[
                'shrink-0 rounded-pill px-2 py-0.5 text-caption-medium tabular-nums',
                current ? 'bg-brand text-brand-on' : 'bg-subtle text-text-secondary',
              ].join(' ')}
            >
              {item.count}
            </span>
          )}
        </button>
      </li>
    );
  };

  return (
    <nav
      className="flex w-[240px] shrink-0 flex-col border-r border-border bg-surface xl:w-[264px]"
      aria-label={ariaLabel}
    >
      {/* No title above the list. "Set up this access" restated what the page header,
          the Draft chip and the Activate button had already said between them, and it
          pushed the first step 60px down the column to do it. The group headings name
          what the rows are; `ariaLabel` carries the rail's identity for anyone who cannot
          see the grouping. */}
      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-2 py-4">
        {groups.map((group, i) => (
          <div key={group.heading ?? i} className={i > 0 ? 'mt-4' : undefined}>
            {group.heading && (
              <h3 className="px-2 text-overline uppercase text-text-tertiary">
                {group.heading}
                {group.headingHint && <span className="sr-only"> — {group.headingHint}</span>}
              </h3>
            )}
            <ul className={group.heading ? 'mt-1.5 space-y-0.5' : 'space-y-0.5'}>
              {group.rows.map(row)}
            </ul>
          </div>
        ))}
      </div>
      {footer && (
        <div className="flex shrink-0 items-center border-t border-border px-2 py-2">{footer}</div>
      )}
    </nav>
  );
}

export default DetailRail;
