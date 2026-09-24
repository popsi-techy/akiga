'use client';

import * as React from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import { Button } from '../Button/Button';
import { Tooltip } from '../Tooltip/Tooltip';
import type { OverflowChipItem } from '../OverflowChips/OverflowChips';

export type ChipPickerItem = OverflowChipItem;

export interface ChipPickerProps {
  /** What has been chosen. Empty renders Add; anything else renders the capsule. */
  items: ChipPickerItem[];
  /** Empty-state button label. Names what will be added — “Add Types”, “Add policy”. */
  addLabel: string;
  /**
   * Accessible name for the filled capsule. Include what is chosen, then the
   * verb — “Approval policy: Joiner Access Approval. Edit.”
   */
  editLabel: string;
  /** Opens the drawer (or the other editor) in both states. */
  onClick: () => void;
  /** How many to name before collapsing the rest into +n. @default 1 */
  max?: number;
  /** Tooltip on the filled capsule. @default 'Edit' */
  tooltip?: string;
  disabled?: boolean;
}

const CHIP =
  'inline-flex min-w-0 items-center rounded-sm bg-subtle px-2 py-1 text-caption-medium text-text-primary';

/**
 * ChipPicker — the settings-row control for a set chosen elsewhere.
 *
 * Empty is an Add button. Filled is one clickable capsule: the first name,
 * a +n, and a pencil. Those are one control, not a chip plus a separate
 * icon — the reader should not have to work out which of two things edits.
 *
 * The choosing itself happens in a Drawer. This is only the answer and the
 * way back in. PickerSlot is the same job as a full row (icon, title, hint)
 * on a wizard step; this is the compact form that sits on the right of a
 * SettingsRow, next to a Select.
 *
 * Width is fixed (`w-48`, the same as the Select beside it on identity
 * classification) so Add and the capsule do not jump when the first item
 * lands.
 */
export function ChipPicker({
  items,
  addLabel,
  editLabel,
  onClick,
  max = 1,
  tooltip = 'Edit',
  disabled = false,
}: ChipPickerProps) {
  if (items.length === 0) {
    return (
      <Button
        variant="secondary"
        size="sm"
        className="w-48"
        sx={{ justifyContent: 'flex-start' }}
        startIcon={<AddOutlined />}
        onClick={onClick}
        disabled={disabled}
      >
        {addLabel}
      </Button>
    );
  }

  const shown = items.slice(0, max);
  const rest = items.slice(max);

  const capsule = (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-label={editLabel}
      aria-disabled={disabled || undefined}
      className={[
        'group flex h-9 w-48 items-center justify-between gap-1.5 rounded-md border border-border bg-surface pl-1.5 pr-2 text-left transition-colors',
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'hover:border-border-strong hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
      ].join(' ')}
    >
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        {shown.map((item) => (
          <span key={item.id} className={CHIP} title={item.name}>
            <span className="truncate">{item.name}</span>
          </span>
        ))}
        {rest.length > 0 && (
          <span
            className="shrink-0 whitespace-nowrap text-caption-medium text-text-secondary"
            title={rest.map((item) => item.name).join(', ')}
          >
            +{rest.length}
          </span>
        )}
      </span>
      <EditOutlined
        className={
          disabled
            ? 'shrink-0 text-icon'
            : 'shrink-0 text-icon transition-colors group-hover:text-text-primary'
        }
        sx={{ fontSize: 15 }}
      />
    </button>
  );

  if (disabled) return capsule;
  return (
    <Tooltip title={tooltip} describeChild>
      {capsule}
    </Tooltip>
  );
}

export default ChipPicker;
