/**
 * Reconciliation — the record of the connector pulling an application's accounts
 * and entitlements into IGA, and what changed each time it did.
 *
 * The totals are not invented: they are the application's real account and
 * entitlement counts from the Directory, and the history walks *backwards* from
 * them, subtracting each run's net change. A row therefore states the total as
 * it stood after that sync, and the oldest row plus every delta lands exactly on
 * today's number — so the table can be read as an account of how the current
 * figure was arrived at, not as decoration.
 *
 * Deterministic by application id: no `Date.now()` or `Math.random()`, so the
 * server and the client render the same history.
 */
import { getApplicationDetail } from './directory';
import { listAuthorizations } from './provisioning-auth';

export type SyncTrigger = 'manual' | 'auto';
export type SyncOutcome = 'success' | 'failed';

/** What the connector was asked to do — the reason a sync ran. */
export const SYNC_EVENTS = [
  'Account Fetch',
  'Account Create',
  'Account Update',
  'Entitlement Fetch',
  'Full Reconciliation',
] as const;
export type SyncEvent = (typeof SYNC_EVENTS)[number];

export interface SyncDelta {
  /** Total after this run. */
  total: number;
  added: number;
  removed: number;
}

export interface SyncRun {
  id: string;
  at: string; // ISO
  trigger: SyncTrigger;
  event: SyncEvent;
  accounts: SyncDelta;
  entitlements: SyncDelta;
  outcome: SyncOutcome;
}

export interface ReconciliationSummary {
  accounts: { total: number; added: number; removed: number };
  entitlements: { total: number; added: number; removed: number };
  /** Null when the application has never synced — a freshly onboarded one. */
  lastSync: { outcome: SyncOutcome; at: string } | null;
}

/** The clock this module reasons from. Fixed, so history never shifts under a reload. */
const NOW = Date.parse('2026-08-12T00:34:00.000Z');
const HISTORY_LENGTH = 10;

/** FNV-1a — a stable seed from the application id. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — small, deterministic, good enough for sample data. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function listSyncRuns(applicationId: string): SyncRun[] {
  const detail = getApplicationDetail(applicationId);
  if (!detail) return [];
  // A newly onboarded application has nothing to reconcile against yet.
  if (detail.accounts.length === 0 && detail.entitlements.length === 0) return [];
  // Nor has one IGA has never been able to sign in to. Without this an
  // application can show "no authorization" and a sync history on the same
  // screen, and only one of those can be true.
  if (listAuthorizations(applicationId).length === 0) return [];

  const next = rng(hash(applicationId));
  const pick = <T,>(list: readonly T[]) => list[Math.floor(next() * list.length)];
  const between = (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1));

  let accountTotal = detail.accounts.length;
  let entitlementTotal = detail.entitlements.length;
  let at = NOW;

  /**
   * A run's change is sized against the total it acted on, and never removes
   * more than existed. Fixed-range deltas would sink a six-account application
   * to zero within two rows and the arithmetic would stop reconciling — the one
   * thing this table is for.
   */
  const delta = (total: number): { added: number; removed: number } => {
    const cap = Math.max(1, Math.round(total * 0.2));
    return {
      added: total === 0 ? 0 : between(0, Math.min(cap, total)),
      removed: between(0, cap),
    };
  };

  const runs: SyncRun[] = [];
  for (let i = 0; i < HISTORY_LENGTH; i += 1) {
    const acc = delta(accountTotal);
    const ent = delta(entitlementTotal);
    // A failed run reached the application but committed nothing, so it moves
    // no totals — which is why the deltas below are zeroed for it.
    const outcome: SyncOutcome = next() < 0.12 ? 'failed' : 'success';

    const accounts: SyncDelta = { total: accountTotal, ...(outcome === 'failed' ? { added: 0, removed: 0 } : acc) };
    const entitlements: SyncDelta = {
      total: entitlementTotal,
      ...(outcome === 'failed' ? { added: 0, removed: 0 } : ent),
    };

    runs.push({
      id: `${applicationId}-sync-${i}`,
      at: new Date(at).toISOString(),
      trigger: i === 0 || next() < 0.25 ? 'manual' : 'auto',
      event: pick(SYNC_EVENTS),
      accounts,
      entitlements,
      outcome,
    });

    // Step back to the state before this run, and to the previous run's time.
    // No clamp is needed: `delta` never adds more than the total it saw.
    accountTotal = accountTotal - (accounts.added - accounts.removed);
    entitlementTotal = entitlementTotal - (entitlements.added - entitlements.removed);
    at -= between(6, 40) * 60 * 60 * 1000;
  }
  return runs;
}

export function reconciliationSummary(applicationId: string): ReconciliationSummary {
  const detail = getApplicationDetail(applicationId);
  const runs = listSyncRuns(applicationId);
  const last = runs[0] ?? null;
  return {
    accounts: {
      total: detail?.accounts.length ?? 0,
      added: last?.accounts.added ?? 0,
      removed: last?.accounts.removed ?? 0,
    },
    entitlements: {
      total: detail?.entitlements.length ?? 0,
      added: last?.entitlements.added ?? 0,
      removed: last?.entitlements.removed ?? 0,
    },
    lastSync: last ? { outcome: last.outcome, at: last.at } : null,
  };
}
