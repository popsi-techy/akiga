'use client';

import * as React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import RemoveIcon from '@mui/icons-material/Remove';

/**
 * Checkbox — the canonical check box (18px, token-driven).
 *
 * The unchecked outline uses `border-control`, the token added for exactly this:
 * WCAG 1.4.11 asks 3:1 on a control boundary and the hairline borders cannot
 * reach it (`border-default` 1.28:1, `border-strong` 1.66:1), so a hairline here
 * would be a contrast failure rather than merely a light-looking one.
 * `check:contrast` enforces `border.control` against both surface and subtle.
 *
 * `presentational` renders the box alone with no control of its own. Use it when
 * an ancestor already is the control (e.g. a row with `role="checkbox"`), since
 * nesting interactive elements breaks both semantics and keyboard behaviour.
 */
export interface CheckboxProps {
  checked: boolean;
  /** Mixed state — renders a dash and reports `aria-checked="mixed"`. */
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  /** Selected accent: brand for additive picks, danger for destructive ones. @default 'brand' */
  tone?: 'brand' | 'danger';
  disabled?: boolean;
  /** Box only, no input — for rows where an ancestor is the control. */
  presentational?: boolean;
  /**
   * Content beside the box; clicking it toggles. Prefer this over wrapping the
   * component in a `<label>` — a label only forwards clicks to form controls,
   * so the text would be dead.
   */
  label?: React.ReactNode;
  ariaLabel?: string;
}

const BOX = 'grid h-[18px] w-[18px] shrink-0 place-items-center rounded border transition-colors';

function boxClass(on: boolean, tone: 'brand' | 'danger'): string {
  if (!on) return `${BOX} border-border-control bg-surface`;
  return tone === 'danger'
    ? `${BOX} border-[var(--ds-color-status-danger-fg)] bg-[var(--ds-color-status-danger-fg)] text-white`
    : `${BOX} border-brand bg-brand text-brand-on`;
}

export function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  tone = 'brand',
  disabled = false,
  presentational = false,
  label,
  ariaLabel,
}: CheckboxProps) {
  const on = checked || indeterminate;
  const glyph = indeterminate ? (
    <RemoveIcon sx={{ fontSize: 13 }} />
  ) : checked ? (
    <CheckIcon sx={{ fontSize: 13 }} />
  ) : null;

  if (presentational) {
    return (
      <span aria-hidden className={boxClass(on, tone)}>
        {glyph}
      </span>
    );
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={[
        'inline-flex items-center rounded text-left',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
        'disabled:cursor-not-allowed disabled:opacity-50',
        label != null ? 'min-w-0 gap-2' : 'shrink-0',
      ].join(' ')}
    >
      <span className={boxClass(on, tone)}>{glyph}</span>
      {label != null && <span className="min-w-0">{label}</span>}
    </button>
  );
}

export default Checkbox;
