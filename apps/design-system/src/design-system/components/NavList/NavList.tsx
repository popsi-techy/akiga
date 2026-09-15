'use client';

import * as React from 'react';

/**
 * NavList — a vertical single-select list of navigable sections/views, each with
 * an optional leading icon and trailing count. The active item gets a brand
 * outline + tint (and a filled count pill); inactive items are quiet
 * with a hover fill. Icons stay `icon.default` in both states — selection is
 * already the outline and the pill, and a second brand colour on the mark
 * restates it. Used for in-panel section switchers: owner/group toggles,
 * settings sections, entity sub-views.
 *
 * An item can carry a second control — a kebab of row actions, most often. That control
 * is a sibling of the select button, never a child of it: a button inside a button is
 * invalid HTML and React refuses to hydrate it. The row is a container, the label is the
 * tab, and the action sits beside it on its own.
 */
export interface NavListItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  /** Shorthand for the usual trailing thing: a count, as a pill. */
  count?: number;
  /**
   * Anything else on the trailing edge — a status chip, a short reading. Replaces
   * `count`; a row has one trailing slot, and two things fighting for the same edge is
   * how a switcher stops being scannable.
   */
  trailing?: React.ReactNode;
  /**
   * A control that acts on this row rather than selecting it — a `Menu` kebab, usually.
   * Rendered outside the tab button, so it keeps its own click target and its own name.
   */
  action?: React.ReactNode;
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
        /* The padding belongs to the button, not to the row around it, so the whole of an
           item is a click target rather than a label with a dead 10px margin. All the row
           gives up for an action is its right gutter — the action brings its own. */
        const withAction = item.action != null;
        return (
          <div
            key={item.id}
            className={[
              'flex w-full items-center gap-2 rounded-md border transition-colors',
              withAction ? 'pr-0.5' : '',
              active
                ? 'border-brand bg-surface text-text-primary'
                : 'border-transparent text-text-primary hover:bg-surface-hover',
            ].join(' ')}
          >
            <button
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.id)}
              className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left text-body-sm-medium"
            >
              {item.icon && (
                <span
                  aria-hidden
                  className="grid h-[18px] w-[18px] shrink-0 place-items-center text-icon [&>svg]:block"
                >
                  {item.icon}
                </span>
              )}
              {/* The label truncates, so a plain-text one carries its own full reading. A
                  switcher whose rows are long names — "Account Entitlement Revocation",
                  the same thing again with a suffix — cuts exactly the part that tells
                  them apart, and no width short of the longest name fixes that. Hover
                  gives it back. Nodes are left alone: their own markup owns their title. */}
              <span
                className="min-w-0 flex-1 truncate"
                title={typeof item.label === 'string' ? item.label : undefined}
              >
                {item.label}
              </span>
              {item.trailing != null
                ? item.trailing
                : item.count != null && (
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
            {item.action}
          </div>
        );
      })}
    </div>
  );
}

export default NavList;
