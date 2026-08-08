'use client';

import * as React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import HighlightAltOutlined from '@mui/icons-material/HighlightAltOutlined';

/**
 * SelectionPanel — the "what you've selected" side panel used inside selection
 * drawers (e.g. Add Owners, Select Accounts). Shows a count + Clear all, a
 * removable chip per selected item, and an empty state when nothing is selected.
 * Pair it with a `DataTable` using controlled `selectedIds`.
 */
export interface SelectionItem {
  id: string;
  label: React.ReactNode;
  sublabel?: React.ReactNode;
  icon?: React.ReactNode;
}

export interface SelectionPanelProps {
  title: string;
  items: SelectionItem[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  /** Builds the "N X selected" line. Defaults to "N selected". */
  countLabel?: (n: number) => string;
  emptyTitle?: string;
  emptyMessage?: string;
}

export function SelectionPanel({
  title,
  items,
  onRemove,
  onClearAll,
  countLabel,
  emptyTitle = 'Nothing selected yet',
  emptyMessage = 'Select items from the list and they’ll appear here.',
}: SelectionPanelProps) {
  const n = items.length;

  return (
    <div className="flex h-full flex-col">
      <h3 className="mb-3 shrink-0 text-h5 text-text-primary">{title}</h3>

      {n === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-subtle text-icon">
            <HighlightAltOutlined sx={{ fontSize: 24 }} />
          </span>
          <div className="text-body-strong text-text-primary">{emptyTitle}</div>
          <p className="max-w-[220px] text-caption leading-5 text-text-secondary">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="mb-3 flex shrink-0 items-center justify-between">
            <span className="text-body-sm text-text-secondary">
              {countLabel ? countLabel(n) : `${n} selected`}
            </span>
            <button
              type="button"
              onClick={onClearAll}
              className="text-body-sm-strong text-text-brand hover:underline"
            >
              Clear all
            </button>
          </div>

          <div className="ds-scroll flex-1 space-y-2 overflow-y-auto pr-0.5">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2.5 rounded-md bg-subtle px-3 py-2"
              >
                {item.icon}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-body-sm text-text-primary">{item.label}</div>
                  {item.sublabel && (
                    <div className="truncate text-caption text-text-secondary">{item.sublabel}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  aria-label={`Remove ${typeof item.label === 'string' ? item.label : 'item'}`}
                  className="shrink-0 rounded-sm p-1 text-icon hover:bg-surface-hover"
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default SelectionPanel;
