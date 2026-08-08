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
  const pad = size === 'sm' ? 'px-2.5 py-1 text-caption' : 'px-3.5 py-1.5 text-body-sm';
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={['inline-flex rounded-lg bg-subtle p-0.5', fullWidth ? 'flex w-full' : ''].join(' ')}
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
              'rounded-[6px] font-emphasis transition-colors',
              pad,
              fullWidth ? 'flex-1' : '',
              active ? 'bg-surface text-text-primary shadow-xs' : 'text-text-secondary hover:text-text-primary',
            ].join(' ')}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
