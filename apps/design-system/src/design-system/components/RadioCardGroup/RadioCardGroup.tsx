'use client';

import * as React from 'react';

/**
 * RadioCardGroup — a single-choice selector rendered as clickable cards (icon +
 * label + optional description). Used where a plain radio list is too plain, e.g.
 * approver type, split-attribute pickers. Keyboard + ARIA: a roving radiogroup.
 */
export interface RadioCardOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface RadioCardGroupProps {
  options: RadioCardOption[];
  value?: string;
  onChange: (value: string) => void;
  /** Grid columns when layout is `grid`. @default 1 */
  columns?: 1 | 2 | 3;
  /**
   * `grid` — equal columns (default).
   * `inline` — compact horizontal row; options size to content.
   */
  layout?: 'grid' | 'inline';
  /** Visual treatment for each option. @default 'plain' */
  appearance?: 'plain' | 'outlined';
  ariaLabel?: string;
}

export function RadioCardGroup({
  options,
  value,
  onChange,
  columns = 1,
  layout = 'grid',
  appearance = 'plain',
  ariaLabel,
}: RadioCardGroupProps) {
  const cols = columns === 3 ? 'grid-cols-3' : columns === 2 ? 'grid-cols-2' : 'grid-cols-1';
  const groupClass =
    layout === 'inline' ? 'flex flex-wrap items-center gap-x-8 gap-y-2' : `grid gap-2 ${cols}`;
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={groupClass}>
      {options.map((opt) => {
        const selected = value === opt.value;
        const hasMeta = Boolean(opt.icon || opt.description);
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            className={[
              'flex rounded-md text-left transition-colors',
              hasMeta
                ? appearance === 'outlined'
                  ? 'items-start gap-2.5 px-3 py-2.5'
                  : 'items-start gap-2.5 px-1 py-1.5'
                : appearance === 'outlined'
                  ? 'items-center gap-2 px-3 py-2.5'
                  : 'items-center gap-2 py-1',
              appearance === 'outlined'
                ? selected
                  ? 'border border-brand bg-brand-subtle'
                  : 'border border-border bg-surface hover:border-border-strong hover:bg-surface-hover'
                : 'hover:bg-surface-hover',
              'outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
              'disabled:cursor-not-allowed disabled:opacity-50',
            ].join(' ')}
          >
            <span
              className={[
                'grid h-4 w-4 shrink-0 place-items-center rounded-full border',
                hasMeta ? 'mt-0.5' : '',
                selected ? 'border-brand' : 'border-border-strong',
              ].join(' ')}
            >
              {selected && <span className="h-2 w-2 rounded-full bg-brand" />}
            </span>
            {opt.icon && (
              <span
                className={[
                  'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-subtle',
                  selected ? 'text-brand-active' : 'text-brand',
                ].join(' ')}
              >
                {opt.icon}
              </span>
            )}
            <span className={layout === 'inline' ? 'min-w-0' : 'min-w-0 flex-1'}>
              <span className="block text-body-sm font-medium text-text-primary">{opt.label}</span>
              {opt.description && (
                <span className="mt-0.5 block text-caption leading-4 text-text-secondary">{opt.description}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default RadioCardGroup;
