'use client';

import * as React from 'react';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { Avatar } from '../Avatar/Avatar';

/**
 * DestinationList — a grid of destination cards. Each card is one place to go:
 * an Avatar icon tile, a title, and a muted line of what lives there.
 *
 * Two columns from `sm` up (one on a narrow canvas). Cards share height in a
 * row so a short description does not leave its neighbour looking unfinished.
 * Radius is `lg` (12px) — the card token, not `xl`, so a compact row does not
 * read as a pill.
 *
 * The whole card is one target. Do not nest interactive elements inside an item.
 */
export interface DestinationListItem {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

export interface DestinationListProps {
  items: DestinationListItem[];
  /** Shown in a single empty card when `items` is empty. */
  empty?: React.ReactNode;
  'aria-label'?: string;
}

export function DestinationList({
  items,
  empty,
  'aria-label': ariaLabel = 'Destinations',
}: DestinationListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface px-5 py-10 text-center">
        {empty ?? <p className="text-body-sm text-text-secondary">Nothing to show.</p>}
      </div>
    );
  }

  return (
    <nav aria-label={ariaLabel}>
      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id} className="min-w-0">
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
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default DestinationList;
