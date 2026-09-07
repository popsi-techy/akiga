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
import { applicationDiscoverySource, getApplicationDetail } from './directory';
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
/**
 * Only an IAM or a vault can run this one, so it is not in the pool every application
 * draws from — a direct application reporting "Application Discovery" would be claiming
 * to have found systems inside itself.
 */
export const DISCOVERY_SYNC_EVENT = 'Application Discovery';
export type SyncEvent = (typeof SYNC_EVENTS)[number] | typeof DISCOVERY_SYNC_EVENT;

/**
 * What one run reconciled. `applications` exists only on an IAM or PAM connection — see
 * `reconcilesApplications`.
 */
export type SyncCollection = 'accounts' | 'entitlements' | 'applications';

/** One account, entitlement or discovered application, as a run's change list names it. */
export interface SyncItem {
  id: string;
  name: string;
  /** Second line — the email for an account, the description for anything else. */
  detail: string;
}

export interface SyncDelta {
  /** Total after this run. */
  total: number;
  added: number;
  removed: number;
  /** The `added` of them, named. */
  addedItems: SyncItem[];
  /** The `removed` of them, named. Gone from the application, so these are not
   *  in the Directory today — they only exist in the runs that took them out. */
  removedItems: SyncItem[];
  /** There before this run and still there after it: `total - added` of them. */
  unchangedItems: SyncItem[];
}

export interface SyncRun {
  id: string;
  at: string; // ISO
  trigger: SyncTrigger;
  event: SyncEvent;
  accounts: SyncDelta;
  entitlements: SyncDelta;
  /** Present only on an IAM or PAM connection, which has downstream systems to find. */
  applications?: SyncDelta;
  outcome: SyncOutcome;
}

export interface ReconciliationSummary {
  accounts: { total: number; added: number; removed: number };
  entitlements: { total: number; added: number; removed: number };
  /** Present only on an IAM or PAM connection. */
  applications?: { total: number; added: number; removed: number };
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

/**
 * Names for the things a run took away.
 *
 * They cannot be drawn from the Directory: the Directory holds what the
 * application has now, and these are precisely what it no longer has. The pool
 * is small and plainly synthetic on purpose — a leaver, a service account
 * nobody renewed, a role that outlived its project — which is the shape of what
 * actually falls out of a connector between runs.
 */
const RETIRED_ACCOUNTS: readonly [string, string][] = [
  ['dana.whitfield', 'dana.whitfield@acme.com'],
  ['svc-legacy-sync', 'No email'],
  ['omar.haddad', 'omar.haddad@acme.com'],
  ['contractor-42', 'No email'],
  ['tomas.novak', 'tomas.novak@acme.com'],
  ['svc-batch-import', 'No email'],
  ['kelly.moore', 'kelly.moore@acme.com'],
  ['j.okafor', 'joy.okafor@acme.com'],
  ['temp-analyst', 'No email'],
  ['r.iyer', 'ravi.iyer@acme.com'],
];

const RETIRED_ENTITLEMENTS: readonly [string, string][] = [
  ['Legacy Reporting', 'Retired reporting role from the previous finance stack.'],
  ['Sandbox Admin', 'Administration of the decommissioned sandbox tenant.'],
  ['Contractor Access', 'Time-boxed access granted for the Q1 migration.'],
  ['Deprecated API Role', 'Machine role for the v1 API, switched off with it.'],
  ['Migration Operator', 'Ran the cutover jobs; removed once cutover finished.'],
  ['Temporary Elevation', 'Break-glass elevation that expired on schedule.'],
  ['Beta Feature Access', 'Early access to features now generally available.'],
  ['Archived Project Lead', 'Lead on a project that has since been closed out.'],
];

/**
 * The applications an IAM federates, or a vault holds credentials for.
 *
 * Unlike accounts and entitlements, this inventory is not read from the Directory. The
 * Directory has no parent/child relation between applications — an application discovered
 * through Entra is not recorded as belonging to Entra — so there is nothing to count. Until
 * that relation exists, the list is generated from the connection's id: stable per
 * application, plainly synthetic, and the same on the server and the client.
 *
 * Written as federated SaaS because IAM is the only category that can be onboarded today.
 * A vault's downstream systems are infrastructure rather than SaaS, so a PAM type shipping
 * should bring its own pool rather than borrow this one.
 */
const DISCOVERED_APPLICATIONS: readonly [string, string][] = [
  ['Salesforce', 'CRM for the revenue org · SAML'],
  ['Slack', 'Workspace messaging · SCIM'],
  ['Atlassian Cloud', 'Jira and Confluence · SCIM'],
  ['Workday', 'HR and payroll · SAML'],
  ['ServiceNow', 'ITSM and change management · SCIM'],
  ['Box', 'File storage and sharing · SAML'],
  ['Zoom', 'Meetings and webinars · SAML'],
  ['Zendesk', 'Support ticketing · SCIM'],
  ['Datadog', 'Monitoring and alerting · SAML'],
  ['Figma', 'Design and prototyping · SCIM'],
  ['Notion', 'Docs and wiki · SAML'],
  ['Snowflake', 'Analytics warehouse · SCIM'],
];

/** Applications that dropped out of the connection between runs. */
const RETIRED_APPLICATIONS: readonly [string, string][] = [
  ['Trello', 'Federation removed when the team moved to Jira.'],
  ['Dropbox', 'Retired in favour of the standard file store.'],
  ['Lucidchart', 'Licence not renewed at the end of the term.'],
  ['Skype for Business', 'Decommissioned with the telephony migration.'],
  ['BambooHR', 'Replaced by the HR system of record.'],
  ['Hootsuite', 'Consolidated into the marketing suite.'],
];

/**
 * Whether this application has downstream systems to reconcile.
 *
 * An IAM federates applications and a vault fronts them; a direct application is the leaf
 * — it has accounts and entitlements and nothing underneath. Asking the Directory rather
 * than the connector keeps one answer to "what kind of connection is this", which the
 * Applications list, the setup checklist and this module all need.
 */
export function reconcilesApplications(applicationId: string): boolean {
  const source = applicationDiscoverySource(applicationId);
  return source === 'IAM' || source === 'PAM';
}

/**
 * The applications this connection holds today, deterministic per id.
 *
 * Sized from its own seed rather than the history walk's, so the inventory is fixed before
 * any run is generated — the walk subtracts backwards from it, exactly as it does from the
 * Directory's account and entitlement totals.
 */
export function discoveredApplications(applicationId: string): SyncItem[] {
  if (!reconcilesApplications(applicationId)) return [];
  const seed = rng(hash(`${applicationId}:discovered`));
  // Four at the low end: a connection worth making federates more than a couple.
  const n = 4 + Math.floor(seed() * (DISCOVERED_APPLICATIONS.length - 3));
  const from = Math.floor(seed() * DISCOVERED_APPLICATIONS.length);
  return Array.from({ length: n }, (_, k) => {
    const [name, detail] = DISCOVERED_APPLICATIONS[(from + k) % DISCOVERED_APPLICATIONS.length];
    return { id: `${applicationId}-app-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, name, detail };
  });
}

/** `n` names from a pool, starting at `from`, so no two runs report the same loss. */
function retired(
  pool: readonly [string, string][],
  applicationId: string,
  from: number,
  n: number,
): SyncItem[] {
  return Array.from({ length: n }, (_, k) => {
    const i = (from + k) % pool.length;
    const [name, detail] = pool[i];
    return { id: `${applicationId}-gone-${from + k}`, name, detail };
  });
}

/** `n` items from `list`, starting at `from` and wrapping. `n <= list.length`. */
function slice<T>(list: T[], from: number, n: number): T[] {
  if (list.length === 0) return [];
  return Array.from({ length: n }, (_, k) => list[(from + k) % list.length]);
}

/**
 * Whether this application has a sync history at all.
 *
 * Factored out of `listSyncRuns` so `lastSyncAt` can answer without walking ten runs,
 * and — more to the point — so the two can never disagree about whether an application
 * has ever synced.
 */
export function hasSyncHistory(applicationId: string): boolean {
  const detail = getApplicationDetail(applicationId);
  if (!detail) return false;
  /*
    A newly onboarded application has nothing to reconcile against yet — unless it is an
    IAM or a vault, whose first job is finding what it fronts. Discovering seven
    applications and importing no accounts is a real state for a freshly connected IAM,
    and the honest reading of one whose account import has not been set up.
  */
  if (
    detail.accounts.length === 0 &&
    detail.entitlements.length === 0 &&
    discoveredApplications(applicationId).length === 0
  ) {
    return false;
  }
  // Nor has one IGA has never been able to sign in to. Without this an
  // application can show "no authorization" and a sync history on the same
  // screen, and only one of those can be true.
  if (listAuthorizations(applicationId).length === 0) return false;
  return true;
}

/**
 * When this application last synced, or null if it never has.
 *
 * Each application is offset back from the module clock by its own amount, because they
 * do not share a schedule. Without the offset every history started at exactly `NOW`,
 * so every application in the directory reported the same last-sync instant to the
 * minute — which reads as a broken column rather than as ten systems on ten timers.
 *
 * Seeded separately from the walk's own stream, so adding this moved the timestamps
 * without disturbing the counts and outcomes the walk had already produced.
 */
export function lastSyncAt(applicationId: string): string | null {
  if (!hasSyncHistory(applicationId)) return null;
  const jitter = rng(hash(`${applicationId}:last-sync`));
  // Up to three days back, to the minute: long enough to space the rows out, short
  // enough that a synced application still reads as recently synced.
  const minutesAgo = Math.floor(jitter() * 3 * 24 * 60);
  return new Date(NOW - minutesAgo * 60 * 1000).toISOString();
}

export function listSyncRuns(applicationId: string): SyncRun[] {
  const detail = getApplicationDetail(applicationId);
  if (!detail || !hasSyncHistory(applicationId)) return [];

  const next = rng(hash(applicationId));
  const pick = <T,>(list: readonly T[]) => list[Math.floor(next() * list.length)];
  const fronts = reconcilesApplications(applicationId);
  // An IAM's runs can be a discovery pass; a direct application's cannot.
  const events: readonly SyncEvent[] = fronts ? [...SYNC_EVENTS, DISCOVERY_SYNC_EVENT] : SYNC_EVENTS;
  const between = (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1));

  // The walk carries the *lists*, not just their lengths: a run has to be able
  // to name what it added and what it took away, and the only honest source for
  // "what this application held then" is today's holdings wound backwards.
  let accounts: SyncItem[] = detail.accounts.map((a) => ({
    id: a.id,
    name: a.accountName,
    detail: a.email || 'No email',
  }));
  let entitlements: SyncItem[] = detail.entitlements.map((e) => ({
    id: e.id,
    name: e.name,
    detail: e.description,
  }));
  let applications: SyncItem[] = discoveredApplications(applicationId);
  let at = Date.parse(lastSyncAt(applicationId)!);
  // Runs onwards through the retired pools, so one leaver is not reported as
  // having left four separate times.
  let goneAccounts = 0;
  let goneEntitlements = 0;
  let goneApplications = 0;

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
    const acc = delta(accounts.length);
    const ent = delta(entitlements.length);
    // Drawn only when there is a third collection, so a direct application's history is
    // byte-for-byte what it was before this collection existed.
    const app = fronts ? delta(applications.length) : null;
    // A failed run reached the application but committed nothing, so it moves
    // no totals — which is why the deltas below are zeroed for it.
    const outcome: SyncOutcome = next() < 0.12 ? 'failed' : 'success';
    const accMoved = outcome === 'failed' ? { added: 0, removed: 0 } : acc;
    const entMoved = outcome === 'failed' ? { added: 0, removed: 0 } : ent;
    const appMoved = outcome === 'failed' || !app ? { added: 0, removed: 0 } : app;

    /**
     * Splits the state after a run into what the run brought in and what was
     * already there, and names what it took out. Returns the state *before* the
     * run so the walk can continue into the past.
     */
    const attribute = (
      after: SyncItem[],
      moved: { added: number; removed: number },
      pool: readonly [string, string][],
      goneFrom: number,
    ) => {
      // Rotating window, so consecutive runs do not all claim to have added the
      // first account in the list.
      const addedItems = slice(after, between(0, Math.max(0, after.length - 1)), moved.added);
      const addedIds = new Set(addedItems.map((x) => x.id));
      const unchangedItems = after.filter((x) => !addedIds.has(x.id));
      const removedItems = retired(pool, applicationId, goneFrom, moved.removed);
      return {
        delta: {
          total: after.length,
          added: moved.added,
          removed: moved.removed,
          addedItems,
          removedItems,
          unchangedItems,
        } satisfies SyncDelta,
        // What the application held before this run: without the ones it added,
        // with the ones it took away put back.
        before: [...unchangedItems, ...removedItems],
      };
    };

    const accountsPart = attribute(accounts, accMoved, RETIRED_ACCOUNTS, goneAccounts);
    const entitlementsPart = attribute(entitlements, entMoved, RETIRED_ENTITLEMENTS, goneEntitlements);
    const applicationsPart = fronts
      ? attribute(applications, appMoved, RETIRED_APPLICATIONS, goneApplications)
      : null;

    runs.push({
      id: `${applicationId}-sync-${i}`,
      at: new Date(at).toISOString(),
      trigger: i === 0 || next() < 0.25 ? 'manual' : 'auto',
      event: pick(events),
      accounts: accountsPart.delta,
      entitlements: entitlementsPart.delta,
      ...(applicationsPart ? { applications: applicationsPart.delta } : {}),
      outcome,
    });

    // Step back to the state before this run, and to the previous run's time.
    // No clamp is needed: `delta` never adds more than the total it saw.
    accounts = accountsPart.before;
    entitlements = entitlementsPart.before;
    if (applicationsPart) applications = applicationsPart.before;
    goneAccounts += accMoved.removed;
    goneEntitlements += entMoved.removed;
    goneApplications += appMoved.removed;
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
    ...(reconcilesApplications(applicationId)
      ? {
          applications: {
            /*
              Read off the newest run, not from `discoveredApplications`. The inventory is
              what this connection *would* find; the run is what it has found. Reporting
              the inventory directly claimed "10 applications discovered" beside "Never
              synced" on an IAM that had not connected yet — a connection that has never
              run has discovered nothing, and the walk starts from the full inventory
              anyway, so the newest run states exactly the same number once one exists.
            */
            total: last?.applications?.total ?? 0,
            added: last?.applications?.added ?? 0,
            removed: last?.applications?.removed ?? 0,
          },
        }
      : {}),
    lastSync: last ? { outcome: last.outcome, at: last.at } : null,
  };
}
