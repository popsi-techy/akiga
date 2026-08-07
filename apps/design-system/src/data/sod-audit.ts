import type { AcceptedRisk, AuditEntry, SodReview, SodRule } from './sod-types';

/**
 * A combination is cleared when the user no longer holds the full conflicting set.
 * Removing any one access breaks an AND combination (pairwise or n-way).
 */
export function clearedByRemoval(accessIds: string[], removed: Iterable<string>): boolean {
  if (accessIds.length === 0) return false;
  const set = removed instanceof Set ? removed : new Set(removed);
  return accessIds.some((id) => set.has(id));
}

/** Rules included in the submitted decision (resolved by removal or risk acceptance). */
export function decisionRules(review: SodReview): SodRule[] {
  const removed = new Set(review.removedAccessIds);
  return review.rules.filter(
    (r) => clearedByRemoval(r.accessIds, removed) || Boolean(review.acceptedRules[r.id]),
  );
}

/** Snapshot stored on the Review submitted audit entry. */
export function buildSubmittedAuditPayload(review: SodReview, reference: string): Extract<
  AuditEntry['payload'],
  { type: 'submitted' }
> {
  const removedRules = decisionRules(review).filter((r) =>
    clearedByRemoval(r.accessIds, review.removedAccessIds),
  );
  const acceptedRules = decisionRules(review)
    .filter((r) => review.acceptedRules[r.id])
    .map((rule) => {
      const acceptance = review.acceptedRules[rule.id];
      return {
        ruleId: rule.id,
        ruleCode: rule.code,
        ruleLabel: rule.label,
        accessIds: rule.accessIds,
        justification: acceptance.justification,
        duration: acceptance.duration,
        approverName: acceptance.approverName,
      };
    });

  return {
    type: 'submitted',
    reference,
    userName: review.userName,
    policyName: review.policyNames[0] ?? 'SoD Policy',
    removedAccessIds: [...review.removedAccessIds],
    removeJustification: review.removeJustification?.trim() ?? '',
    removedRules: removedRules.map((rule) => ({
      ruleId: rule.id,
      ruleCode: rule.code,
      accessIds: rule.accessIds,
      revokedAccessIds: rule.accessIds.filter((id) => review.removedAccessIds.includes(id)),
    })),
    acceptedRules,
  };
}

export function durationLabel(duration: AcceptedRisk['duration']): string {
  return duration === 'permanent' ? 'Permanent' : `${duration} days`;
}
