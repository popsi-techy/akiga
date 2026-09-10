'use client';

import * as React from 'react';
import { StatusChip, type StatusIntent } from '@ds/components';
import {
  STAGE_LABEL,
  type ApprovalHop,
  type LifecycleStage,
  type LifecycleStageId,
  type SlaStatus,
  type StageState,
} from '@/data/request-governance';

/**
 * One vocabulary for the flow board — the rail card, the canvas node and the stage panel
 * all name a stage's condition from here.
 *
 * Three surfaces describing the same stage in three different words is how a board starts
 * telling a reader that a stage is "In review" in one place and "Waiting" in another.
 */

/** The condition a node is drawn in. `risk` is `current` with its SLA in trouble. */
export type FlowTone = 'done' | 'current' | 'risk' | 'breached' | 'pending' | 'failed' | 'skipped';

/** The connector and progress-bar colour per condition. Status colour on a status object only. */
export const FLOW_COLOR: Record<FlowTone, string> = {
  done: 'var(--ds-color-status-success-fill)',
  current: 'var(--ds-color-status-info-fill)',
  risk: 'var(--ds-color-status-warning-fill)',
  breached: 'var(--ds-color-status-danger-fill)',
  pending: 'var(--ds-color-border-strong)',
  failed: 'var(--ds-color-status-danger-fill)',
  skipped: 'var(--ds-color-border-strong)',
};

const TONE_INTENT: Record<FlowTone, StatusIntent> = {
  done: 'success',
  current: 'info',
  risk: 'warning',
  breached: 'danger',
  pending: 'neutral',
  failed: 'danger',
  skipped: 'neutral',
};

/**
 * What "done" and "in play" are called at each stage.
 *
 * A single pair of words cannot cover the flow: the provisioning stage finishing is not
 * "Approved", and the policy engine running is not "In review" — nobody is reviewing it.
 */
const DONE_LABEL: Record<LifecycleStageId, string> = {
  submission: 'Submitted',
  policy: 'Cleared',
  approval: 'Approved',
  provisioning: 'Provisioned',
};

const CURRENT_LABEL: Record<LifecycleStageId, string> = {
  submission: 'Open',
  policy: 'Evaluating',
  approval: 'In review',
  provisioning: 'Provisioning',
};

/** The line under a node's name — who or what decides it. */
export function stageActorLine(stage: LifecycleStage): string {
  if (stage.id === 'approval') {
    const hops = stage.hops ?? [];
    if (hops.length === 0) return 'No approvers configured';
    return hops.length === 1 ? 'Single approver' : `${hops.length} approvers, in order`;
  }
  if (stage.id === 'submission') return 'Requester';
  return 'Automated';
}

export function flowToneOf(state: StageState, isCurrent: boolean, sla: SlaStatus): FlowTone {
  if (state === 'failed') return 'failed';
  if (state === 'skipped') return 'skipped';
  if (state === 'done') return 'done';
  if (state === 'current' || isCurrent) {
    if (sla === 'breached') return 'breached';
    if (sla === 'at_risk') return 'risk';
    return 'current';
  }
  return 'pending';
}

export function stageStateLabel(stageId: LifecycleStageId, tone: FlowTone): string {
  if (tone === 'done') return DONE_LABEL[stageId];
  if (tone === 'failed') return 'Failed';
  if (tone === 'skipped') return 'Skipped';
  if (tone === 'pending') return 'Not reached';
  if (tone === 'risk') return 'SLA at risk';
  if (tone === 'breached') return 'SLA breached';
  return CURRENT_LABEL[stageId];
}

export function StageStateChip({ stageId, tone }: { stageId: LifecycleStageId; tone: FlowTone }) {
  return <StatusChip intent={TONE_INTENT[tone]} label={stageStateLabel(stageId, tone)} />;
}

/** The stage's own name, e.g. `Policy / SoD Check`. */
export const stageName = (id: LifecycleStageId) => STAGE_LABEL[id];

// ---- approval levels ---------------------------------------------------

/**
 * The condition of one approval level.
 *
 * Separate from the lifecycle-stage vocabulary above because the two answer different
 * questions: a stage is a phase of the request, a level is a decision somebody owes. A
 * level is never "Not reached" on the canvas — an undecided future level is not drawn at
 * all (see `visibleApprovalLevels`).
 */
export function levelToneOf(hop: ApprovalHop, sla: SlaStatus): FlowTone {
  if (hop.decision === 'rejected') return 'failed';
  if (hop.decision === 'approved') return 'done';
  if (sla === 'breached') return 'breached';
  if (sla === 'at_risk') return 'risk';
  return 'current';
}

export function levelStateLabel(tone: FlowTone): string {
  if (tone === 'done') return 'Approved';
  if (tone === 'failed') return 'Rejected';
  if (tone === 'skipped') return 'Skipped';
  if (tone === 'risk') return 'SLA at risk';
  if (tone === 'breached') return 'SLA breached';
  return 'In review';
}

export function LevelStateChip({ tone }: { tone: FlowTone }) {
  return <StatusChip intent={TONE_INTENT[tone]} label={levelStateLabel(tone)} />;
}

/**
 * The line under a level's name.
 *
 * One approver per level in this model, so it is always the singular. It stays a function
 * rather than a literal because an "any 1 of 2" level is the next thing this will need to
 * say, and the call sites should not have to learn about it.
 */
export function levelApproverLine(_hop: ApprovalHop): string {
  return 'Single approver';
}
