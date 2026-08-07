'use client';

import * as React from 'react';
import ChevronRight from '@mui/icons-material/ChevronRight';

export interface AccessTrailStep {
  /** Level name — used for the step's accessible name and its back tooltip. */
  level: string;
  label: string;
  /** Level icon, 16px. */
  icon?: React.ReactNode;
}

/**
 * AccessTrail — the current drill-down as a single strip under the page header.
 *
 * The columns already show *where* the reader is, so the trail's real value is
 * getting back: clicking a step drops every selection after it, which is faster
 * than re-picking rows column by column. Kept flat (icon + label + chevron, no
 * chips) because it sits directly above four columns of bordered chrome — one more
 * boxed row there would compete with the content.
 */
export function AccessTrail({
  steps,
  onTruncate,
  emptyHint,
  trailing,
}: {
  steps: AccessTrailStep[];
  /** Keep the first `count` selections and clear the rest. */
  onTruncate: (count: number) => void;
  /** Right-aligned content — headline counts for the current subject. */
  trailing?: React.ReactNode;
  /**
   * Shown in place of the steps before anything is selected. The strip always
   * renders: hiding it would shove all four columns down by its height the moment
   * the first row is picked.
   */
  emptyHint?: string;
}) {
  return (
    <nav
      aria-label="Selected access path"
      className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-border bg-sunken px-5 py-2"
    >
      {trailing != null && <span className="order-last ml-auto shrink-0 pl-3">{trailing}</span>}
      {steps.length === 0 && (
        <span className="text-body-sm text-text-tertiary">{emptyHint ?? 'Nothing selected yet.'}</span>
      )}
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        return (
          <React.Fragment key={`${step.level}:${step.label}`}>
            {i > 0 && <ChevronRight aria-hidden sx={{ fontSize: 16 }} className="text-icon" />}
            <button
              type="button"
              // Only earlier steps do anything — the last one is already the active
              // selection, so re-applying it would be a dead click target.
              disabled={last}
              onClick={() => onTruncate(i + 1)}
              title={last ? undefined : `Back to ${step.level}`}
              aria-label={`${step.level}: ${step.label}`}
              className={[
                'inline-flex max-w-[260px] items-center gap-1.5 rounded',
                // `group` only on steps that can be clicked — a disabled button
                // still matches :hover, so an always-on group would light up the
                // current step as if it were a target.
                last ? 'cursor-default' : 'group',
              ].join(' ')}
            >
              {step.icon && (
                <span aria-hidden className="shrink-0 text-icon transition-colors group-hover:text-text-brand">
                  {step.icon}
                </span>
              )}
              <span className="truncate text-body-sm font-medium text-text-primary transition-colors group-hover:text-text-brand">
                {step.label}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default AccessTrail;
