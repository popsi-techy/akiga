import type { AuditEvent, GovernanceRequest, LifecycleStage } from '@/data/request-governance';

export type RequestTimelineItem =
  | { kind: 'stage'; stage: LifecycleStage }
  | { kind: 'event'; event: AuditEvent };

/**
 * Audit actions a stage card already states, matched on the action text.
 *
 * The lifecycle stages and the audit log describe the same run at two grains, and where
 * they overlap the stage card is strictly the richer of the two: "Stage approved · Manager
 * stage approved" is the same fact as an approval hop that also carries the approver, their
 * title, the decision and the note they left. Kept side by side, every stage was
 * immediately echoed by a line repeating it — which is what made a merged timeline read as
 * noise rather than as history.
 *
 * A blocklist rather than an allowlist of what to keep, because the two sets grow in
 * opposite directions. Stage transitions are closed: there are four stages and they start,
 * finish or fail. Interventions are open — nudges, reassignments, overrides, ticket
 * hand-offs, whatever gets added next — and those are exactly the entries the timeline
 * exists to surface. So a new action shows up by default and only a proven duplicate is
 * hidden.
 *
 * Findings are not transitions and stay: `SoD conflict` names the specific access that
 * clashes, which the stage's note does not.
 */
const RESTATED_BY_A_STAGE = [
  'request submitted',
  'request created',
  'policy started',
  'policy passed',
  'stage approved',
  'provisioning started',
  'provisioning failed',
];

function restatesAStage(action: string): boolean {
  const a = action.trim().toLowerCase();
  return RESTATED_BY_A_STAGE.includes(a);
}

/**
 * The request's history as one column: the four lifecycle stages, with everything that
 * happened *inside* a stage sitting under it in the order it happened.
 *
 * Oldest first, unlike the SoD review timeline. A review is a decision you look back at,
 * so its newest entry is the interesting one; a request is a pipeline you are pushing
 * through, and reversing it would put provisioning above submission and leave the stages
 * that have not started yet at the top of the page.
 *
 * Stages nobody has reached have no timestamp to sort by, so they keep their pipeline
 * order and trail the dated items — which is where they belong on a progression anyway.
 */
export function buildRequestTimeline(row: GovernanceRequest): RequestTimelineItem[] {
  const dated: { at: string; order: number; item: RequestTimelineItem }[] = [];
  const notStarted: RequestTimelineItem[] = [];

  for (const stage of row.stages) {
    if (stage.startedAt) dated.push({ at: stage.startedAt, order: 1, item: { kind: 'stage', stage } });
    else notStarted.push({ kind: 'stage', stage });
  }

  for (const event of row.audit) {
    if (restatesAStage(event.action)) continue;
    dated.push({ at: event.at, order: 0, item: { kind: 'event', event } });
  }

  /*
    On a tie the event comes first, because a stage's `startedAt` opens a phase and
    everything else closes one. Stage boundaries share a timestamp — policy finishes at
    the instant approval starts — so a finding stamped 08:05:22 is the work of the stage
    that just closed, not of the one just opening. Sorting the stage first put "SoD
    conflict" under Approval, which is where it was found least.
  */
  dated.sort((a, b) => a.at.localeCompare(b.at) || a.order - b.order);

  return [...dated.map((d) => d.item), ...notStarted];
}
