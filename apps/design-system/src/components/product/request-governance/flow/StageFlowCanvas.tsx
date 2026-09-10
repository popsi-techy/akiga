'use client';

import * as React from 'react';
import { Avatar } from '@ds/components';
import { formatDateTime } from '@/lib/datetime';
import {
  formatSlaClock,
  type ApprovalHop,
  type GovernanceRequest,
  type ItemFlowProgress,
  type LifecycleStage,
} from '@/data/request-governance';
import {
  FLOW_COLOR,
  StageStateChip,
  flowToneOf,
  stageActorLine,
  stageName,
  type FlowTone,
} from './flowVocabulary';

/**
 * The approval flow for one cart line, as a canvas.
 *
 * Top to bottom rather than left to right. A request's stages are a sequence in *time*,
 * and a column reads as one — a row would put the fourth stage off the right edge on any
 * screen narrow enough to matter, and a reader following a flow scrolls down without
 * being asked to.
 *
 * Nodes carry the decision, not just the state: "Approved" is a fact, "Approved by Vikram
 * Rao on 2 Sep, because he confirmed the role change" is evidence. Everything longer than
 * that lives in the stage panel, one click away.
 */
function ApproverRow({ hop }: { hop: ApprovalHop }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <Avatar name={hop.approver.name} size="s" kind="person" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-body-sm-strong text-text-primary">{hop.approver.name}</p>
        <p className="truncate text-caption text-text-secondary">
          {hop.approver.title ?? hop.label}
        </p>
        {/* Who the flow is waiting on is the one fact an operator came for, so it is on
            the node rather than only inside the panel. */}
        {hop.decidedAt ? (
          <p className="mt-1 text-caption text-text-secondary">
            {hop.decision === 'rejected' ? 'Rejected' : 'Approved'} {formatDateTime(hop.decidedAt)}
            {hop.note ? ` — “${hop.note}”` : ''}
          </p>
        ) : hop.state === 'current' || hop.decision === 'pending' ? (
          /* A dot, not blue text: blue is the product's text-control colour, and a
             sentence in it reads as a link to somewhere. */
          <p className="mt-1 flex items-center gap-1.5 text-caption-medium text-text-secondary">
            <span
              aria-hidden
              className="h-1.5 w-1.5 shrink-0 rounded-pill"
              style={{ background: 'var(--ds-color-status-info-fill)' }}
            />
            Waiting on this decision
          </p>
        ) : null}
      </div>
    </div>
  );
}

function StageBody({ stage, view }: { stage: LifecycleStage; view: GovernanceRequest }) {
  const hops = stage.hops ?? [];

  if (stage.id === 'approval' && hops.length > 0) {
    return (
      <div className="flex flex-col gap-3.5">
        {hops.map((hop) => (
          <ApproverRow key={hop.id} hop={hop} />
        ))}
      </div>
    );
  }

  if (stage.actor) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={stage.actor.name} size="s" kind="person" />
          <div className="min-w-0">
            <p className="truncate text-body-sm-strong text-text-primary">{stage.actor.name}</p>
            <p className="truncate text-caption text-text-secondary">
              {stage.actor.title ?? 'Requester'}
            </p>
          </div>
        </div>
        {stage.completedAt && (
          <p className="text-caption text-text-secondary">Completed {formatDateTime(stage.completedAt)}</p>
        )}
      </div>
    );
  }

  if (stage.id === 'provisioning' && view.failure) {
    return (
      <p className="text-body-sm" style={{ color: 'var(--ds-color-status-danger-fg)' }}>
        {view.failure.code} — {view.failure.message}
      </p>
    );
  }

  if (stage.note) return <p className="text-body-sm text-text-secondary">{stage.note}</p>;

  // A cart line that sits at a different stage from the request carries no record of its
  // own for the stages it has already passed — see `stagesAlignedTo`. Say that, rather
  // than borrow another line's note.
  return (
    <p className="text-body-sm text-text-tertiary">
      {stage.state === 'pending'
        ? 'Nothing has happened here yet.'
        : stage.state === 'current'
          ? 'In progress. Nothing recorded yet.'
          : 'Passed with nothing recorded against this item.'}
    </p>
  );
}

function StageNode({
  stage,
  index,
  total,
  tone,
  view,
  selected,
  onSelect,
}: {
  stage: LifecycleStage;
  index: number;
  total: number;
  tone: FlowTone;
  view: GovernanceRequest;
  selected: boolean;
  onSelect: () => void;
}) {
  const live = tone === 'current' || tone === 'risk' || tone === 'breached' || tone === 'failed';
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
      className={[
        'w-full rounded-xl border bg-surface p-5 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
        // Both signals are outlines, on the same 1px edge, so a node can only ever be
        // saying one of them: orange is *the node you are reading* (§5.1.3, selection) and
        // yellow is *the stage in play*. Selection wins when they land on the same node —
        // the flow already says which stage is live in its chip, and nothing else on the
        // board says which node the panel belongs to.
        selected ? 'border-brand' : live ? '' : 'border-border hover:border-border-strong',
      ].join(' ')}
      /* Inline rather than `border-[var(…)]`: an arbitrary border colour and the
         `border-border` utility land in an order Tailwind picks, and the utility has won
         that race before. */
      style={!selected && live ? { borderColor: 'var(--ds-color-status-warning-fill)' } : undefined}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-overline uppercase text-text-tertiary">
          Stage {index + 1} of {total}
        </span>
        <StageStateChip stageId={stage.id} tone={tone} />
      </div>

      <h3 className="mt-1.5 text-h5 text-text-primary">{stageName(stage.id)}</h3>
      <p className="text-caption text-text-secondary">{stageActorLine(stage)}</p>

      <div className="mt-4 border-t border-border-subtle pt-4">
        <StageBody stage={stage} view={view} />
      </div>

      {live && (
        <div className="mt-4 flex items-center justify-between gap-3 text-caption">
          <span className="text-text-secondary">SLA</span>
          <span
            className="tabular-nums"
            style={{
              color:
                tone === 'breached'
                  ? 'var(--ds-color-status-danger-fg)'
                  : tone === 'risk'
                    ? 'var(--ds-color-status-warning-fg)'
                    : 'var(--ds-color-text-secondary)',
            }}
          >
            {formatSlaClock(view)}
          </span>
        </div>
      )}
    </button>
  );
}

export function StageFlowCanvas({
  progress,
  selectedStageIndex,
  onSelectStage,
}: {
  progress: ItemFlowProgress;
  selectedStageIndex: number | null;
  onSelectStage: (index: number) => void;
}) {
  const { stages, view, slaStatus, currentStep } = progress;

  return (
    <div className="flex flex-col items-stretch">
      {stages.map((stage, i) => {
        const tone = flowToneOf(stage.state, currentStep === i + 1, slaStatus);
        return (
          <React.Fragment key={stage.id}>
            {i > 0 && (
              /* The rail between two nodes takes the colour of the stage above it, so the
                 line reads as "this much of the flow has happened". */
              <span
                aria-hidden
                className="ml-8 h-6 w-0.5 shrink-0"
                style={{
                  background:
                    stages[i - 1].state === 'done' || stages[i - 1].state === 'skipped'
                      ? FLOW_COLOR.done
                      : FLOW_COLOR.pending,
                }}
              />
            )}
            <StageNode
              stage={stage}
              index={i}
              total={stages.length}
              tone={tone}
              view={view}
              selected={selectedStageIndex === i}
              onSelect={() => onSelectStage(i)}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}
