'use client';

import * as React from 'react';
import { Tooltip } from '../Tooltip/Tooltip';

/**
 * ModeBar — equal tiles that pick which body lives below them.
 *
 * FormSection groups fields inside one form. Tabs switch facets of the same
 * form. SegmentedControl toggles density or a duration. None of those is
 * “this drawer is now a different job”: Basic vs OAuth replaces the fields,
 * and the switcher has to stay visible while the new fields scroll.
 *
 * Why MUI was insufficient: ToggleButtonGroup is the closest, but it has no
 * coming-soon state, no icon-over-label tile, and it would restyle into a
 * second SegmentedControl. RadioCardGroup keeps the radio dot and a
 * description — too tall, and too much like a field, to pin in drawer chrome.
 *
 * Selection is a brand outline on a white (surface) fill. No radio dots:
 * the tile *is* the control. Disabled options stay in the row (so the set
 * of methods does not reflow when one ships) and explain themselves with a
 * tooltip — not a Soon caption on the tile.
 */
export interface ModeBarOption {
  value: string;
  label: string;
  /** Outlined MUI icon at 18px (`sx={{ fontSize: 18 }}`), uncoloured. */
  icon: React.ReactNode;
  disabled?: boolean;
  /** Tooltip on a disabled tile, e.g. `Coming soon`. */
  hint?: string;
}

export interface ModeBarProps {
  options: ModeBarOption[];
  value: string;
  onChange: (value: string) => void;
  /** Names the radiogroup. Required — the tiles have no heading of their own. */
  ariaLabel: string;
}

export function ModeBar({ options, value, onChange, ariaLabel }: ModeBarProps) {
  const groupRef = React.useRef<HTMLDivElement>(null);
  const enabled = options.filter((o) => !o.disabled);
  const selectedIndex = Math.max(
    0,
    enabled.findIndex((o) => o.value === value),
  );

  const move = (dir: 1 | -1) => {
    if (enabled.length === 0) return;
    const next = enabled[(selectedIndex + dir + enabled.length) % enabled.length];
    onChange(next.value);
    requestAnimationFrame(() => {
      const el = groupRef.current?.querySelector<HTMLButtonElement>(`[data-mode="${next.value}"]`);
      el?.focus();
    });
  };

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          move(1);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          move(-1);
        }
      }}
      className="flex gap-2"
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        const unavailable = Boolean(opt.disabled);
        const tile = (
          <button
            type="button"
            role="radio"
            data-mode={opt.value}
            aria-checked={selected}
            aria-disabled={unavailable || undefined}
            disabled={unavailable}
            tabIndex={unavailable ? -1 : selected ? 0 : -1}
            onClick={() => {
              if (!unavailable) onChange(opt.value);
            }}
            className={[
              'flex w-full flex-col items-center justify-center gap-1 rounded-md border px-1.5 py-2.5 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
              unavailable
                ? 'cursor-not-allowed border-border bg-surface text-text-disabled'
                : selected
                  ? 'border-brand bg-surface text-text-primary'
                  : 'border-border bg-surface text-text-secondary hover:border-border-strong hover:text-text-primary',
            ].join(' ')}
          >
            <span
              aria-hidden
              className={[
                'inline-flex h-[18px] w-[18px] items-center justify-center [&_svg]:block',
                unavailable ? 'text-icon-subtle' : selected ? 'text-icon-brand' : 'text-icon',
              ].join(' ')}
            >
              {opt.icon}
            </span>
            <span className="text-center text-caption-medium">{opt.label}</span>
          </button>
        );

        return (
          <div key={opt.value} className="min-w-0 flex-1">
            {unavailable && opt.hint ? (
              <Tooltip title={opt.hint}>
                <span className="block">{tile}</span>
              </Tooltip>
            ) : (
              tile
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ModeBar;
