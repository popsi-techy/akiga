'use client';

import * as React from 'react';
import CloseIcon from '@mui/icons-material/Close';

/**
 * QuickFilter — a row of standalone, single-select filter chips. Each chip is its own
 * outlined pill; the active one gets a brand outline, and `null` means "no filter applied"
 * (show all). Use for lightweight list filtering — status, category, owner.
 *
 * `clearable={false}` turns the same chips into a required choice: the ✕ goes, clicking the
 * active chip does nothing, and `onChange` never emits `null`. That is for a control where
 * every state is a real answer and "none" is not one of them — a reporting period, a unit, a
 * density. The alternative, `SegmentedControl`, says the same thing in a connected track;
 * which of the two you want is a question about weight, not about behaviour, and a screen
 * that already spends a track on something else should not spend a second one here.
 *
 * Chip height follows the shared control scale (sm 36px / md 40px) so a QuickFilter
 * lines up with an Input / Button / Select in the same toolbar row.
 */
export interface QuickFilterOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  /** Optional trailing count (e.g. how many items match this filter). */
  count?: number;
}
export interface QuickFilterProps<T extends string = string> {
  options: QuickFilterOption<T>[];
  /** The selected value, or `null` when nothing is filtered (all shown). */
  value: T | null;
  /** Fires with the chosen value, or `null` when the active chip is cleared. */
  onChange: (value: T | null) => void;
  /**
   * Whether the active chip can be cleared back to "no filter". @default true
   *
   * Set it false where every option is a real answer and none of them is "unset" — a
   * reporting period is always some period. The ✕ is dropped with it: an affordance that
   * offers a state the screen cannot be in is worse than no affordance, because the reader
   * who takes it up gets nothing and learns the control is unreliable.
   */
  clearable?: boolean;
  size?: 'sm' | 'md';
  ariaLabel?: string;
}

export function QuickFilter<T extends string = string>({
  options,
  value,
  onChange,
  clearable = true,
  size = 'sm',
  ariaLabel,
}: QuickFilterProps<T>) {
  const dims = size === 'sm' ? 'h-9 px-2.5 text-caption' : 'h-10 px-3.5 text-body-sm';
  /*
    A required choice is a radio group, a clearable one is a set of toggles — and assistive
    technology is told which. `aria-pressed` on a chip that cannot be unpressed announces a
    state the reader cannot leave; `role="radio"` announces the choice they are actually
    making.
  */
  const roleProps = clearable
    ? ({ role: 'group' } as const)
    : ({ role: 'radiogroup' } as const);
  return (
    <div {...roleProps} aria-label={ariaLabel} className="inline-flex flex-wrap items-center gap-1.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            {...(clearable ? { 'aria-pressed': active } : { role: 'radio', 'aria-checked': active })}
            onClick={() => {
              if (active) {
                if (clearable) onChange(null);
                return;
              }
              onChange(opt.value);
            }}
            className={[
              'inline-flex items-center gap-1.5 rounded-pill border font-emphasis transition-colors',
              dims,
              active
                ? 'border-brand bg-surface text-text-primary'
                : 'border-border bg-surface text-text-secondary hover:border-border-strong hover:text-text-primary',
            ].join(' ')}
          >
            <span>{opt.label}</span>
            {opt.count != null && (
              <span className={['tabular-nums', active ? 'text-text-secondary' : 'text-text-tertiary'].join(' ')}>{opt.count}</span>
            )}
            {active && clearable && (
              <CloseIcon sx={{ fontSize: 14 }} className="-mr-0.5 text-icon" aria-hidden />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default QuickFilter;
