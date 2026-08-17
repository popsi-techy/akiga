'use client';

import * as React from 'react';
import { Tooltip } from '../Tooltip/Tooltip';

const CHIP =
  'inline-flex max-w-[140px] items-center rounded-pill border border-border bg-subtle px-2 py-0.5 text-caption-medium text-text-primary';

/** Inside the tinted group the chip lifts off it instead of outlining against it. */
const CHIP_IN_GROUP =
  'inline-flex max-w-[140px] items-center rounded-pill bg-surface px-2 py-0.5 text-caption-medium text-text-primary shadow-xs';

/**
 * A few named things plus a `+n` that reveals the rest.
 *
 * For rows that must not change height with their contents — a table cell, a
 * label/value row, a summary beside a button. Naming one or two is what makes the
 * set concrete; the overflow is a real affordance rather than an ellipsis, so
 * hovering or focusing `+n` tells you what did not fit.
 *
 * Promoted out of the product once a second surface needed it: two implementations
 * of "one chip and a +n" would have drifted in chip shape, and the chip shape is
 * the whole point of the pattern.
 */
export interface OverflowChipsProps {
  items: { id: string; name: string }[];
  /** How many to name before collapsing the rest. @default 1 */
  max?: number;
  /** Shown when there is nothing to name. @default 'None' */
  emptyLabel?: string;
}

export function OverflowChips({ items, max = 1, emptyLabel = 'None' }: OverflowChipsProps) {
  if (items.length === 0) return <span className="text-text-tertiary">{emptyLabel}</span>;

  const shown = items.slice(0, max);
  const rest = items.slice(max);

  // `flex-nowrap`: the named chips plus `+n` are sized to fit, so wrapping can
  // only ever be a mistake here — and a wrap is what would change the row height.
  //
  // With an overflow the whole thing sits in one tinted pill: "Okta" and "+2" are
  // two halves of a single answer to "which applications?", and as two loose
  // chips they read as two separate values. Nothing to group when everything
  // fits, so a lone chip is left as a lone chip rather than nested in a pill.
  return (
    <span
      className={[
        'flex flex-nowrap items-center gap-1.5',
        rest.length > 0 ? 'rounded-pill bg-subtle py-1 pl-1 pr-2.5' : '',
      ].join(' ')}
    >
      {shown.map((e) => (
        <span key={e.id} className={rest.length > 0 ? CHIP_IN_GROUP : CHIP} title={e.name}>
          <span className="truncate">{e.name}</span>
        </span>
      ))}
      {rest.length > 0 && (
        <Tooltip
          variant="card"
          // Chips in the overlay too — the same mark for the same kind of thing,
          // so the hidden ones read as a continuation of the row rather than a
          // different list. Free to wrap here: the card sizes to its contents.
          title={
            <div className="flex max-w-[260px] flex-wrap items-center gap-1.5 p-3">
              {rest.map((e) => (
                <span key={e.id} className={CHIP} title={e.name}>
                  <span className="truncate">{e.name}</span>
                </span>
              ))}
            </div>
          }
        >
          {/* Plain text inside the group, not a second chip: the count is a
              remainder, and giving it the same outline as a named item claims it
              is one. */}
          <span
            tabIndex={0}
            aria-label={`${rest.length} more: ${rest.map((e) => e.name).join(', ')}`}
            className="cursor-help whitespace-nowrap rounded-sm text-caption-medium text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
          >
            +{rest.length}
          </span>
        </Tooltip>
      )}
    </span>
  );
}

export default OverflowChips;
