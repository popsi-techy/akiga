/**
 * Access requests service — reviewer queue with localStorage persistence.
 */
import { accessRequestSeed } from './access-requests-seed';
import { formatDate, formatDateTime } from '@/lib/datetime';
import type {
  AccessRequest,
  AccessRequestItem,
  AccessRequestRiskSeverity,
  AccessRequestStatus,
  EndUserRequestRow,
  EndUserRequestStatus,
  ReviewRequestRow,
} from './access-request-types';
import { riskTier } from '@/lib/risk';

const STORE_KEY = 'iga.accessRequests.v1';
const SEED_VERSION = 4;

/** The signed-in end user — same prototype account as the top bar. */
export const CURRENT_END_USER = {
  id: 'u-amelia',
  name: 'Amelia Ford',
  email: 'amelia.ford@acme.com',
  title: 'Access Reviewer',
};

type Store = { version: number; requests: Record<string, AccessRequest> };

function readStore(): Store {
  if (typeof window === 'undefined') return seedStore();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return writeStore(seedStore());
    const parsed = JSON.parse(raw) as Store;
    if (!parsed?.requests || parsed.version !== SEED_VERSION) return writeStore(seedStore());
    return hydrateSeedAttachments(parsed);
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

/** Fill seed evidence onto existing requests that predate attachments, without wiping drafts. */
function hydrateSeedAttachments(store: Store): Store {
  let changed = false;
  for (const seed of accessRequestSeed) {
    const current = store.requests[seed.id];
    if (!current || current.attachments !== undefined || !seed.attachments?.length) continue;
    store.requests[seed.id] = { ...current, attachments: seed.attachments };
    changed = true;
  }
  return changed ? writeStore(store) : store;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * A request date, in the house format.
 *
 * Was `1 Sep 26` — day-first, two-digit year, and read from local time. Beside a
 * `formatDateTime` reading `Sep 1, 2026 · 10:15 AM` on the same screen it looked like a
 * different product, and the two-digit year is a saving nobody asked for.
 */
export const formatRequestDate = formatDate;

/**
 * When a request moved, in the house format. Same story as `formatGovDateTime`: this was a
 * day-first 24-hour local-time copy, and local time is a hydration mismatch waiting for a
 * reader in a different zone from the server.
 */
export const formatRequestDateTime = formatDateTime;

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

function defaultExpiresAt(submittedAt: string): string {
  const d = new Date(submittedAt);
  if (Number.isNaN(d.getTime())) return submittedAt;
  d.setUTCDate(d.getUTCDate() + 60);
  return d.toISOString();
}

export function requestItems(req: AccessRequest): AccessRequestItem[] {
  if (req.items && req.items.length > 0) return req.items;
  if (!req.itemName) return [];
  return [
    {
      entitlementId: req.entitlementCode ?? req.id,
      entitlementName: req.itemName,
      applicationId: req.appId ?? '',
      applicationName: req.appName ?? req.itemName,
      description: req.itemDescription,
      risk: req.itemRiskScore,
      accessDurationKind: req.accessDurationKind,
      accessDurationUntil: req.accessDurationUntil,
    },
  ];
}

export function endUserStatusOf(req: AccessRequest, now = Date.now()): EndUserRequestStatus {
  if (req.status === 'draft') return 'draft';
  if (req.status === 'rejected') return 'rejected';
  if (req.status === 'approved') return 'completed';
  const exp = req.expiresAt ?? req.dueAt;
  if (exp && new Date(exp).getTime() < now) return 'expired';
  return 'pending';
}

function withDefaults(req: AccessRequest): AccessRequest {
  return {
    ...req,
    approvalStage: req.approvalStage ?? 'Manager Approval Stage',
    itemRiskScore: req.itemRiskScore ?? 55,
    itemRiskSeverity: req.itemRiskSeverity ?? 'medium',
    sodViolationCount: req.sodViolationCount ?? (req.recommendation === 'reject' ? 2 : 0),
    items: requestItems(req),
    expiresAt: req.expiresAt ?? defaultExpiresAt(req.submittedAt),
    attachments: req.attachments ?? [],
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
  const rows = Object.values(readStore().requests)
    .filter((r) => r.status !== 'draft')
    .map(toRow);
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

function nextDraftIds(store: Store): { id: string; reference: string } {
  let max = 0;
  for (const req of Object.values(store.requests)) {
    const n = Number.parseInt(req.reference.replace(/\D/g, ''), 10);
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  const next = max + 1;
  return { id: `ar-${String(next).padStart(3, '0')}`, reference: `AR-${String(next).padStart(3, '0')}` };
}

function toEndUserRow(req: AccessRequest): EndUserRequestRow {
  const full = withDefaults(req);
  return {
    id: full.id,
    reference: full.reference,
    type: full.type,
    requestedForName: full.requestedForName,
    requestedForEmail: full.requestedForEmail,
    items: requestItems(full),
    submittedAt: full.submittedAt,
    expiresAt: full.expiresAt ?? full.dueAt,
    status: endUserStatusOf(full),
  };
}

export function listEndUserRequests(): EndUserRequestRow[] {
  return Object.values(readStore().requests)
    .map(toEndUserRow)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function requestApplicationIds(req: AccessRequest): string[] {
  const fromField = req.applicationIds ?? [];
  const fromItems = requestItems(req).map((i) => i.applicationId).filter(Boolean);
  return [...new Set([...fromField, ...fromItems])];
}

export function createEntitlementDraft(by = CURRENT_END_USER): AccessRequest {
  const store = readStore();
  const { id, reference } = nextDraftIds(store);
  const now = new Date().toISOString();
  const next: AccessRequest = {
    id,
    reference,
    type: 'entitlement',
    status: 'draft',
    itemName: '',
    requestedForId: by.id,
    requestedForName: by.name,
    requestedForEmail: by.email,
    requestedForTitle: by.title,
    requestedById: by.id,
    requestedByName: by.name,
    requestedByEmail: by.email,
    requestedByTitle: by.title,
    submittedAt: now,
    dueAt: defaultExpiresAt(now),
    expiresAt: defaultExpiresAt(now),
    accessDurationKind: 'permanent',
    businessJustification: '',
    attachments: [],
    recommendation: 'review',
    recommendationSummary: '',
    items: [],
    applicationIds: [],
    beneficiaryKind: 'self',
  };
  store.requests[id] = next;
  writeStore(store);
  return withDefaults(next);
}

export function updateAccessRequest(id: string, patch: Partial<AccessRequest>): AccessRequest | null {
  const store = readStore();
  const req = store.requests[id];
  if (!req) return null;
  const next: AccessRequest = { ...req, ...patch };
  store.requests[id] = next;
  try {
    writeStore(store);
  } catch {
    store.requests[id] = req;
    return null;
  }
  return withDefaults(next);
}

export function deleteAccessRequest(id: string): boolean {
  const store = readStore();
  if (!store.requests[id]) return false;
  delete store.requests[id];
  writeStore(store);
  return true;
}

function severityFromScore(score: number): AccessRequestRiskSeverity {
  return riskTier(score);
}

export function submitAccessRequest(
  id: string,
  justification: string,
  justificationReason?: string,
): AccessRequest | null {
  const store = readStore();
  const req = store.requests[id];
  if (!req || req.status !== 'draft') return null;
  const items = requestItems(req);
  if (items.length === 0) return null;
  const now = new Date();
  const due = new Date(now);
  due.setUTCDate(due.getUTCDate() + 7);
  const maxRisk = Math.max(0, ...items.map((i) => i.risk ?? 0));
  const first = items[0];
  const next: AccessRequest = {
    ...req,
    status: 'pending',
    itemName: items.length === 1 ? first.entitlementName : `${items.length} entitlements`,
    itemDescription: first.description,
    appId: first.applicationId,
    appName: first.applicationName,
    entitlementCode: first.entitlementName,
    itemRiskScore: maxRisk,
    itemRiskSeverity: severityFromScore(maxRisk),
    sodViolationCount: 0,
    submittedAt: now.toISOString(),
    dueAt: due.toISOString(),
    expiresAt: defaultExpiresAt(now.toISOString()),
    accessDurationKind: items.every((i) => i.accessDurationKind === 'permanent') ? 'permanent' : 'temporary',
    businessJustification: justification,
    justificationReason,
    recommendation: maxRisk >= 75 ? 'review' : 'approve',
    recommendationSummary:
      maxRisk >= 75
        ? 'High-risk entitlements are in this request. Review before approving.'
        : `It is recommended to approve this request as there are ${req.sodViolationCount ?? 0} SoD violations.`,
    items,
    attachments: (req.attachments ?? []).filter((a) => (a.status ?? 'success') === 'success' && a.dataUrl),
  };
  store.requests[id] = next;
  writeStore(store);
  return withDefaults(next);
}
