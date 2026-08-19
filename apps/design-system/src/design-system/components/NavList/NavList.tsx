'use client';

import * as React from 'react';

/**
 * NavList — a vertical single-select list of navigable sections/views, each with
 * an optional leading icon and trailing count. The active item gets a brand
 * outline + tint + brand text (and a filled count pill); inactive items are quiet
 * with a hover fill. Used for in-panel section switchers: owner/group toggles,
 * settings sections, entity sub-views.
 */
export interface NavListItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  count?: number;
}
export interface NavListProps {
  items: NavListItem[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
}

export function NavList({ items, value, onChange, ariaLabel }: NavListProps) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex flex-col gap-1">
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={[
              'flex w-full items-center gap-2.5 rounded-md border px-3 py-2.5 text-left text-body-sm-medium transition-colors',
              active ? 'border-brand bg-surface text-text-primary' : 'border-transparent text-text-primary hover:bg-surface-hover',
            ].join(' ')}
          >
            {item.icon && <span className={active ? 'text-brand-active' : 'text-icon'}>{item.icon}</span>}
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.count != null && (
              <span
                className={[
                  'shrink-0 rounded-pill px-2 py-0.5 text-caption-medium',
                  active ? 'bg-brand text-brand-on' : 'bg-subtle text-text-secondary',
                ].join(' ')}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default NavList;
