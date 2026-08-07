import type { AcceptedRisk, AuditEntry, SodReview, SodRule } from '@/data/sod-types';
import { clearedByRemoval } from '@/data/sod-audit';

const SETUP_ACTIONS = ['Violation detected', 'Reviewer assigned'] as const;

export type AuditTimelineItem =
  | { kind: 'setup'; entry: AuditEntry }
  | {
      kind: 'submitted';
      at: string;
      actor: string;
      reference: string;
      userName: string;
      policyName: string;
      removedAccessIds: string[];
      removeJustification: string;
      removedRules: SodRule[];
      acceptedRules: Array<{
        rule: SodRule;
        acceptance: AcceptedRisk;
      }>;
    };

function findSetupEntry(review: SodReview, action: (typeof SETUP_ACTIONS)[number]) {
  return review.audit.find((e) => e.action === action);
}

function buildSubmittedItem(review: SodReview): AuditTimelineItem | null {
  if (!review.submission) return null;

  const entry = review.audit.find((e) => e.action === 'Review submitted');
  const payload = entry?.payload?.type === 'submitted' ? entry.payload : null;

  const removedRules =
    payload?.removedRules && payload.removedRules.length > 0
      ? (payload.removedRules
          .map((x) => review.rules.find((r) => r.id === x.ruleId))
          .filter(Boolean) as SodRule[])
      : review.rules.filter((r) => clearedByRemoval(r.accessIds, review.removedAccessIds));

  const acceptedRules =
    payload?.acceptedRules && payload.acceptedRules.length > 0
      ? (payload.acceptedRules
          .map((a) => {
            const rule = review.rules.find((r) => r.id === a.ruleId);
            const acceptance = review.acceptedRules[a.ruleId] ?? {
              justification: a.justification,
              duration: a.duration,
              approverId: '',
              approverName: a.approverName,
              at: review.submission!.at,
            };
            if (!rule) return null;
            return { rule, acceptance };
          })
          .filter(Boolean) as Array<{ rule: SodRule; acceptance: AcceptedRisk }>)
      : review.rules
          .filter((r) => review.acceptedRules[r.id])
          .map((rule) => ({ rule, acceptance: review.acceptedRules[rule.id] }));

  return {
    kind: 'submitted',
    at: review.submission.at,
    actor: entry?.actor ?? review.assignedReviewerName ?? 'Reviewer',
    reference: payload?.reference ?? review.submission.reference,
    userName: payload?.userName ?? review.userName,
    policyName: payload?.policyName ?? review.policyNames[0] ?? 'SoD Policy',
    removedAccessIds: payload?.removedAccessIds ?? [...review.removedAccessIds],
    removeJustification:
      payload?.removeJustification ?? review.removeJustification?.trim() ?? '',
    removedRules,
    acceptedRules,
  };
}

/**
 * Review timeline — setup events, then one consolidated submission card.
 * Omits notifications, workspace opened, and intermediate revoke/accept entries.
 */
export function buildAuditTimeline(review: SodReview): AuditTimelineItem[] {
  const items: AuditTimelineItem[] = [];

  for (const action of SETUP_ACTIONS) {
    const entry = findSetupEntry(review, action);
    if (entry) items.push({ kind: 'setup', entry });
  }

  const submitted = buildSubmittedItem(review);
  if (submitted) items.push(submitted);

  return items.sort((a, b) => {
    const atA = a.kind === 'setup' ? a.entry.at : a.at;
    const atB = b.kind === 'setup' ? b.entry.at : b.at;
    return atB.localeCompare(atA);
  });
}

export { durationLabel } from '@/data/sod-audit';
