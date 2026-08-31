'use client';

import * as React from 'react';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import DoneAllOutlined from '@mui/icons-material/DoneAllOutlined';
import RemoveDoneOutlined from '@mui/icons-material/RemoveDoneOutlined';
import { Button } from '../Button/Button';

/**
 * SelectionDock — a bottom-aligned floating card for bulk work.
 *
 * DataTable's first-row banner is the v1 of “something is selected”: it lives
 * inside the table, so it steals a row and hides the moment you page away.
 * This card sits on the page, bottom-center, and holds the count, select-all,
 * and the actions that apply to the selection.
 *
 * Why MUI was insufficient: there is no Snackbar/Alert that is a selection
 * surface. A snackbar is feedback; this is a control. Building it from Card
 * would force a header the dock does not have.
 *
 * Overlay only: `absolute` + out of flow, so it never grows or shrinks the
 * table. Sit it in a `relative` ancestor that is the work surface (not the
 * viewport), so the sidebar is never covered.
 *
 * Chrome is a compact inverse toolbar: `background.sidebar` (same as the
 * navbar) so it lifts off the light table. Count in a white badge, hairline
 * separators, tertiary buttons in inverse text — not a padded action card.
 */
export interface SelectionDockProps {
  open: boolean;
  /** How many rows in the current set are selected. */
  count: number;
  /** How many rows the current set has — used for “Select all”. */
  total: number;
  noun: string;
  nounPlural?: string;
  allSelected: boolean;
  onSelectAll: () => void;
  onClear: () => void;
  /** Bulk actions — typically tertiary `xs` `Button`s. */
  children?: React.ReactNode;
}

function Separator() {
  return <span className="h-4 border-l border-border-strong" aria-hidden />;
}

/** Text controls on the inverse chrome — tertiary Button defaults assume a light surface. */
const inverseControlSx = {
  color: 'var(--ds-color-text-inverse)',
  '& .MuiButton-startIcon': { color: 'var(--ds-color-text-inverse)' },
  '&:hover': {
    color: 'var(--ds-color-text-inverse)',
    backgroundColor: 'var(--ds-color-surface-inverse)',
  },
} as const;

function invertActions(node: React.ReactNode): React.ReactNode {
  return React.Children.map(node, (child) => {
    if (!React.isValidElement(child)) return child;
    if (child.type === React.Fragment) {
      return invertActions((child.props as { children?: React.ReactNode }).children);
    }
    const props = child.props as { sx?: object };
    return React.cloneElement(child as React.ReactElement<{ sx?: object }>, {
      sx: { ...props.sx, ...inverseControlSx },
    });
  });
}

export function SelectionDock({
  open,
  count,
  total,
  noun,
  nounPlural,
  allSelected,
  onSelectAll,
  onClear,
  children,
}: SelectionDockProps) {
  const plural = nounPlural ?? `${noun}s`;
  const label = count === 1 ? noun : plural;
  const shown = allSelected ? total : count;

  if (!open) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-6 z-raised flex justify-center px-4"
      role="region"
      aria-label={`${shown} ${label} selected`}
    >
      <div className="pointer-events-auto flex max-w-full items-center gap-2 rounded-md bg-sidebar px-2 py-2 shadow-lg">
        <p className="flex items-center gap-1 text-body-sm text-text-inverse" role="status">
          <span className="inline-flex min-h-5 items-center justify-center rounded-sm bg-surface px-2 text-caption-strong text-text-primary tabular-nums">
            {shown}
          </span>
          selected
        </p>
        <Button
          variant="tertiary"
          size="xs"
          startIcon={allSelected ? <RemoveDoneOutlined /> : <DoneAllOutlined />}
          onClick={allSelected ? onClear : onSelectAll}
          sx={inverseControlSx}
        >
          {allSelected
            ? `Deselect all ${total} ${total === 1 ? noun : plural}`
            : `Select all ${total} ${total === 1 ? noun : plural}`}
        </Button>
        {children && (
          <>
            <Separator />
            <div className="flex shrink-0 items-center gap-1">{invertActions(children)}</div>
          </>
        )}
        <Separator />
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-icon-inverse hover:bg-surface-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
        >
          <CloseOutlined sx={{ fontSize: 16 }} aria-hidden />
        </button>
      </div>
    </div>
  );
}
