import * as React from 'react';
import Link from 'next/link';

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
  /**
   * Where this number can be seen in full.
   *
   * **A KPI whose population can be listed should always give it.** A dashboard
   * tile answers "how many"; the next question is always "which ones", and a tile
   * that cannot answer it makes the reader go and rebuild the same filter by hand
   * on another screen. Passing `href` turns the whole tile into one link — not a
   * small "view" affordance in a corner — because the number is the thing being
   * clicked.
   *
   * Omit it only when there is genuinely nothing to list (a percentage, a ratio).
   */
  href?: string;
  /** Same as `href` for tiles that open a panel rather than navigate. */
  onClick?: () => void;
}

const TONES: Record<StatTone, { bg: string; fg: string }> = {
  brand: { bg: 'var(--ds-color-brand-subtle)', fg: 'var(--ds-color-brand-primary)' },
  info: { bg: 'var(--ds-color-status-info-subtle)', fg: 'var(--ds-color-status-info-solid)' },
  success: { bg: 'var(--ds-color-status-success-subtle)', fg: 'var(--ds-color-status-success-solid)' },
  warning: { bg: 'var(--ds-color-status-warning-subtle)', fg: 'var(--ds-color-status-warning-fg)' },
  danger: { bg: 'var(--ds-color-status-danger-subtle)', fg: 'var(--ds-color-status-danger-solid)' },
  neutral: { bg: 'var(--ds-color-background-subtle)', fg: 'var(--ds-color-icon-default)' },
};

export function StatTile({
  label,
  value,
  icon,
  tone = 'brand',
  hint,
  hoverElevate = false,
  href,
  onClick,
}: StatTileProps) {
  const t = TONES[tone];
  const actionable = Boolean(href || onClick);

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-body-sm text-text-secondary">{label}</div>
          <div className="mt-1 text-stat leading-8 text-text-primary">{value}</div>
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
      {/* The affordance is the tile's own hover, not a "View all →" link in the
          corner: a second target inside a card that is already one target gives
          the reader two places to aim at for one outcome. */}
    </>
  );

  const shell = [
    'block w-full rounded-lg border border-border bg-surface p-5 text-left',
    hoverElevate ? 'transition-shadow duration-200 hover:shadow-md' : '',
    actionable
      ? 'cursor-pointer transition-colors hover:border-border-strong hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle'
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (href) {
    return (
      <Link href={href} className={shell}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={shell}>
        {body}
      </button>
    );
  }
  return <div className={shell}>{body}</div>;
}

export default StatTile;
