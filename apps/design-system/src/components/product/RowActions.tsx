'use client';

import * as React from 'react';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import { Tooltip } from '@ds/components';

/**
 * The two things a table row usually offers: see it, or take it out.
 *
 * ## Why not a kebab
 *
 * A `Menu` holding one or two items charges a click to discover how little was in it,
 * and it hides the row's most useful affordance — the details — because those read as
 * information rather than as an action. Both on the surface costs one click each and the
 * row stops being a mystery. A kebab still earns its place at four or five actions, or
 * where the actions are rare enough that surfacing them would out-shout the data.
 *
 * ## Order and colour
 *
 * Read before write: details first, remove last, so the destructive one is furthest from
 * where the eye lands and closest to the row's edge. Neither is coloured at rest —
 * `icon.subtle` for both — because a row of red bins reads as a warning about the data
 * rather than as something you may do to it. Remove finds its danger colour on hover,
 * at the point the pointer has committed to it.
 *
 * Both carry a tooltip *and* an `aria-label` naming the row, since an icon alone says
 * "info" without saying what about, and a screen-reader list of eight identical "Remove"
 * buttons is not navigable.
 */
export function RowActions({
  onInfo,
  infoLabel,
  infoTooltip = 'View details',
  onRemove,
  removeLabel,
  removeTooltip = 'Remove',
}: {
  onInfo: () => void;
  /** Names the row, e.g. `View details for AdministratorAccess`. */
  infoLabel: string;
  infoTooltip?: string;
  onRemove: () => void;
  /** Names the row, e.g. `Remove AdministratorAccess`. */
  removeLabel: string;
  removeTooltip?: string;
}) {
  const base =
    'rounded-md p-1 text-icon-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-subtle';
  return (
    <div className="flex items-center justify-end gap-0.5">
      <Tooltip title={infoTooltip}>
        <button
          type="button"
          // `stopPropagation` so these keep working if the row itself ever becomes
          // clickable — a row handler firing behind a delete is the kind of bug that
          // only shows up once the feature it breaks already shipped.
          onClick={(e) => {
            e.stopPropagation();
            onInfo();
          }}
          aria-label={infoLabel}
          className={`${base} hover:bg-surface-hover hover:text-text-brand`}
        >
          <InfoOutlined sx={{ fontSize: 18 }} />
        </button>
      </Tooltip>
      <Tooltip title={removeTooltip}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={removeLabel}
          className={`${base} hover:bg-surface-hover hover:text-danger`}
        >
          <DeleteOutline sx={{ fontSize: 18 }} />
        </button>
      </Tooltip>
    </div>
  );
}

export default RowActions;
