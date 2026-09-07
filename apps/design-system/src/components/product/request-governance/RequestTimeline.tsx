'use client';

import * as React from 'react';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import AutorenewOutlined from '@mui/icons-material/AutorenewOutlined';
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';
import RemoveCircleOutlineOutlined from '@mui/icons-material/RemoveCircleOutlineOutlined';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import { Avatar, StatusChip, type StatusIntent } from '@ds/components';
import { TimelineItem, type TimelineTone } from '@/components/product/TimelineRail';
import {
  STAGE_LABEL,
  formatGovDateTime,
  type GovernanceRequest,
  type LifecycleStage,
  type StageState,
} from '@/data/request-governance';

const STATE_CHIP: Record<StageState, { label: string; intent: StatusIntent }> = {
  done: { label: 'Done', intent: 'success' },
  current: { label: 'In progress', intent: 'info' },
  failed: { label: 'Failed', intent: 'danger' },
  pending: { label: 'Waiting', intent: 'neutral' },
  skipped: { label: 'Skipped', intent: 'warning' },
};

/**
 * The node for a stage: its icon and tone come from the state, so the marker, the chip
 * and the connector can never tell three different stories about one stage.
 *
 * A number in the circle said only where the stage sat in the list, which the order
 * already says. An icon says what happened to it.
 */
function stageNode(state: StageState): { icon: React.ReactNode; tone: TimelineTone } {
  const sx = { fontSize: 18 } as const;
  if (state === 'done') return { icon: <CheckCircleOutlined sx={sx} />, tone: 'success' };
  if (state === 'current') return { icon: <AutorenewOutlined sx={sx} />, tone: 'info' };
  if (state === 'failed') return { icon: <ErrorOutlineOutlined sx={sx} />, tone: 'danger' };
  if (state === 'skipped') return { icon: <RemoveCircleOutlineOutlined sx={sx} />, tone: 'warning' };
  return { icon: <ScheduleOutlined sx={sx} />, tone: 'neutral' };
}

function StageBlock({
  stage,
  first,
  last,
}: {
  stage: LifecycleStage;
  first: boolean;
  last: boolean;
}) {
  const chip = STATE_CHIP[stage.state];
  const hops = stage.hops ?? [];
  const node = stageNode(stage.state);
  return (
    <TimelineItem icon={node.icon} tone={node.tone} first={first} last={last}>
      {/* Each stage is a card, as in the SoD review timeline — it groups the stage's
          times, actor, note and approval hops into one object instead of leaving them as
          loose lines that belong to whichever heading is nearest above. */}
      <article className="rounded-xl bg-subtle p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-body-sm-strong text-text-primary">{STAGE_LABEL[stage.id]}</h3>
          <StatusChip intent={chip.intent} dot={false} label={chip.label} />
        </div>
        <p className="mt-1 text-caption text-text-secondary">
          {stage.startedAt ? `Started ${formatGovDateTime(stage.startedAt)}` : 'Not started'}
          {stage.completedAt ? ` · Finished ${formatGovDateTime(stage.completedAt)}` : ''}
          {stage.actor ? ` · ${stage.actor.name}` : ''}
        </p>
        {stage.note && <p className="mt-2 text-body-sm text-text-secondary">{stage.note}</p>}
        {/* Hops are white on the card's grey: they used to be a grey well on a white
            page, and the stage card has taken that grey, which would have left them
            invisible against their own container. */}
        {hops.length > 0 && (
          <ol className="mt-3 space-y-2">
            {hops.map((hop) => (
              <li
                key={hop.id}
                className="rounded-md border border-border bg-surface px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={hop.approver.name} size="s" />
                    <div className="min-w-0">
                      <div className="truncate text-body-sm-strong text-text-primary">{hop.approver.name}</div>
                      <div className="truncate text-caption text-text-secondary">
                        {hop.label}
                        {hop.approver.title ? ` · ${hop.approver.title}` : ''}
                      </div>
                    </div>
                  </div>
                  <StatusChip
                    intent={
                      hop.decision === 'approved'
                        ? 'success'
                        : hop.decision === 'rejected'
                          ? 'danger'
                          : hop.state === 'current'
                            ? 'info'
                            : 'neutral'
                    }
                    dot={false}
                    label={
                      hop.decision === 'approved'
                        ? 'Approved'
                        : hop.decision === 'rejected'
                          ? 'Rejected'
                          : hop.state === 'current'
                            ? 'Waiting'
                            : 'Queued'
                    }
                  />
                </div>
                {hop.decidedAt && (
                  <p className="mt-1.5 text-caption text-text-secondary">{formatGovDateTime(hop.decidedAt)}</p>
                )}
                {hop.note && <p className="mt-1 text-body-sm text-text-secondary">{hop.note}</p>}
              </li>
            ))}
          </ol>
        )}
      </article>
    </TimelineItem>
  );
}

export function LifecycleTrail({ row }: { row: GovernanceRequest }) {
  return (
    <section>
      <h2 className="text-body-strong text-text-primary">Lifecycle</h2>
      <p className="mt-1 text-caption text-text-secondary">
        Submission through provisioning. Times, people, and notes stay with the stage they belong to.
      </p>
      <ol className="mt-4">
        {row.stages.map((stage, i) => (
          <StageBlock
            key={stage.id}
            stage={stage}
            first={i === 0}
            last={i === row.stages.length - 1}
          />
        ))}
      </ol>
    </section>
  );
}

export function AuditTrail({ row }: { row: GovernanceRequest }) {
  return (
    <section>
      <h2 className="text-body-strong text-text-primary">Audit trail</h2>
      <p className="mt-1 text-caption text-text-secondary">Read-only telemetry, newest first.</p>
      <ol className="mt-3 divide-y divide-border rounded-md border border-border bg-surface">
        {row.audit.map((event) => (
          <li key={event.id} className="px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-body-sm-strong text-text-primary">{event.action}</div>
                <p className="mt-0.5 text-caption text-text-secondary">{event.detail}</p>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-caption text-text-secondary">{event.actor}</div>
                <div className="mt-0.5 tabular-nums text-caption text-text-tertiary">
                  {formatGovDateTime(event.at)}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
