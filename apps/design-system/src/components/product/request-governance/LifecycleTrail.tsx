'use client';

import * as React from 'react';
import { Avatar, StatusChip, type StatusIntent } from '@ds/components';
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

function markerClass(state: StageState): string {
  if (state === 'done') return 'bg-[var(--ds-color-status-success-fill)] text-white';
  if (state === 'current') return 'bg-brand text-brand-on';
  if (state === 'failed') return 'bg-[var(--ds-color-status-danger-fill)] text-white';
  if (state === 'skipped') return 'bg-[var(--ds-color-status-warning-fill)] text-white';
  return 'border border-border bg-surface text-text-tertiary';
}

function StageBlock({ stage, index }: { stage: LifecycleStage; index: number }) {
  const chip = STATE_CHIP[stage.state];
  const hops = stage.hops ?? [];
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {index < 3 && (
        <span
          aria-hidden
          className="absolute left-[15px] top-8 bottom-0 w-px bg-border"
        />
      )}
      <span
        className={[
          'relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-caption-strong',
          markerClass(stage.state),
        ].join(' ')}
      >
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
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
        {hops.length > 0 && (
          <ol className="mt-3 space-y-2">
            {hops.map((hop) => (
              <li
                key={hop.id}
                className="rounded-md border border-border bg-subtle px-3 py-2.5"
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
      </div>
    </li>
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
          <StageBlock key={stage.id} stage={stage} index={i} />
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
