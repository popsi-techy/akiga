'use client';

import * as React from 'react';
import { Tooltip } from '../Tooltip/Tooltip';

const CHIP =
  'inline-flex max-w-[140px] items-center rounded-pill border border-border bg-subtle px-2 py-0.5 text-caption-medium text-text-primary';

/** Inside the tinted group the chip lifts off it instead of outlining against it. */
const CHIP_IN_GROUP =
  'inline-flex max-w-[140px] items-center rounded-pill bg-surface px-2 py-0.5 text-caption-medium text-text-primary shadow-xs';

export interface OverflowChipItem {
  id: string;
  name: string;
}

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
 *
 * `renderItem` is for items that carry their own mark — an access pill with an
 * app logo, a person with their avatar. Those stay ungrouped: wrapping them in a
 * second tinted pill would nest two answers. People in particular are named with
 * the round avatar and the plain name rather than the default chip, since the
 * shape is what the rest of the product uses to say "person" and a pill around a
 * name claims it is one value among a set.
 */
export interface OverflowChipsProps<T extends OverflowChipItem = OverflowChipItem> {
  items: T[];
  /** How many to name before collapsing the rest. @default 1 */
  max?: number;
  /** Shown when there is nothing to name. @default 'None' */
  emptyLabel?: string;
  /** Custom chip. When set, chips are not grouped into one tinted pill. */
  renderItem?: (item: T) => React.ReactNode;
  /**
   * `onSubtle` inverts the grouped chrome for a grey well: a white capsule,
   * grey named pills, the same +n. Default grouped chrome is a grey capsule
   * with white chips, which disappears on `bg-subtle`.
   */
  tone?: 'default' | 'onSubtle';
}

const CHIP_ON_SUBTLE =
  'inline-flex max-w-[140px] items-center rounded-pill bg-subtle px-2 py-0.5 text-caption-medium text-text-primary';

export function OverflowChips<T extends OverflowChipItem = OverflowChipItem>({
  items,
  max = 1,
  emptyLabel = 'None',
  renderItem,
  tone = 'default',
}: OverflowChipsProps<T>) {
  if (items.length === 0) return <span className="text-text-tertiary">{emptyLabel}</span>;

  const shown = items.slice(0, max);
  const rest = items.slice(max);
  const onSubtle = tone === 'onSubtle';
  // Named-only chips share one pill with `+n`. Custom chips bring their own
  // shape, so grouping them would nest two pills. `onSubtle` always groups:
  // a lone grey chip on a grey well has no edge.
  const grouped = renderItem == null && (onSubtle || rest.length > 0);

  const chip = (e: T, inGroup: boolean) =>
    renderItem ? (
      renderItem(e)
    ) : (
      <span
        className={onSubtle ? (inGroup ? CHIP_ON_SUBTLE : CHIP) : inGroup ? CHIP_IN_GROUP : CHIP}
        title={e.name}
      >
        <span className="truncate">{e.name}</span>
      </span>
    );

  return (
    <span
      className={[
        // `inline-flex`, so the group is as wide as the chips in it. A block
        // flex container stretches to its cell, which turns the tinted pill
        // into a band across the column and reads as a filled field.
        'inline-flex max-w-full flex-nowrap items-center gap-1.5 align-middle',
        grouped
          ? onSubtle
            ? 'rounded-pill border border-border bg-surface py-1 pl-1 pr-2.5'
            : 'rounded-pill bg-subtle py-1 pl-1 pr-2.5'
          : '',
      ].join(' ')}
    >
      {shown.map((e) => (
        <React.Fragment key={e.id}>{chip(e, grouped)}</React.Fragment>
      ))}
      {rest.length > 0 && (
        <Tooltip
          variant="card"
          // Chips in the overlay too — the same mark for the same kind of thing,
          // so the hidden ones read as a continuation of the row rather than a
          // different list. Free to wrap here: the card sizes to its contents.
          title={
            <div
              className={`flex flex-wrap items-center gap-1.5 p-3 ${
                renderItem ? 'max-w-[420px]' : 'max-w-[260px]'
              }`}
            >
              {rest.map((e) => (
                <React.Fragment key={e.id}>{chip(e, false)}</React.Fragment>
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
