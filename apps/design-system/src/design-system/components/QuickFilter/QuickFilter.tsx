'use client';

import * as React from 'react';
import CloseIcon from '@mui/icons-material/Close';

/**
 * QuickFilter — a row of standalone, single-select filter chips. Unlike
 * SegmentedControl (a connected toggle where one segment is always on), each
 * QuickFilter chip is its own outlined pill; the active chip gets a brand outline
 * and a clear (✕) affordance, and `null` means "no filter applied" (show all).
 * Use for lightweight list filtering — status, category, owner.
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
  size?: 'sm' | 'md';
  ariaLabel?: string;
}

export function QuickFilter<T extends string = string>({
  options,
  value,
  onChange,
  size = 'sm',
  ariaLabel,
}: QuickFilterProps<T>) {
  const dims = size === 'sm' ? 'h-9 px-2.5 text-caption' : 'h-10 px-3.5 text-body-sm';
  return (
    <div role="group" aria-label={ariaLabel} className="inline-flex flex-wrap items-center gap-1.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? null : opt.value)}
            className={[
              'inline-flex items-center gap-1.5 rounded-pill border font-medium transition-colors',
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
            {active && <CloseIcon sx={{ fontSize: 14 }} className="-mr-0.5 text-icon" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}

export default QuickFilter;
