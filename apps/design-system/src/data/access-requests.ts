/**
 * Access requests service — reviewer queue with localStorage persistence.
 */
import { accessRequestSeed } from './access-requests-seed';
import type { AccessRequest, AccessRequestStatus, ReviewRequestRow } from './access-request-types';

const STORE_KEY = 'iga.accessRequests.v1';
const SEED_VERSION = 2;

type Store = { version: number; requests: Record<string, AccessRequest> };

function readStore(): Store {
  if (typeof window === 'undefined') return seedStore();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return writeStore(seedStore());
    const parsed = JSON.parse(raw) as Store;
    if (!parsed?.requests || parsed.version !== SEED_VERSION) return writeStore(seedStore());
    return parsed;
  } catch {
    return writeStore(seedStore());
  }
}

function writeStore(store: Store): Store {
  if (typeof window !== 'undefined') localStorage.setItem(STORE_KEY, JSON.stringify(store));
  return store;
}

function seedStore(): Store {
  return { version: SEED_VERSION, requests: Object.fromEntries(accessRequestSeed.map((r) => [r.id, r])) };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatRequestDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

export function formatRequestDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function accessDurationLabel(req: AccessRequest): string {
  if (req.accessDurationKind === 'permanent') return 'Permanent';
  if (req.accessDurationUntil) return formatRequestDate(req.accessDurationUntil);
  return 'Temporary';
}

export function timeLeftLabel(dueAt: string, now = Date.now()): string {
  const ms = new Date(dueAt).getTime() - now;
  if (ms <= 0) return 'Overdue';
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  if (days === 1) return '1 Day';
  if (days < 24) return `${days} Days`;
  const hrs = Math.ceil(ms / (1000 * 60 * 60));
  return hrs === 1 ? '1 hr' : `${hrs} hrs`;
}

/** Detailed SLA countdown for the detail header — e.g. "8 Days 4 Hrs". */
export function timeRemainingDetail(dueAt: string, now = Date.now()): string {
  const ms = new Date(dueAt).getTime() - now;
  if (ms <= 0) return 'Overdue';
  const totalHours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0 && hours > 0) {
    return `${days} Day${days === 1 ? '' : 's'} ${hours} Hr${hours === 1 ? '' : 's'}`;
  }
  if (days > 0) return `${days} Day${days === 1 ? '' : 's'}`;
  if (hours > 0) return `${hours} Hr${hours === 1 ? '' : 's'}`;
  const minutes = Math.max(1, Math.floor(ms / (1000 * 60)));
  return `${minutes} Min${minutes === 1 ? '' : 's'}`;
}

/** Elapsed share of the review SLA window (0–100) for the header meter. */
export function slaElapsedPercent(submittedAt: string, dueAt: string, now = Date.now()): number {
  const start = new Date(submittedAt).getTime();
  const end = new Date(dueAt).getTime();
  if (end <= start) return 100;
  if (now >= end) return 100;
  if (now <= start) return 0;
  return ((now - start) / (end - start)) * 100;
}

function withDefaults(req: AccessRequest): AccessRequest {
  return {
    ...req,
    approvalStage: req.approvalStage ?? 'Manager Approval Stage',
    itemRiskScore: req.itemRiskScore ?? 55,
    itemRiskSeverity: req.itemRiskSeverity ?? 'medium',
    sodViolationCount: req.sodViolationCount ?? (req.recommendation === 'reject' ? 2 : 0),
  };
}

function toRow(req: AccessRequest): ReviewRequestRow {
  req = withDefaults(req);
  return {
    id: req.id,
    reference: req.reference,
    type: req.type,
    itemName: req.itemName,
    accessDurationLabel: accessDurationLabel(req),
    requestedForName: req.requestedForName,
    requestedForEmail: req.requestedForEmail,
    requestedByName: req.requestedByName,
    submittedAt: req.submittedAt,
    dueAt: req.dueAt,
    status: req.status,
  };
}

export function listReviewRequests(status?: AccessRequestStatus): ReviewRequestRow[] {
  const rows = Object.values(readStore().requests).map(toRow);
  const filtered = status ? rows.filter((r) => r.status === status) : rows;
  return filtered.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function listPendingReviewRequests(): ReviewRequestRow[] {
  return listReviewRequests('pending');
}

export function listCompletedReviewRequests(): ReviewRequestRow[] {
  return Object.values(readStore().requests)
    .filter((r) => r.status === 'approved' || r.status === 'rejected')
    .map(toRow)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function getReviewRequest(id: string): AccessRequest | null {
  const req = readStore().requests[id];
  return req ? withDefaults(req) : null;
}

export function decideReviewRequest(
  id: string,
  action: 'approved' | 'rejected',
  justification: string,
  decidedBy = 'Amelia Ford',
): AccessRequest | null {
  const store = readStore();
  const req = store.requests[id];
  if (!req || req.status !== 'pending') return null;
  const next: AccessRequest = {
    ...req,
    status: action,
    decision: {
      action,
      justification,
      decidedAt: new Date().toISOString(),
      decidedBy,
    },
  };
  store.requests[id] = next;
  writeStore(store);
  return next;
}

export function pendingReviewRequestCount(): number {
  return Object.values(readStore().requests).filter((r) => r.status === 'pending').length;
}
