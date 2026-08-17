'use client';

import * as React from 'react';
import EditOutlined from '@mui/icons-material/EditOutlined';

export interface PickerSlotProps {
  /** Outlined, 22px (`sx={{ fontSize: 22 }}`) — it sits in an 44px tinted tile. */
  icon: React.ReactNode;
  /** What is here, or what is missing. The line the reader scans. */
  title: string;
  /** Why it matters, or what editing will change. Never a restatement of the title. */
  hint: string;
  /**
   * The control for an empty slot — normally a `secondary` Button whose label
   * names what will be added.
   *
   * Pass this **or** `onEdit`, not both: an empty slot needs a control that says
   * how to start, and a filled one needs a way to change what is there. Giving a
   * slot two controls means the reader has to work out which applies.
   */
  action?: React.ReactNode;
  /**
   * The control for a filled slot. Renders the standard pencil so every filled
   * slot in the product offers editing the same way.
   */
  onEdit?: () => void;
  /** Accessible name for the pencil, e.g. "Edit applications". Required with `onEdit`. */
  editLabel?: string;
  /**
   * What has been chosen, named beside the control — usually `OverflowChips`.
   * Absent while empty.
   */
  summary?: React.ReactNode;
}

/**
 * PickerSlot — one row standing in for a collection chosen elsewhere.
 *
 * The answer to "this step picks a set of things, and the set does not belong on
 * the step". A wizard step or a settings panel states what is chosen and offers
 * the one control that changes it; the choosing itself happens in a Drawer, where
 * there is room for search, paging and a selection panel.
 *
 * **One row in both states.** The count and the chips replace the "nothing
 * chosen" copy in place, so the step does not change shape under the reader the
 * moment they pick something — no card growing into a table, no button moving.
 * That is the property to protect when extending this: a filled slot that lays
 * out differently from an empty one defeats the point.
 *
 * Use it instead of embedding the real table when the surface is narrow — a
 * two-pane rail-and-table editor squeezed into a wizard column scrolls
 * horizontally and clips its own copy, and none of that detail is what the step
 * is asking about. Use the table itself on a detail page, where the collection is
 * the subject rather than one answer among six.
 */
export function PickerSlot({
  icon,
  title,
  hint,
  action,
  onEdit,
  editLabel,
  summary,
}: PickerSlotProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-surface px-5 py-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-subtle text-icon-brand">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-body-strong text-text-primary">{title}</div>
        <p className="mt-0.5 text-body-sm text-text-secondary">{hint}</p>
      </div>
      {/* Hidden on the narrowest screens: the count in the title still says how
          many, and naming them is worth less than keeping the row one line. */}
      {summary && <div className="hidden shrink-0 sm:block">{summary}</div>}
      <div className="shrink-0">
        {action ??
          (onEdit && (
            /* Bare, not boxed. A second outlined control beside the summary reads
               as a second button competing with the step's own primary action,
               and the pencil is a change to what is already decided. */
            <button
              type="button"
              aria-label={editLabel}
              onClick={onEdit}
              className="grid h-8 w-8 place-items-center rounded-md text-icon transition-colors hover:bg-surface-hover hover:text-text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
            >
              <EditOutlined sx={{ fontSize: 18 }} />
            </button>
          ))}
      </div>
    </div>
  );
}

export default PickerSlot;
