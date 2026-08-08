'use client';

import * as React from 'react';

/**
 * Meter — a slim progress/proportion bar. Used for completion percentage and
 * risk-reduction. Tone is semantic (separate from the brand accent).
 */
export type MeterTone = 'brand' | 'success' | 'warning' | 'danger';

export interface MeterProps {
  value: number;
  max?: number;
  tone?: MeterTone;
  /** Optional label + value row above the bar. */
  label?: React.ReactNode;
  valueLabel?: React.ReactNode;
  size?: 'sm' | 'md';
}

/** `fill`, not `fg` — a bar is a graphic, and the text roles read heavy as fills. */
const TONE: Record<MeterTone, string> = {
  brand: 'var(--ds-color-brand-primary)',
  success: 'var(--ds-color-status-success-fill)',
  warning: 'var(--ds-color-status-warning-fill)',
  danger: 'var(--ds-color-status-danger-fill)',
};

export function Meter({ value, max = 100, tone = 'brand', label, valueLabel, size = 'md' }: MeterProps) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));
  return (
    <div className="w-full">
      {(label || valueLabel) && (
        <div className="mb-1.5 flex items-center justify-between text-caption">
          <span className="font-emphasis text-text-secondary">{label}</span>
          <span className="tabular-nums text-text-primary">{valueLabel}</span>
        </div>
      )}
      <div
        className={['w-full overflow-hidden rounded-pill bg-subtle', size === 'sm' ? 'h-1.5' : 'h-2'].join(' ')}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-pill transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%`, background: TONE[tone] }}
        />
      </div>
    </div>
  );
}

export default Meter;
