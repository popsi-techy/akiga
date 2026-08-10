/**
 * Approval Policies service — the read/write model for the module.
 * Hybrid persistence (ADR round-4 decision): the seed primes an empty store on
 * first visit; thereafter localStorage is the source of truth for user edits.
 * Screens depend on these functions, never on localStorage or the seed directly.
 */
import { approvalPolicySeed } from './seed';
import { approvalPolicyFlows } from './approval-policy-flows';
import type { ApprovalPolicy, ApprovalPolicyRow } from './automation-types';
import { migrateRoot } from '@/lib/policy-tree';

const STORE_KEY = 'iga.approvalPolicies.v1';
/** Bump to top-up existing stores with newly-added seed policies (non-destructive). */
const SEED_VERSION = 3;

interface Store {
  version?: number;
  policies: Record<string, ApprovalPolicy>;
}

const hasWindow = () => typeof window !== 'undefined';

/** A seeded policy plus the flow authored for it (see `approval-policy-flows.ts`). */
function seedPolicy(p: ApprovalPolicy): ApprovalPolicy {
  const flow = approvalPolicyFlows[p.id];
  return structuredClone({ ...p, root: flow ?? p.root });
}

function seedStore(): Store {
  const policies: Record<string, ApprovalPolicy> = {};
  for (const p of approvalPolicySeed) policies[p.id] = seedPolicy(p);
  return { version: SEED_VERSION, policies };
}

function readStore(): Store {
  if (!hasWindow()) return seedStore(); // SSR: read-only seed view
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) {
      const seeded = seedStore();
      window.localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as Store;
    if (!parsed || typeof parsed !== 'object' || !parsed.policies) {
      const seeded = seedStore();
      window.localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    // One-time, non-destructive top-up: when the seed version advances, add any
    // missing sample policies so stale stores gain them without losing user edits.
    // A stored seed policy with an *empty* flow also adopts its authored one —
    // an empty root means nothing was ever built there, so there is no user work
    // to lose, and a policy with no steps has nothing to preview or run.
    if (parsed.version !== SEED_VERSION) {
      for (const p of approvalPolicySeed) {
        const stored = parsed.policies[p.id];
        if (!stored) parsed.policies[p.id] = seedPolicy(p);
        else if ((stored.root?.length ?? 0) === 0 && approvalPolicyFlows[p.id]) {
          stored.root = structuredClone(approvalPolicyFlows[p.id]);
        }
      }
      parsed.version = SEED_VERSION;
      window.localStorage.setItem(STORE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return seedStore();
  }
}

function writeStore(store: Store): void {
  if (!hasWindow()) return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(): string {
  return `ap-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** All policies as list rows, newest-updated first. */
export function listApprovalPolicies(): ApprovalPolicyRow[] {
  const { policies } = readStore();
  return Object.values(policies)
    .map(({ id, policyName, description, status, createdAt, updatedAt }) => ({ id, policyName, description, status, createdAt, updatedAt }))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getApprovalPolicy(id: string): ApprovalPolicy | null {
  const p = readStore().policies[id];
  if (!p) return null;
  // normalize legacy/partial trees on load (idempotent)
  return { ...p, root: migrateRoot(p.root) };
}

/** Create a draft policy and return it. Empty name falls back to "New Approval Policy". */
export function createApprovalPolicy(input: { policyName?: string; description?: string }): ApprovalPolicy {
  const store = readStore();
  const ts = nowIso();
  const policy: ApprovalPolicy = {
    id: makeId(),
    policyName: input.policyName?.trim() || 'New Approval Policy',
    description: input.description?.trim() || '',
    status: 'draft',
    root: [],
    createdAt: ts,
    updatedAt: ts,
  };
  store.policies[policy.id] = policy;
  writeStore(store);
  return policy;
}

/** Persist a full policy document, bumping updatedAt. */
export function updateApprovalPolicy(policy: ApprovalPolicy): ApprovalPolicy {
  const store = readStore();
  const next = { ...policy, updatedAt: nowIso() };
  store.policies[policy.id] = next;
  writeStore(store);
  return next;
}

export function deleteApprovalPolicy(id: string): void {
  const store = readStore();
  delete store.policies[id];
  writeStore(store);
}
