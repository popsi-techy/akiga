'use client';

import * as React from 'react';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { Avatar } from '../Avatar/Avatar';

/**
 * DestinationList — destinations you go to.
 *
 * `card` (default): Avatar tile, title, optional description, chevron. Two
 * columns from `sm` up. Cards share height in a row. Radius is `lg` (12px).
 *
 * `plain`: outlined icon well + title + optional two-line description.
 * Default three columns from `md` up. Glyph colour follows `tone` (default
 * `text-icon` — ink 500). No Avatar fill and no chevron.
 *
 * `list`: one column of icon + title + description rows, divided by hairlines.
 *
 * The whole item is one target. Do not nest interactive elements inside.
 */
export type DestinationListIconTone = 'neutral' | 'brand' | 'info' | 'success' | 'warning';

export interface DestinationListItem {
  id: string;
  title: string;
  description?: string;
  /** Right-side verb on `list` rows, styled as a text link. Not a second target. */
  actionLabel?: string;
  icon?: React.ReactNode;
  /**
   * Icon colour on `plain` and `list`. Omit it for the appearance default:
   * `text-icon` (ink 500) on plain, `text-icon-subtle` on list.
   * Use a chromatic tone when the icon itself is the scan cue — do not wrap or
   * recolour the glyph at the call site.
   */
  tone?: DestinationListIconTone;
  disabled?: boolean;
  onClick?: () => void;
}

export interface DestinationListProps {
  items: DestinationListItem[];
  /** Shown in a single empty card when `items` is empty. */
  empty?: React.ReactNode;
  'aria-label'?: string;
  /** `card` is the original hub tile. `plain` is outlined icon + title + optional caption. `list` is a single column of rows. */
  appearance?: 'card' | 'plain' | 'list';
  /** Columns from the breakpoint up. Default follows appearance. Ignored for `list`. */
  columns?: 2 | 3 | 4;
}

export function DestinationList({
  items,
  empty,
  'aria-label': ariaLabel = 'Destinations',
  appearance = 'card',
  columns,
}: DestinationListProps) {
  const isList = appearance === 'list';
  const cols = columns ?? (appearance === 'plain' ? 3 : 2);
  const colClass =
    cols === 4
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      : cols === 3
        ? 'grid-cols-1 md:grid-cols-3'
        : 'grid-cols-1 sm:grid-cols-2';
  const listClass = isList
    ? 'flex flex-col divide-y divide-border'
    : `grid ${colClass} ${appearance === 'plain' ? 'gap-x-8 gap-y-4' : 'gap-4'}`;

  if (items.length === 0) {
    return (
      <div
        className={
          appearance === 'card'
            ? 'rounded-lg border border-border bg-surface px-5 py-10 text-center'
            : 'px-2 py-10 text-center'
        }
      >
        {empty ?? <p className="text-body-sm text-text-secondary">Nothing to show.</p>}
      </div>
    );
  }

  return (
    <nav aria-label={ariaLabel}>
      <ul className={`m-0 list-none p-0 ${listClass}`}>
        {items.map((item) => (
          <li key={item.id} className="min-w-0">
            {appearance === 'plain' ? (
              <PlainItem item={item} />
            ) : appearance === 'list' ? (
              <ListItem item={item} />
            ) : (
              <CardItem item={item} />
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

const ICON_TONE_CLASS: Record<DestinationListIconTone, string> = {
  neutral: 'text-icon-subtle',
  brand: 'text-icon-brand',
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
};

function iconClassName(item: DestinationListItem, fallback: string): string {
  if (item.disabled) return 'text-text-tertiary';
  return item.tone ? ICON_TONE_CLASS[item.tone] : fallback;
}

function CardItem({ item }: { item: DestinationListItem }) {
  return (
    <button
      type="button"
      disabled={item.disabled}
      onClick={item.disabled ? undefined : item.onClick}
      className={[
        'group flex h-full w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all',
        item.disabled
          ? 'cursor-default border-border bg-subtle'
          : 'border-border bg-surface hover:border-border-strong hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
      ].join(' ')}
    >
      {item.icon != null && (
        <Avatar
          icon={item.icon}
          name={item.title}
          size="md"
          className={item.disabled ? 'opacity-50' : undefined}
        />
      )}
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-body-medium ${
            item.disabled ? 'text-text-tertiary' : 'text-text-primary'
          }`}
        >
          {item.title}
        </span>
        {item.description ? (
          <span
            className={`mt-1 block line-clamp-2 text-caption ${
              item.disabled ? 'text-text-tertiary' : 'text-text-secondary'
            }`}
          >
            {item.description}
          </span>
        ) : null}
      </span>
      {!item.disabled && (
        <ChevronRight
          sx={{ fontSize: 20 }}
          className="mt-0.5 shrink-0 text-icon transition-transform group-hover:translate-x-0.5 group-hover:text-text-primary"
          aria-hidden
        />
      )}
    </button>
  );
}

function ListItem({ item }: { item: DestinationListItem }) {
  return (
    <button
      type="button"
      disabled={item.disabled}
      onClick={item.disabled ? undefined : item.onClick}
      className={[
        'group flex w-full items-center gap-3 px-1 py-3.5 text-left transition-colors',
        item.disabled
          ? 'cursor-default text-text-tertiary'
          : 'text-text-primary hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
      ].join(' ')}
    >
      {item.icon != null && (
        <span
          className={`inline-flex shrink-0 self-start mt-0.5 [&>svg]:block [&>svg]:h-6 [&>svg]:w-6 ${iconClassName(item, 'text-icon-subtle')}`}
          aria-hidden
        >
          {item.icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span
          className={`block text-body-medium ${
            item.disabled ? 'text-text-tertiary' : 'text-text-primary'
          }`}
        >
          {item.title}
        </span>
        {item.description ? (
          <span
            className={`mt-0.5 block text-caption ${
              item.disabled ? 'text-text-tertiary' : 'text-text-secondary'
            }`}
          >
            {item.description}
          </span>
        ) : null}
      </span>
      {item.actionLabel ? (
        <span
          aria-hidden
          className={`shrink-0 text-body-medium ${
            item.disabled ? 'text-text-tertiary' : 'text-text-link group-hover:underline'
          }`}
        >
          {item.actionLabel}
        </span>
      ) : null}
    </button>
  );
}

function PlainItem({ item }: { item: DestinationListItem }) {
  return (
    <button
      type="button"
      disabled={item.disabled}
      onClick={item.disabled ? undefined : item.onClick}
      className={[
        'flex w-full items-start gap-3 rounded-md px-2 py-3 text-left transition-colors',
        item.disabled
          ? 'cursor-default text-text-tertiary'
          : 'text-text-primary hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
      ].join(' ')}
    >
      {item.icon != null && (
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-surface [&>svg]:block [&>svg]:h-5 [&>svg]:w-5 ${
            item.disabled ? 'border-border text-text-tertiary' : `border-strong ${iconClassName(item, 'text-icon')}`
          }`}
          aria-hidden
        >
          {item.icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-card-title ${
            item.disabled ? 'text-text-tertiary' : 'text-text-primary'
          }`}
        >
          {item.title}
        </span>
        {item.description ? (
          <span
            className={`mt-0.5 block line-clamp-2 text-caption ${
              item.disabled ? 'text-text-tertiary' : 'text-text-secondary'
            }`}
          >
            {item.description}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export default DestinationList;
