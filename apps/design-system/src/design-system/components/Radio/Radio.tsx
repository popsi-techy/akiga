'use client';

import * as React from 'react';

/**
 * Radio — the canonical radio dot (18px, token-driven), the single-choice partner
 * to {@link Checkbox}.
 *
 * Deliberately the same 18px box metrics and the same `border-control` token as
 * Checkbox, so a single-select table and a multi-select table put their control
 * on exactly the same optical column. `border-control` exists because WCAG 1.4.11
 * asks 3:1 on a control boundary and the hairline tokens cannot reach it
 * (`border-default` 1.28:1, `border-strong` 1.66:1); `check:contrast` enforces it.
 *
 * Unlike a checkbox, a radio never un-checks itself — choosing another option is
 * what clears it — so `onChange` reports selection, not a toggle.
 *
 * `presentational` renders the dot alone with no control of its own. Use it when
 * an ancestor already is the control (e.g. a row with `role="radio"`), since
 * nesting interactive elements breaks both semantics and keyboard behaviour.
 */
export interface RadioProps {
  checked: boolean;
  /** Fires when this option is chosen. Never fires to un-choose — pick another. */
  onChange?: () => void;
  disabled?: boolean;
  /** Dot only, no input — for rows where an ancestor is the control. */
  presentational?: boolean;
  /**
   * Content beside the dot; clicking it selects. Prefer this over wrapping the
   * component in a `<label>` — a label only forwards clicks to form controls,
   * so the text would be dead.
   */
  label?: React.ReactNode;
  ariaLabel?: string;
}

const DOT = 'grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border transition-colors';

const dotClass = (on: boolean): string =>
  on ? `${DOT} border-brand bg-brand` : `${DOT} border-border-control bg-surface`;

/** The inner mark is the brand's on-colour so it reads against the filled ring. */
const Mark = () => <span className="h-1.5 w-1.5 rounded-full bg-brand-on" />;

export function Radio({
  checked,
  onChange,
  disabled = false,
  presentational = false,
  label,
  ariaLabel,
}: RadioProps) {
  if (presentational) {
    return (
      <span aria-hidden className={dotClass(checked)}>
        {checked && <Mark />}
      </span>
    );
  }

  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange?.()}
      className={[
        'inline-flex items-center rounded text-left',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
        'disabled:cursor-not-allowed disabled:opacity-50',
        label != null ? 'min-w-0 gap-2' : 'shrink-0',
      ].join(' ')}
    >
      <span className={dotClass(checked)}>{checked && <Mark />}</span>
      {label != null && <span className="min-w-0">{label}</span>}
    </button>
  );
}

export default Radio;
