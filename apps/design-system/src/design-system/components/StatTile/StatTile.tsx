import * as React from 'react';

/**
 * StatTile — a KPI tile: label, large value, and an icon in a tinted rounded
 * square (matches the product dashboard). The icon is graphical (WCAG 1.4.11,
 * 3:1) so brand-orange on tint is fine. Use `tone` to color the icon tile.
 */
export type StatTone = 'brand' | 'info' | 'success' | 'warning' | 'danger' | 'neutral';

export interface StatTileProps {
  label: string;
  value: React.ReactNode;
  /** A MUI icon element (color is applied by the tile). */
  icon?: React.ReactNode;
  tone?: StatTone;
  /** Optional supporting line under the value (e.g. a trend). */
  hint?: React.ReactNode;
  /** No shadow at rest; elevates on hover. @default false */
  hoverElevate?: boolean;
}

const TONES: Record<StatTone, { bg: string; fg: string }> = {
  brand: { bg: 'var(--ds-color-brand-subtle)', fg: 'var(--ds-color-brand-primary)' },
  info: { bg: 'var(--ds-color-status-info-subtle)', fg: 'var(--ds-color-status-info-solid)' },
  success: { bg: 'var(--ds-color-status-success-subtle)', fg: 'var(--ds-color-status-success-solid)' },
  warning: { bg: 'var(--ds-color-status-warning-subtle)', fg: 'var(--ds-color-status-warning-fg)' },
  danger: { bg: 'var(--ds-color-status-danger-subtle)', fg: 'var(--ds-color-status-danger-solid)' },
  neutral: { bg: 'var(--ds-color-background-subtle)', fg: 'var(--ds-color-icon-default)' },
};

export function StatTile({ label, value, icon, tone = 'brand', hint, hoverElevate = false }: StatTileProps) {
  const t = TONES[tone];
  return (
    <div
      className={`rounded-lg border border-border bg-surface p-5 ${
        hoverElevate ? 'transition-shadow duration-200 hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-body-sm text-text-secondary">{label}</div>
          <div className="mt-1 text-stat font-bold leading-8 text-text-primary">{value}</div>
          {hint && <div className="mt-1 text-caption text-text-tertiary">{hint}</div>}
        </div>
        {icon && (
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
            style={{ background: t.bg, color: t.fg }}
          >
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}

export default StatTile;
