/**
 * SoD Resolution service — hybrid seed + localStorage. Holds the review records
 * and all derived logic (rule status, progress, risk reduction, fastest-path,
 * shared-access impact) used by both consoles. Screens depend on these, never
 * on the store directly.
 */
import { sodReviewSeed, accessById, sodAppById, CURRENT_REVIEWER, sodReviewers, riskApprovers } from './sod-seed';
import { buildSubmittedAuditPayload, clearedByRemoval } from './sod-audit';
import type {
  SodReview,
  SodRule,
  ViolationRow,
  MyReviewRow,
  ReviewStatus,
  ReviewerStatus,
  AcceptedRisk,
  AuditEntry,
  Person,
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
export { sodReviewers, riskApprovers, CURRENT_REVIEWER, accessById };
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
export function riskReduction(review: SodReview): { original: number; projected: number; reducedPct: number } {
  const { total, pending } = progressOf(review);
  const projected = total ? Math.round(review.riskScore * (pending / total)) : 0;
  return { original: review.riskScore, projected, reducedPct: Math.round((1 - (total ? pending / total : 0)) * 100) };
}
/** Rules a given access still participates in (pending only). */
export function impactOf(review: SodReview, accessId: string): SodRule[] {
  return review.rules.filter((r) => ruleState(review, r) === 'pending' && r.accessIds.includes(accessId));
}
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
/** Admin status with overdue normalization. */
export function effectiveStatus(review: SodReview): ReviewStatus {
  if (review.status === 'completed' || review.submission) return 'completed';
  if (!review.assignedReviewerId) return 'unassigned';
  if (review.dueDate && new Date(review.dueDate).getTime() < Date.now() && !review.submission) return 'overdue';
  return reviewerStatusOf(review) === 'inProgress' ? 'inProgress' : 'assigned';
}

// ---- reads ------------------------------------------------------------
export function getReview(id: string): SodReview | null {
  return readStore().reviews[id] ?? null;
}
export function listViolations(): ViolationRow[] {
  return Object.values(readStore().reviews)
    .map((r) => ({
      id: r.id,
      userName: r.userName,
      userEmail: r.userEmail,
      policyNames: r.policyNames,
      ruleCount: r.rules.length,
      riskScore: r.riskScore,
      severity: r.severity,
      assignedReviewerName: r.assignedReviewerName,
      status: effectiveStatus(r),
      dueDate: r.dueDate,
      updatedAt: r.updatedAt,
    }))
    .sort((a, b) => b.riskScore - a.riskScore);
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

export function unassignReviewer(id: string): SodReview | null {
  const r = getReview(id);
  if (!r || !r.assignedReviewerId) return r;
  return save({
    ...r,
    assignedReviewerId: undefined,
    assignedReviewerName: undefined,
    assignedAt: undefined,
    dueDate: undefined,
    status: 'unassigned',
    audit: audit(r, 'Reviewer unlinked', `Unassigned ${r.assignedReviewerName ?? 'reviewer'}`, 'Admin'),
  });
}

export function assignReviewer(id: string, reviewer: Person, dueDate?: string): SodReview | null {
  const r = getReview(id);
  if (!r) return null;
  const nextDue = dueDate ?? r.dueDate;
  return save({
    ...r,
    assignedReviewerId: reviewer.id,
    assignedReviewerName: reviewer.name,
    assignedAt: nowIso(),
    ...(nextDue ? { dueDate: nextDue } : {}),
    status: 'assigned',
    audit: audit(
      r,
      r.assignedReviewerId ? 'Reviewer reassigned' : 'Reviewer assigned',
      nextDue ? `Assigned to ${reviewer.name}, due ${nextDue}` : `Assigned to ${reviewer.name}`,
      'Admin',
    ),
  });
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

/** Convenience for the workspace: append a decision audit line as it happens. */
export function logDecision(
  id: string,
  action: string,
  detail: string,
  payload?: AuditEntry['payload'],
): void {
  const r = getReview(id);
  if (r) save({ ...r, audit: audit(r, action, detail, undefined, payload) });
}
