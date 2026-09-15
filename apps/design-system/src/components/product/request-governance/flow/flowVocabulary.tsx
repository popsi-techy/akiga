'use client';

import * as React from 'react';
import { StatusChip, type StatusIntent } from '@ds/components';
import {
  approvalFlowComplete,
  approvalLevels,
  hopApprovers,
  requiredApprovalCount,
  type ApprovalDecision,
  type ApprovalHop,
  type GovernanceRequest,
  type SlaStatus,
} from '@/data/request-governance';

/**
 * One vocabulary for the flow board — the rail card, the canvas node and the level panel
 * all name a condition from here.
 *
 * Three surfaces describing the same thing in three different words is how a board starts
 * telling a reader that a level is "In review" in one place and "Waiting" in another.
 *
 * **Pending** is the word for "nobody has answered yet", everywhere. The request header
 * counts these as pending, so a cart line calling itself "In review" and a level calling
 * itself the same thing were two more names for the number at the top of the page.
 */

/** The condition a node is drawn in. `risk` is `current` with its SLA in trouble. */
export type FlowTone = 'done' | 'current' | 'risk' | 'breached' | 'pending' | 'failed' | 'skipped';

/**
 * The connector and progress-bar colour per condition. Status colour on a status object only.
 *
 * `current` is amber, not info blue. Blue is this product's link colour and its taxonomy
 * tint, so a blue pill in a card full of controls reads as something to click. Amber also
 * matches the outline the canvas already draws around the level that is deciding now, so a
 * live level and its own chip stop disagreeing about their colour.
 *
 * The cost, accepted deliberately: `current` and `risk` are now the same hue, so "Pending"
 * and "SLA at risk" are told apart by their words rather than by their colour, and the rail
 * escalates yellow → red instead of blue → amber → red.
 *
 * `current` takes `warning.solid` — true yellow — rather than `warning.fill`, which is the
 * amber step the ramp keeps precisely because yellow cannot reach 3:1 on white. Also at the
 * owner's direction, and the same trade: these marks sit at roughly 1.4:1 on a white rail,
 * so they read as a tint rather than as a line with an edge. Every one of them is
 * accompanied by a word — the chip beside the bar, the label beside the node — so the
 * colour is never the only carrier of the state. `risk` and `breached` keep their own
 * colours, which do clear the floor.
 */
export const FLOW_COLOR: Record<FlowTone, string> = {
  done: 'var(--ds-color-status-success-fill)',
  current: 'var(--ds-color-status-warning-solid)',
  risk: 'var(--ds-color-status-warning-fill)',
  breached: 'var(--ds-color-status-danger-fill)',
  pending: 'var(--ds-color-border-strong)',
  failed: 'var(--ds-color-status-danger-fill)',
  skipped: 'var(--ds-color-border-strong)',
};

const TONE_INTENT: Record<FlowTone, StatusIntent> = {
  done: 'success',
  current: 'warning',
  risk: 'warning',
  breached: 'danger',
  pending: 'neutral',
  failed: 'danger',
  skipped: 'neutral',
};

/** A chip in a flow tone, with the caller's own word. */
export function ToneChip({ tone, label }: { tone: FlowTone; label: string }) {
  return <StatusChip intent={TONE_INTENT[tone]} label={label} />;
}

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
  return 'Pending';
}

export function LevelStateChip({ tone }: { tone: FlowTone }) {
  return <StatusChip intent={TONE_INTENT[tone]} label={levelStateLabel(tone)} />;
}

/**
 * The line under a level's name — how many people it takes, and how many of them.
 *
 * Phrased in the approval-policy builder's own words: a level configured as "Any one
 * approver" there should not read as "1 of 2 required" here. The count comes with it,
 * because "Any one" without a denominator hides how many people were asked.
 */
export function levelApproverLine(hop: ApprovalHop): string {
  const total = hopApprovers(hop).length;
  if (total <= 1) return 'Single approver';
  switch (hop.completionRule ?? 'all') {
    case 'anyOne':
      return `Any one of ${total}`;
    case 'majority':
      return `Majority of ${total} — ${requiredApprovalCount(hop)} needed`;
    case 'threshold':
      return `${requiredApprovalCount(hop)} of ${total} required`;
    default:
      return `All ${total} must approve`;
  }
}

/**
 * What one person did, as a word and a colour.
 *
 * `skipped` is an answer, not a missing one. Under "any one of two" the level closes the
 * moment the first approver decides, and the second was never waiting — the board said
 * "Waiting on this decision" beside a name nobody was waiting on.
 *
 * The first correction, "Not needed", traded one wrong reading for another: it sounds like
 * a verdict on the person, when what expired is the ask. They were asked, the level closed
 * without them, and their decision is no longer required — which is also what tells an
 * auditor the level was satisfied by rule rather than abandoned.
 *
 * "Pending" rather than "Waiting" because the request header already counts these as
 * pending, and one condition should not have two names inside one page.
 */
export function approverState(decision: ApprovalDecision): { tone: FlowTone; label: string } {
  if (decision.decision === 'approved') return { tone: 'done', label: 'Approved' };
  if (decision.decision === 'rejected') return { tone: 'failed', label: 'Rejected' };
  if (decision.state === 'skipped') return { tone: 'skipped', label: 'No longer required' };
  return { tone: 'current', label: 'Pending' };
}

// ---- a cart line, as one word -----------------------------------------

/**
 * What a cart line's chip says in the rail.
 *
 * The **decision**, not the phase it happens to be sitting in. A reader scanning the rail
 * is asking "did this get through?", and "Provisioned" answered a different question —
 * the phase name is already on the card's footer line, so the chip was spending the one
 * word it has on the one fact the card had twice.
 *
 * Provisioning failure still outranks everything: a line that was approved and then did
 * not get granted is the operator's problem, and a green "Approved" would hide it.
 */
/**
 * How bad each condition is, worst first.
 *
 * Only for rolling a set of lines up into one answer. Nothing else ranks tones: a single
 * line's condition is whatever it is, and comparing two of them is a question only a cart
 * asks.
 */
const TONE_SEVERITY: Record<FlowTone, number> = {
  failed: 0,
  breached: 1,
  risk: 2,
  current: 3,
  pending: 4,
  skipped: 5,
  done: 6,
};

/**
 * Where a whole cart stands: the worst thing any of its lines is doing.
 *
 * A request is not finished while one line is breached, and a header that averaged its
 * lines — or took the first one — would report calm over a cart that has a problem in it.
 */
export function worstOutcome(
  outcomes: { tone: FlowTone; label: string }[],
): { tone: FlowTone; label: string } | null {
  if (outcomes.length === 0) return null;
  return outcomes.reduce((worst, o) => (TONE_SEVERITY[o.tone] < TONE_SEVERITY[worst.tone] ? o : worst));
}

export function itemOutcome(view: GovernanceRequest, sla: SlaStatus): { tone: FlowTone; label: string } {
  if (view.stages.some((s) => s.id === 'provisioning' && s.state === 'failed') || view.failure) {
    return { tone: 'failed', label: 'Provisioning failed' };
  }

  const levels = approvalLevels(view);
  if (levels.some((h) => h.decision === 'rejected')) return { tone: 'failed', label: 'Rejected' };
  if (approvalFlowComplete(view)) return { tone: 'done', label: 'Approved' };

  if (sla === 'breached') return { tone: 'breached', label: 'SLA breached' };
  if (sla === 'at_risk') return { tone: 'risk', label: 'SLA at risk' };

  // One word for "no answer yet", whether the line is sitting with approvers or has not
  // reached them. Splitting it into "In review" and "Awaiting review" spent the chip's one
  // word on which machine step it is at — which the canvas beside it already draws — and
  // read as two different outcomes for the same non-outcome.
  return { tone: 'current', label: 'Pending' };
}
