'use client';

import * as React from 'react';
import { Checkbox } from '../Checkbox/Checkbox';

/**
 * SelectableList — a multi-select list of rows, each with a check box, optional
 * leading visual (badge/icon), primary label, secondary description, and trailing
 * content (a count pill, etc.). `tone` sets the accent: brand for additive picks,
 * danger for destructive ones. `variant` controls chrome: outlined (bordered cards)
 * or plain (borderless rows with spacing — better for dense action panels).
 */
export interface SelectableListItem {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  /** Leading visual (e.g. an app badge or icon). */
  leading?: React.ReactNode;
  /** Trailing content (e.g. a count pill). */
  trailing?: React.ReactNode;
  disabled?: boolean;
}
export interface SelectableListProps {
  items: SelectableListItem[];
  selected: Set<string> | string[];
  onToggle: (id: string) => void;
  /** Selected accent. @default 'brand' */
  tone?: 'brand' | 'danger';
  /**
   * Row chrome.
   * - `outlined` — bordered surface cards (default)
   * - `plain` — borderless rows with generous spacing; selection via fill + checkbox
   */
  variant?: 'outlined' | 'plain';
  /** Shown in place of the list when there are no items. */
  emptyMessage?: React.ReactNode;
  ariaLabel?: string;
}

export function SelectableList({
  items,
  selected,
  onToggle,
  tone = 'brand',
  variant = 'outlined',
  emptyMessage,
  ariaLabel,
}: SelectableListProps) {
  const sel = Array.isArray(selected) ? new Set(selected) : selected;
  if (items.length === 0 && emptyMessage != null) {
    return <div className="py-6 text-center text-caption text-text-secondary">{emptyMessage}</div>;
  }
  const plain = variant === 'plain';
  const selBorder = tone === 'danger' ? 'border-[var(--ds-color-status-danger-fg)]' : 'border-brand';
  const selFill =
    tone === 'danger'
      ? 'bg-[var(--ds-color-status-danger-subtle)]'
      : 'bg-brand-subtle';
  return (
    <div role="group" aria-label={ariaLabel} className={plain ? 'space-y-2' : 'space-y-1.5'}>
      {items.map((item) => {
        const on = sel.has(item.id);
        return (
          <button
            key={item.id}
            type="button"
            role="checkbox"
            aria-checked={on}
            disabled={item.disabled}
            onClick={() => onToggle(item.id)}
            className={[
              'flex w-full min-w-0 items-center gap-3 rounded-lg text-left transition-colors',
              'disabled:cursor-not-allowed disabled:opacity-50',
              plain
                ? [
                    'border border-transparent px-3 py-3',
                    on ? selFill : 'bg-surface hover:bg-surface-hover',
                  ].join(' ')
                : [
                    'border bg-surface px-3 py-2',
                    on ? selBorder : 'border-border hover:border-border-strong',
                  ].join(' '),
            ].join(' ')}
          >
            {/* Presentational — the row itself carries `role="checkbox"`. */}
            <Checkbox checked={on} tone={tone} presentational />
            {item.leading}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body-sm">{item.label}</span>
              {item.description != null && <span className="block truncate text-caption text-text-secondary">{item.description}</span>}
            </span>
            {item.trailing}
          </button>
        );
      })}
    </div>
  );
}

export default SelectableList;
