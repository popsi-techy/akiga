'use client';

import * as React from 'react';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForward';

/**
 * NavCard — a launcher card for landing pages that route into a section: a title
 * with a trailing arrow, a short description, and optional tag chips. Clicking the
 * card navigates. Lay several out in a responsive grid (the caller owns the grid).
 */
export interface NavCardProps {
  title: string;
  description?: string;
  /** How many records this view holds — shown as an info-tinted count chip. */
  count?: number;
  /** Small pill tags shown at the bottom (e.g. personas or categories). */
  tags?: string[];
  /** Optional leading icon rendered in a brand-tint tile. */
  icon?: React.ReactNode;
  onClick?: () => void;
  /**
   * Present but not yet available. The card keeps its place in the grid — the set
   * of views is itself information — but drops the arrow and recedes, so nothing
   * invites a click that would do nothing.
   */
  disabled?: boolean;
}

/** Fixed locale so the server and client render the same string (no hydration mismatch). */
const formatCount = (n: number) => n.toLocaleString('en-US');

export function NavCard({ title, description, count, tags, icon, onClick, disabled = false }: NavCardProps) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={[
        'group flex w-full flex-col rounded-xl border border-border p-5 text-left transition-all',
        disabled
          ? 'cursor-default bg-subtle'
          : 'bg-surface hover:border-border-strong hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <span
            className={[
              'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
              disabled ? 'bg-surface text-icon-subtle' : 'bg-brand-subtle text-icon-brand',
            ].join(' ')}
          >
            {icon}
          </span>
        )}
        <h3 className={`min-w-0 flex-1 text-h5 ${disabled ? 'text-text-tertiary' : 'text-text-primary'}`}>{title}</h3>
        {/* No arrow when there is nowhere to go. */}
        {!disabled && (
          <ArrowForwardOutlined
            sx={{ fontSize: 18 }}
            className="mt-0.5 shrink-0 text-icon transition-transform group-hover:translate-x-0.5 group-hover:text-text-primary"
          />
        )}
      </div>
      {description && (
        <p className={`mt-2 text-body-sm ${disabled ? 'text-text-tertiary' : 'text-text-secondary'}`}>{description}</p>
      )}
      {(count != null || (tags && tags.length > 0)) && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {count != null && (
            <span className="rounded-pill bg-[var(--ds-color-status-info-subtle)] px-2.5 py-1 text-caption-strong tabular-nums text-[var(--ds-color-status-info-fg)]">
              {formatCount(count)}
            </span>
          )}
          {tags?.map((t) => (
            <span key={t} className="rounded-pill bg-subtle px-2.5 py-1 text-caption-strong text-text-secondary">
              {t}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

export default NavCard;
