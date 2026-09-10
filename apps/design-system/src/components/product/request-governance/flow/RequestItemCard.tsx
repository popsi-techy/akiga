'use client';

import * as React from 'react';
import { RISK_TIER_LABEL, riskTier } from '@/lib/risk';
import {
  RESOURCE_TYPE_LABEL,
  STAGE_LABEL,
  type GovernanceRequestItem,
  type ItemFlowProgress,
} from '@/data/request-governance';
import { FLOW_COLOR, StageStateChip, flowToneOf } from './flowVocabulary';

/**
 * One cart line in the rail — what it is, how far it has got, and how long is left.
 *
 * Four facts and no more. The rail's job is to let a reader pick the line worth looking
 * at; everything else about it is on the canvas the moment they do, and a card that tried
 * to answer the canvas's questions would make the reader read the same thing twice.
 *
 * The whole card is the control: it is a list row that happens to be drawn as a card, so
 * the affordance is the card, not a link inside it.
 */
export function RequestItemCard({
  item,
  progress,
  selected,
  onSelect,
}: {
  item: GovernanceRequestItem;
  progress: ItemFlowProgress;
  selected: boolean;
  onSelect: () => void;
}) {
  const { view, doneCount, total, complete, failed, slaStatus, slaClock } = progress;
  const stageId = view.currentStage;
  const tone = flowToneOf(complete ? 'done' : failed ? 'failed' : 'current', true, slaStatus);
  const risk = view.riskScore;

  // The phase by name, not by number. The bar already says how far along the line is, and
  // a second "Stage 2 of 4" here would be counting a different thing from the canvas
  // beside it — which numbers *approval levels* and refuses to claim a total at all.
  const footerLeft = complete ? 'Flow complete' : STAGE_LABEL[stageId];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
      className={[
        'w-full rounded-xl border p-4 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
        // The brand border is the whole selected signal — a lift as well made the card
        // look like it had left the rail it is a row of.
        selected ? 'border-brand bg-surface' : 'border-border bg-surface hover:border-border-strong',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 truncate text-body-strong text-text-primary" title={item.resourceName}>
          {item.resourceName}
        </span>
        <span className="shrink-0">
          <StageStateChip stageId={stageId} tone={tone} />
        </span>
      </div>

      <p className="mt-0.5 truncate text-caption text-text-secondary">
        {[
          RESOURCE_TYPE_LABEL[item.resourceType],
          `${RISK_TIER_LABEL[riskTier(risk)]} risk`,
          view.sodConflict ? 'SoD conflict' : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>

      {/* The bar is the card's one graphic, and it carries the same colour as the stage
          node it summarises — so a rail scanned at a glance and the canvas read closely
          never disagree about which line is in trouble. */}
      <div className="mt-3 h-1 w-full overflow-hidden rounded-pill bg-subtle">
        <div
          className="h-full rounded-pill transition-[width] duration-300 ease-out"
          style={{
            width: `${total ? (doneCount / total) * 100 : 0}%`,
            background: FLOW_COLOR[tone],
          }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 text-caption">
        <span className="min-w-0 truncate text-text-secondary">{footerLeft}</span>
        <span
          className="shrink-0 tabular-nums"
          style={{
            color:
              slaStatus === 'breached'
                ? 'var(--ds-color-status-danger-fg)'
                : slaStatus === 'at_risk'
                  ? 'var(--ds-color-status-warning-fg)'
                  : 'var(--ds-color-text-secondary)',
          }}
        >
          {complete ? 'SLA met' : slaClock}
        </span>
      </div>
    </button>
  );
}
