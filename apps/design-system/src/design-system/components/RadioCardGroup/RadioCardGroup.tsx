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
  /**
   * Control on the trailing edge of the card — a small Configure button for the
   * option's own settings.
   *
   * It renders as a sibling of the radio, not inside it: a button nested in a
   * `role="radio"` is invalid, and a click on it would also pick the option.
   * Choosing and configuring stay separate targets, so opening the settings of
   * the option you have not chosen does not silently switch the choice.
   */
  action?: React.ReactNode;
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
  /**
   * Outlined selected state. `brand` is the default ring. `quiet` keeps the
   * same border as the other cards — the radio dot is the only “this one”
   * signal, for a pair that already carries a Configure action.
   * @default 'brand'
   */
  selectedTone?: 'brand' | 'quiet';
  ariaLabel?: string;
}

export function RadioCardGroup({
  options,
  value,
  onChange,
  columns = 1,
  layout = 'grid',
  appearance = 'plain',
  selectedTone = 'brand',
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
        const dot = (
          <span
            className={[
              'grid h-4 w-4 shrink-0 place-items-center rounded-full border',
              selected ? 'border-brand' : 'border-border-strong',
            ].join(' ')}
          >
            {selected && <span className="h-2 w-2 rounded-full bg-brand" />}
          </span>
        );
        // Alignment belongs to the content, padding to whatever carries the
        // surface — the radio alone, or the card that also holds an action.
        const alignClass = hasMeta ? 'items-start gap-2.5' : 'items-center gap-2';
        const padClass =
          appearance === 'outlined' ? 'px-3 py-2.5' : hasMeta ? 'px-1 py-1.5' : 'py-1';
        const surfaceClass =
          appearance === 'outlined'
            ? selected && selectedTone === 'brand'
              ? 'border border-brand bg-surface'
              : 'border border-border bg-surface hover:border-border-strong hover:bg-surface-hover'
            : 'hover:bg-surface-hover';

        const radio = (
          <button
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            className={[
              'flex rounded-md text-left transition-colors',
              alignClass,
              // With an action the card around it carries the surface and the
              // padding, so the radio is only the choosing target inside it.
              opt.action ? 'min-w-0 flex-1' : `${padClass} ${surfaceClass}`,
              'outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
              'disabled:cursor-not-allowed disabled:opacity-50',
            ].join(' ')}
          >
            {/* With an icon the control sits against a 32px tile, so it centres on
                that tile rather than on the first line of text — a 16px dot pinned to
                the top of a 32px neighbour reads as misaligned. Without an icon it
                still aligns to the label's first line, which is where the eye starts. */}
            {opt.icon ? (
              <span className="mt-0.5 flex h-8 shrink-0 items-center">{dot}</span>
            ) : (
              <span className={hasMeta ? 'mt-0.5 flex shrink-0' : 'flex shrink-0'}>{dot}</span>
            )}
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
              <span className="block text-body-sm-medium text-text-primary">{opt.label}</span>
              {opt.description && (
                <span className="mt-0.5 block text-caption leading-4 text-text-secondary">{opt.description}</span>
              )}
            </span>
          </button>
        );

        if (!opt.action) return <React.Fragment key={opt.value}>{radio}</React.Fragment>;

        return (
          <div
            key={opt.value}
            className={[
              'flex items-center justify-between gap-3 rounded-md transition-colors',
              padClass,
              surfaceClass,
              opt.disabled ? 'cursor-not-allowed opacity-50' : '',
            ].join(' ')}
          >
            {radio}
            <span className="shrink-0">{opt.action}</span>
          </div>
        );
      })}
    </div>
  );
}

export default RadioCardGroup;
