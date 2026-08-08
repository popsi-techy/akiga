'use client';

import * as React from 'react';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import { Checkbox, Menu, Tooltip } from '@ds/components';
import type { EligibilityCondition, EligibilityGroup } from '@/data/eligibility-criteria';
import {
  eligibilityAttributeLabel,
  eligibilityGroupDisplayName,
  eligibilityValueLabel,
} from '@/data/eligibility-criteria';
import { ConditionPreviewChip } from '@/components/product/ConditionPreviewChip';
import { formatDateTime } from '@/components/product/sod/labels';

const FALLBACK_UPDATED_AT = '2020-08-12T12:23:00.000Z';

const PREVIEW_COUNT = 2;

/**
 * Nested corner radii: outer 2xl (16) + padding 12 → inner floor 4px so the
 * panel doesn’t look clipped against the shell.
 */
const OUTER_RADIUS = 'rounded-2xl';
const OUTER_PAD = 'p-3'; // 12px — also the basis of INNER_RADIUS below
const INNER_RADIUS = 'rounded-[max(4px,calc(var(--ds-radius-2xl)-12px))]';
const OUTER_RX = 16; // keep SVG dash outline in sync with rounded-2xl

/**
 * Shared floor for the group card and the add card so a grid row stays even.
 * Sized to the tallest preview we render — PREVIEW_COUNT chips plus the AND
 * badge (98px) on top of 138px of chrome — so two conditions never scroll.
 */
const CARD_MIN_H = 'min-h-[248px]';

/** Same chip treatment as workflow / user-filter condition previews. */
function ConditionChip({ condition }: { condition: EligibilityCondition }) {
  return (
    <ConditionPreviewChip
      className="w-full"
      attribute={eligibilityAttributeLabel(condition.attribute)}
      operator="="
      value={eligibilityValueLabel(condition.attribute, condition.value) || '…'}
    />
  );
}

function AndBadge() {
  return (
    <span className="inline-flex h-5 w-fit items-center justify-center self-start rounded px-1.5 text-micro uppercase leading-none tracking-wide text-[var(--ds-color-status-info-fg)] bg-[var(--ds-color-status-info-subtle)]">
      AND
    </span>
  );
}

export function EligibilityGroupCard({
  group,
  index,
  selected,
  onSelectChange,
  onEdit,
  onDelete,
}: {
  group: EligibilityGroup;
  index: number;
  selected: boolean;
  onSelectChange: (selected: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const title = eligibilityGroupDisplayName(group, index);
  const conditions = group.conditions;
  const preview = conditions.slice(0, PREVIEW_COUNT);
  const overflow = Math.max(0, conditions.length - PREVIEW_COUNT);

  return (
    <div
      className={[
        'flex h-full flex-col gap-2.5 border bg-subtle transition-all',
        'hover:shadow-sm',
        CARD_MIN_H,
        OUTER_RADIUS,
        OUTER_PAD,
        // No resting outline — the border stays transparent (not removed) so
        // selecting the card doesn't shift its size.
        selected ? 'border-brand' : 'border-transparent',
      ].join(' ')}
    >
      {/* Header — checkbox + name | overflow menu. The title is the one strong
          element on the card; everything below it recedes. */}
      <div className="flex h-7 shrink-0 items-center justify-between gap-2 pl-0.5">
        <div className="min-w-0" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selected}
            onChange={onSelectChange}
            ariaLabel={`Select ${title}`}
            label={<span className="block truncate text-body-strong text-text-primary">{title}</span>}
          />
        </div>
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <Menu
            ariaLabel={`${title} actions`}
            items={[
              { label: 'Edit', icon: <EditOutlined sx={{ fontSize: 18 }} />, onClick: onEdit },
              { label: 'Delete', icon: <DeleteOutline sx={{ fontSize: 18 }} />, danger: true, onClick: onDelete },
            ]}
          />
        </div>
      </div>

      {/* Inner white body — the card's "preview" surface; click opens the drawer. */}
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${title}`}
        className={[
          'flex min-h-0 flex-1 flex-col gap-2 border border-border bg-surface p-3 text-left transition-colors',
          'hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
          INNER_RADIUS,
        ].join(' ')}
      >
        {/* Quiet eyebrow label — same convention as the automation config panels. */}
        <div className="shrink-0 text-micro uppercase tracking-[0.07em] text-text-tertiary">
          {conditions.length} condition{conditions.length === 1 ? '' : 's'}
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {preview.map((c, i) => (
            <React.Fragment key={c.id}>
              {i > 0 && <AndBadge />}
              <ConditionChip condition={c} />
            </React.Fragment>
          ))}
          {overflow > 0 && (
            <span className="shrink-0 pt-0.5 text-caption-strong text-text-secondary">
              +{overflow} more
            </span>
          )}
        </div>
      </button>

      {/* Meta line — the quietest element, like Drive's "Modified …". */}
      <Tooltip title="Last modified time" placement="top">
        <div className="flex w-fit max-w-full shrink-0 cursor-default items-center gap-1.5 pl-0.5 text-caption text-text-secondary">
          <ScheduleOutlined sx={{ fontSize: 15 }} className="shrink-0 text-icon-subtle" aria-hidden />
          <span className="min-w-0 truncate">
            Modified {formatDateTime(group.updatedAt || FALLBACK_UPDATED_AT)}
          </span>
        </div>
      </Tooltip>
    </div>
  );
}

export function EligibilityAddCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'relative flex h-full flex-col bg-subtle text-left transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
        CARD_MIN_H,
        OUTER_RADIUS,
        OUTER_PAD,
      ].join(' ')}
    >
      {/* Custom dashed outline — dash 4 / gap 4 (CSS border-dashed can't set lengths). */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible text-border"
        aria-hidden
      >
        <rect
          x="0.5"
          y="0.5"
          width="99.7%"
          height="99.7%"
          rx={OUTER_RX}
          ry={OUTER_RX}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 4"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div
        className={[
          'relative flex min-h-0 flex-1 flex-col items-center justify-center border border-border-subtle bg-surface px-5 py-6',
          INNER_RADIUS,
        ].join(' ')}
      >
        <div className="flex w-full max-w-[240px] flex-col items-center gap-4 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-subtle text-icon">
            <AddIcon sx={{ fontSize: 26 }} />
          </span>
          <div className="flex w-full flex-col items-center gap-1.5">
            <span className="text-body-strong text-text-primary">
              Add Eligibility Criteria Group
            </span>
            <span className="text-caption leading-snug text-text-secondary">
              Emergency access is available to anyone who satisfies the eligibility rules of at least
              one group.
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default EligibilityGroupCard;
