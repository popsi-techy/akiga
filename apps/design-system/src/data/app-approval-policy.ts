/**
 * Which approval policy governs an application's access requests.
 *
 * One policy per application, by design. An application with two approval routes
 * has no answer to "who approves access to this?" — the request would match both
 * and the outcome would depend on evaluation order, which is exactly the kind of
 * ambiguity the Governance Model exists to surface rather than create.
 *
 * Same shape as `entity-owners.ts`: the governance seed primes the value, and
 * localStorage is the source of truth once an administrator changes it.
 */
import { approvalPolicyGovernance } from './governance-seed';

const STORE_KEY = 'iga.appApprovalPolicy.v1';
const SEED_VERSION = 1;

interface Store {
  version: number;
  /** applicationId → approvalPolicyId, or null when explicitly unassigned. */
  assigned: Record<string, string | null>;
}

const hasWindow = () => typeof window !== 'undefined';

/**
 * The policy the seed says governs this application.
 *
 * An application can appear under several policies in the governance seed — SAP
 * sits under both the finance route and break-glass. Break-glass is an exception
 * path, not the everyday route, so it never wins the default: the ordinary policy
 * is the one an administrator means by "the approval policy for this app".
 */
export function seededPolicyFor(applicationId: string): string | null {
  const matches = Object.entries(approvalPolicyGovernance)
    .filter(([, g]) => g.applicationIds.includes(applicationId))
    .map(([id]) => id);
  if (matches.length === 0) return null;
  return matches.find((id) => id !== 'ap-emergency') ?? matches[0];
}

function readStore(): Store {
  const empty: Store = { version: SEED_VERSION, assigned: {} };
  if (!hasWindow()) return empty;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Store;
    if (!parsed || typeof parsed !== 'object' || !parsed.assigned) return empty;
    return parsed;
  } catch {
    return empty;
  }
}

function writeStore(store: Store): void {
  if (!hasWindow()) return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

/**
 * The assigned policy id, or null when none governs this application.
 *
 * An explicit `null` in the store is a real answer — "the administrator removed
 * it" — and must not fall back to the seed, or Remove would silently undo itself
 * on the next render.
 */
export function getAppApprovalPolicy(applicationId: string): string | null {
  const { assigned } = readStore();
  return applicationId in assigned ? assigned[applicationId] : seededPolicyFor(applicationId);
}

export function setAppApprovalPolicy(applicationId: string, policyId: string | null): void {
  const store = readStore();
  store.assigned[applicationId] = policyId;
  store.version = SEED_VERSION;
  writeStore(store);
}
