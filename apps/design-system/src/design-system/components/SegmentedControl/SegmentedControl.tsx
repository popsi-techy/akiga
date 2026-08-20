'use client';

import * as React from 'react';

/**
 * SegmentedControl — a compact single-choice toggle (pill of segments). For a
 * small set of mutually exclusive options where a dropdown would be heavier:
 * durations, density toggles, quick filters.
 */
export interface SegmentedOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  /**
   * How many things are behind the segment, when it switches between collections.
   *
   * A plain trailing number rather than a filled pill. `NavList` uses a pill because it
   * looks like navigation and needs the count to read as a badge; a segmented control is
   * a control, and a badge inside a segment competes with the selected-segment fill for
   * the same "this one" signal. Zero shows: on a switcher, "Technical Roles 0" answers
   * the question the reader is asking, where an absent count makes them click to find out.
   */
  count?: number;
}
export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  ariaLabel?: string;
  fullWidth?: boolean;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  ariaLabel,
  fullWidth = false,
}: SegmentedControlProps<T>) {
  // One complete type class per size rather than a size plus a weight utility, and the
  // same weight on every segment: the selected one is marked by its fill, and changing
  // the weight as well would reflow the track each time the choice moves.
  const pad = size === 'sm' ? 'px-2.5 py-1 text-caption-medium' : 'px-3.5 py-1.5 text-body-sm-medium';
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      // An outlined track, not a filled one. The fill made the control a grey slab on the
      // page even when nothing was selected in particular; a hairline states the same
      // grouping and leaves the page's ground alone.
      //
      // `md` (8px) is not a free choice: it is the segment's `sm` (6px) plus the 2px
      // gutter, which is what keeps the outer curve parallel to the inner one. At `lg`
      // (12px) the track's corners bowed away from the selected segment's; at 6px they
      // would pinch inside it. Change the gutter and this has to move with it.
      className={['inline-flex rounded-md border border-border p-0.5', fullWidth ? 'flex w-full' : ''].join(' ')}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={[
              // `rounded-sm` is the 6px token this was spelling out as an arbitrary value.
              'inline-flex items-center justify-center gap-1.5 rounded-sm transition-colors',
              pad,
              fullWidth ? 'flex-1' : '',
              // `surface.inverse` (ink 800) with inverse text. On an outlined track a
              // white-on-grey selected segment had nothing left to contrast against, so
              // selection is now carried by the strongest fill in the palette — no shadow
              // needed to lift it, and no ambiguity about which segment is on.
              active
                ? 'bg-surface-inverse text-text-inverse'
                : 'text-text-secondary hover:text-text-primary',
            ].join(' ')}
          >
            {opt.label}
            {/* `opacity-70` rather than an alpha on the colour: these are CSS variables
                holding hex, and Tailwind's `/70` modifier cannot resolve them — it emits
                an invalid colour and the number disappears. */}
            {opt.count != null && (
              <span
                className={`tabular-nums ${
                  active ? 'text-text-inverse opacity-70' : 'text-text-tertiary'
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
