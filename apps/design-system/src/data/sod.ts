/**
 * SoD Resolution service — hybrid seed + localStorage. Holds the review records
 * and all derived logic (rule status, progress, risk reduction, fastest-path,
 * shared-access impact) used by both consoles. Screens depend on these, never
 * on the store directly.
 */
import { sodReviewSeed, accessById, sodAppById, CURRENT_REVIEWER, sodReviewers } from './sod-seed';
import { buildSubmittedAuditPayload, clearedByRemoval } from './sod-audit';
import type {
  SodReview,
  SodRule,
  MyReviewRow,
  ReviewerStatus,
  AcceptedRisk,
  AuditEntry,
} from './sod-types';

const STORE_KEY = 'iga.sodReviews.v1';
/** Bump when the seed shape/content changes so existing stores re-seed on load. */
const SEED_VERSION = 13;
interface Store {
  version: number;
  reviews: Record<string, SodReview>;
}
const hasWindow = () => typeof window !== 'undefined';
const nowIso = () => new Date().toISOString();

function seedStore(): Store {
  const reviews: Record<string, SodReview> = {};
  for (const r of sodReviewSeed) reviews[r.id] = structuredClone(r);
  return { version: SEED_VERSION, reviews };
}
function readStore(): Store {
  if (!hasWindow()) return seedStore();
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) {
      const s = seedStore();
      window.localStorage.setItem(STORE_KEY, JSON.stringify(s));
      return s;
    }
    const parsed = JSON.parse(raw) as Store;
    if (!parsed?.reviews || parsed.version !== SEED_VERSION) {
      // stale/older seed → refresh with the current seed
      const s = seedStore();
      window.localStorage.setItem(STORE_KEY, JSON.stringify(s));
      return s;
    }
    return parsed;
  } catch {
    return seedStore();
  }
}
function writeStore(s: Store) {
  if (hasWindow()) window.localStorage.setItem(STORE_KEY, JSON.stringify(s));
}

// ---- reference data ---------------------------------------------------
export { CURRENT_REVIEWER, sodReviewers, accessById };
export const getAccess = (id: string) => accessById[id];
export const getSodApp = (id: string) => sodAppById[id];

// ---- derived logic ----------------------------------------------------
export type RuleState = 'pending' | 'resolved' | 'accepted';

/**
 * A combination is cleared when any one of its accesses is removed — the user no
 * longer holds the full conflicting set (pairwise or n-way AND rules).
 */
export { clearedByRemoval } from './sod-audit';

export function ruleState(review: SodReview, rule: SodRule): RuleState {
  if (review.acceptedRules[rule.id]) return 'accepted';
  if (clearedByRemoval(rule.accessIds, review.removedAccessIds)) return 'resolved';
  return 'pending';
}
export interface Progress {
  total: number;
  resolved: number;
  accepted: number;
  pending: number;
  pct: number;
}
export function progressOf(review: SodReview): Progress {
  let resolved = 0;
  let accepted = 0;
  for (const r of review.rules) {
    const s = ruleState(review, r);
    if (s === 'resolved') resolved += 1;
    else if (s === 'accepted') accepted += 1;
  }
  const total = review.rules.length;
  const pending = total - resolved - accepted;
  return { total, resolved, accepted, pending, pct: total ? Math.round(((resolved + accepted) / total) * 100) : 100 };
}
/** Rules a given access still participates in (pending only). */
/** Greedy minimum-removal set that clears every pending rule (AND semantics). */
export function fastestPath(review: SodReview): { accessId: string; count: number }[] {
  const pending = review.rules.filter((r) => ruleState(review, r) === 'pending');
  const byId = Object.fromEntries(pending.map((r) => [r.id, r]));
  const remaining = new Set(pending.map((r) => r.id));
  const chosen: { accessId: string; count: number }[] = [];
  const removed = new Set(review.removedAccessIds);
  while (remaining.size) {
    const scores: Record<string, { clears: number; touches: number }> = {};
    for (const rid of remaining) {
      const rule = byId[rid];
      for (const a of rule.accessIds) {
        if (removed.has(a)) continue;
        const trial = new Set(removed);
        trial.add(a);
        const entry = scores[a] || { clears: 0, touches: 0 };
        entry.touches += 1;
        if (clearedByRemoval(rule.accessIds, trial)) entry.clears += 1;
        scores[a] = entry;
      }
    }
    let best: string | null = null;
    let bestClears = -1;
    let bestTouches = -1;
    for (const [a, s] of Object.entries(scores)) {
      if (s.clears > bestClears || (s.clears === bestClears && s.touches > bestTouches)) {
        best = a;
        bestClears = s.clears;
        bestTouches = s.touches;
      }
    }
    if (!best) break;
    chosen.push({ accessId: best, count: Math.max(bestClears, bestTouches) });
    removed.add(best);
    for (const rid of [...remaining]) {
      if (clearedByRemoval(byId[rid].accessIds, removed)) remaining.delete(rid);
    }
  }
  return chosen;
}
export function reviewerStatusOf(review: SodReview): ReviewerStatus {
  if (review.submission) return 'completed';
  const hasWork = review.removedAccessIds.length > 0 || Object.keys(review.acceptedRules).length > 0 || review.overallJustification.trim().length > 0;
  return hasWork ? 'inProgress' : 'notStarted';
}

// ---- reads ------------------------------------------------------------
export function getReview(id: string): SodReview | null {
  return readStore().reviews[id] ?? null;
}
export function detectedAtOf(review: SodReview): string {
  return review.audit.find((e) => e.action === 'Violation detected')?.at ?? review.createdAt;
}
export function listMyReviews(reviewerId: string = CURRENT_REVIEWER.id): MyReviewRow[] {
  return Object.values(readStore().reviews)
    .filter((r) => r.assignedReviewerId === reviewerId)
    .map((r) => ({
      id: r.id,
      userName: r.userName,
      userEmail: r.userEmail,
      riskScore: r.riskScore,
      severity: r.severity,
      policyNames: r.policyNames,
      ruleCount: r.rules.length,
      dueDate: r.dueDate,
      assignedAt: r.assignedAt,
      detectedAt: detectedAtOf(r),
      submittedAt: r.submission?.at,
      submissionReference: r.submission?.reference,
      reviewerStatus: reviewerStatusOf(r),
      acceptedRiskCount: Object.values(r.acceptedRules).filter((a) => a.justification?.trim()).length,
      pendingCount: progressOf(r).pending,
    }))
    .sort((a, b) => {
      const aDone = Boolean(a.submittedAt);
      const bDone = Boolean(b.submittedAt);
      if (aDone !== bDone) return aDone ? 1 : -1; // active before history
      if (aDone && bDone) return (b.submittedAt ?? '').localeCompare(a.submittedAt ?? '');
      return b.riskScore - a.riskScore;
    });
}

// ---- writes -----------------------------------------------------------
function save(review: SodReview): SodReview {
  const store = readStore();
  const next = { ...review, updatedAt: nowIso() };
  store.reviews[review.id] = next;
  writeStore(store);
  return next;
}
function audit(
  review: SodReview,
  action: string,
  detail: string,
  actor?: string,
  payload?: AuditEntry['payload'],
): AuditEntry[] {
  return [
    ...review.audit,
    { at: nowIso(), actor: actor ?? review.assignedReviewerName ?? 'Reviewer', action, detail, payload },
  ];
}


/**
 * Assign — or reassign — the reviewer who owns this violation.
 *
 * This is not a label: `listMyReviews` filters on `assignedReviewerId`, so the
 * assignment is what actually routes the violation into that person's SoD queue.
 * It is audited (the actor is whoever is doing the assigning, not the assignee)
 * so the Review Timeline shows how the review reached its current owner.
 */
export function assignReviewer(id: string, reviewer: { id: string; name: string }): SodReview | null {
  const r = getReview(id);
  if (!r) return null;
  // Re-picking the same person is not a reassignment — don't write an audit line for it.
  if (r.assignedReviewerId === reviewer.id) return r;
  const previous = r.assignedReviewerName;
  return save({
    ...r,
    assignedReviewerId: reviewer.id,
    assignedReviewerName: reviewer.name,
    audit: audit(
      r,
      previous ? 'Reviewer reassigned' : 'Reviewer assigned',
      previous ? `Reassigned from ${previous} to ${reviewer.name}` : `Assigned to ${reviewer.name}`,
      CURRENT_REVIEWER.name,
    ),
  });
}

/**
 * Clear the reviewer, returning the violation to the unassigned pool.
 *
 * The inverse of {@link assignReviewer}, and just as consequential: it removes
 * the violation from that person's queue, so it is audited with who was dropped
 * rather than a bare "unassigned".
 */
export function unassignReviewer(id: string): SodReview | null {
  const r = getReview(id);
  if (!r) return null;
  if (!r.assignedReviewerId) return r; // already unassigned — nothing to record
  const previous = r.assignedReviewerName ?? 'the previous reviewer';
  const next = { ...r, audit: audit(r, 'Reviewer removed', `Removed ${previous}`, CURRENT_REVIEWER.name) };
  delete next.assignedReviewerId;
  delete next.assignedReviewerName;
  return save(next);
}

/** Persist staged reviewer decisions (draft). */
export function saveReviewState(
  id: string,
  patch: Partial<Pick<SodReview, 'removedAccessIds' | 'keptAccessIds' | 'acceptedRules' | 'overallJustification' | 'removeJustification'>>,
): SodReview | null {
  const r = getReview(id);
  if (!r) return null;
  const next = { ...r, ...patch };
  if (!next.submission) next.status = 'inProgress';
  return save(next);
}

export function submitReview(id: string, overallJustification: string): SodReview | null {
  const r = getReview(id);
  if (!r) return null;
  const reference = `SOD-2026-${(2000 + Math.floor(Math.random() * 8000)).toString()}`;
  const at = nowIso();
  const withState = { ...r, overallJustification, submission: { reference, at } };
  return save({
    ...withState,
    status: 'completed',
    audit: audit(r, 'Review submitted', `Reference ${reference}`, undefined, buildSubmittedAuditPayload(withState, reference)),
  });
}
