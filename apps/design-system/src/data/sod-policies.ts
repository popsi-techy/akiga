/**
 * SoD Policies service — the admin read/write model for the policies that define
 * what counts as a conflict.
 *
 * Hybrid persistence, matching Approval Policies: the seed primes an empty store
 * on first visit, and thereafter localStorage is the source of truth. Screens
 * depend on these functions, never on the store or the seed directly.
 *
 * Note the split of responsibility across the SoD module: this file owns the
 * *rules*; `sod.ts` owns the *reviews* that resolve violations of them. They
 * share `sod-types.ts` and the access catalog in `sod-seed.ts`, and nothing else.
 */
import { sodPolicies, accessById } from './sod-seed';
import { getOwners } from './entity-owners';
import { newAccessRef, newGroup } from '@/lib/sod-ruleset';
import type {
  Severity,
  SodPolicy,
  SodPolicyStatus,
  SodRuleGroup,
  SodRulesetVersion,
} from './sod-types';

const STORE_KEY = 'iga.sodPolicies.v1';
/** Bump when the seed shape or content changes, so stale stores re-seed on load. */
const SEED_VERSION = 1;

interface PolicyRecord {
  policy: SodPolicy;
  versions: SodRulesetVersion[];
  /** Seed defaults; overrides live in the shared entity-owners store. */
  ownerIds: string[];
}

interface Store {
  version: number;
  policies: Record<string, PolicyRecord>;
}

const hasWindow = () => typeof window !== 'undefined';
const nowIso = () => new Date().toISOString();

/** Whoever is driving the prototype. Real auth would supply this. */
const CURRENT_ADMIN = 'Amanda Cole';

// ---- seed --------------------------------------------------------------

/** Builds a ruleset from seeded access ids, so a live policy has something to preview. */
function seedRuleset(ids: string[], nested?: string[]): SodRuleGroup {
  const ref = (id: string) => {
    const a = accessById[id];
    return newAccessRef({
      accessId: id,
      accessType: a?.type === 'technicalRole' ? 'technicalRole' : 'entitlement',
      name: a?.name ?? id,
      appName: a?.appName,
    });
  };
  const root = newGroup('AND', ids.map(ref));
  if (nested?.length) root.children.push(newGroup('OR', nested.map(ref)));
  return root;
}

const SEED_RULESETS: Record<string, { root: SodRuleGroup; savedOn: string }> = {
  'pol-fin': { root: seedRuleset(['sap-journal'], ['sap-approve', 'sap-pay']), savedOn: '2026-07-02T11:05:00.000Z' },
  'pol-acc': { root: seedRuleset(['gw-write', 'gw-delete']), savedOn: '2026-06-18T08:30:00.000Z' },
  'pol-priv': { root: seedRuleset(['gw-admin', 'aws-admin']), savedOn: '2026-08-04T16:40:00.000Z' },
  // 'pol-data' is deliberately left without one — a draft with nothing built yet
  // is the state the Overview checklist exists to explain.
};

const SEED_OWNERS: Record<string, string[]> = {
  'pol-fin': ['o-liam', 'o-priya'],
  'pol-acc': ['o-marcus'],
  'pol-priv': ['o-frank'],
  // 'pol-data' is unowned on purpose — the draft's checklist needs something to ask for.
  'pol-data': [],
};

function seedStore(): Store {
  const policies: Record<string, PolicyRecord> = {};
  for (const p of sodPolicies) {
    const seeded = SEED_RULESETS[p.id];
    policies[p.id] = {
      policy: { ...p },
      versions: seeded
        ? [{ version: 1, state: 'active', root: seeded.root, savedOn: seeded.savedOn, savedBy: CURRENT_ADMIN }]
        : [],
      ownerIds: SEED_OWNERS[p.id] ?? [],
    };
  }
  return { version: SEED_VERSION, policies };
}

function readStore(): Store {
  if (!hasWindow()) return seedStore(); // SSR: read-only seed view
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) {
      const s = seedStore();
      window.localStorage.setItem(STORE_KEY, JSON.stringify(s));
      return s;
    }
    const parsed = JSON.parse(raw) as Store;
    if (!parsed?.policies || parsed.version !== SEED_VERSION) {
      const s = seedStore();
      window.localStorage.setItem(STORE_KEY, JSON.stringify(s));
      return s;
    }
    return parsed;
  } catch {
    return seedStore();
  }
}

function writeStore(s: Store): void {
  if (hasWindow()) window.localStorage.setItem(STORE_KEY, JSON.stringify(s));
}

// ---- read --------------------------------------------------------------

export interface SodPolicyRow extends SodPolicy {
  /** Access items in the active ruleset — 0 when nothing has been built yet. */
  accessCount: number;
  ownerCount: number;
}

const toRow = (r: PolicyRecord): SodPolicyRow => ({
  ...r.policy,
  accessCount: countLeaves(activeVersionOf(r)?.root),
  ownerCount: getOwners('sod-policy', r.policy.id, r.ownerIds).length,
});

function countLeaves(node: SodRuleGroup | undefined): number {
  if (!node) return 0;
  return node.children.reduce(
    (n, c) => n + (c.kind === 'access' ? 1 : countLeaves(c)),
    0,
  );
}

const activeVersionOf = (r: PolicyRecord): SodRulesetVersion | undefined =>
  r.versions.find((v) => v.state === 'active');

/** Newest first — a returning admin cares about what changed, not what was created first. */
export function listSodPolicies(): SodPolicyRow[] {
  return Object.values(readStore().policies)
    .map(toRow)
    .sort((a, b) => b.updatedOn.localeCompare(a.updatedOn));
}

export function getSodPolicy(id: string): SodPolicyRow | null {
  const r = readStore().policies[id];
  return r ? toRow(r) : null;
}

export function getSodPolicySeedOwners(id: string): string[] {
  return readStore().policies[id]?.ownerIds ?? [];
}

export function listRulesetVersions(id: string): SodRulesetVersion[] {
  return [...(readStore().policies[id]?.versions ?? [])].sort((a, b) => b.version - a.version);
}

export function getActiveRuleset(id: string): SodRulesetVersion | null {
  const r = readStore().policies[id];
  return r ? activeVersionOf(r) ?? null : null;
}

// ---- write -------------------------------------------------------------

export function createSodPolicy(input: {
  name: string;
  description: string;
  severity: Severity;
}): string {
  const s = readStore();
  const id = `pol-${Math.random().toString(36).slice(2, 8)}`;
  const now = nowIso();
  s.policies[id] = {
    // Deliberately empty: no ruleset, no owners. A new policy that arrived
    // pre-filled would hide the one thing the draft state exists to show.
    policy: {
      id,
      name: input.name.trim(),
      description: input.description.trim(),
      severity: input.severity,
      status: 'draft',
      createdOn: now,
      updatedOn: now,
    },
    versions: [],
    ownerIds: [],
  };
  writeStore(s);
  return id;
}

export function updateSodPolicy(
  id: string,
  patch: Partial<Pick<SodPolicy, 'name' | 'description' | 'severity'>>,
): void {
  const s = readStore();
  const r = s.policies[id];
  if (!r) return;
  r.policy = { ...r.policy, ...patch, updatedOn: nowIso() };
  writeStore(s);
}

export function setSodPolicyStatus(id: string, status: SodPolicyStatus): void {
  const s = readStore();
  const r = s.policies[id];
  if (!r) return;
  r.policy = { ...r.policy, status, updatedOn: nowIso() };
  writeStore(s);
}

export function deleteSodPolicy(id: string): void {
  const s = readStore();
  delete s.policies[id];
  writeStore(s);
}

/**
 * Saves a ruleset.
 *
 * A draft policy is edited in place — it has never enforced anything, so there
 * is no history worth keeping and a version counter that reached 9 before the
 * policy was ever switched on would be noise. Once the policy is live every save
 * supersedes: the old version stays, so a violation raised last month can still
 * be read against the rule that raised it.
 *
 * Returns the version that is now active.
 */
export function saveRuleset(id: string, root: SodRuleGroup, note?: string): SodRulesetVersion | null {
  const s = readStore();
  const r = s.policies[id];
  if (!r) return null;

  const current = activeVersionOf(r);
  const now = nowIso();
  let saved: SodRulesetVersion;

  if (r.policy.status === 'draft' && current) {
    saved = { ...current, root, savedOn: now, savedBy: CURRENT_ADMIN, note };
    r.versions = r.versions.map((v) => (v.version === current.version ? saved : v));
  } else {
    saved = {
      version: (r.versions.reduce((n, v) => Math.max(n, v.version), 0) || 0) + 1,
      state: 'active',
      root,
      savedOn: now,
      savedBy: CURRENT_ADMIN,
      note,
    };
    r.versions = [...r.versions.map((v) => ({ ...v, state: 'superseded' as const })), saved];
  }

  r.policy = { ...r.policy, updatedOn: now };
  writeStore(s);
  return saved;
}

// ---- readiness ---------------------------------------------------------

export interface SodNextStep {
  id: 'ruleset' | 'owners';
  label: string;
  hint: string;
  done: boolean;
  /** Blocks activation. Owners do not — an unowned control still catches conflicts. */
  required: boolean;
  /** What the checklist's CTA says when this is the step to do next. */
  cta: string;
  tab: string;
}

/**
 * What a draft policy still needs, in one definition.
 *
 * Shared by the Overview checklist and the Activate button, so a disabled button
 * can never sit above a checklist claiming everything is done.
 */
export function sodPolicyNextSteps(row: SodPolicyRow): SodNextStep[] {
  return [
    {
      id: 'ruleset',
      label: 'Create the ruleset',
      hint: 'The combination of access that counts as a conflict when one person holds all of it.',
      cta: 'Build ruleset',
      done: row.accessCount >= 2,
      required: true,
      tab: 'ruleset',
    },
    {
      id: 'owners',
      label: 'Add owners',
      hint: 'Who answers for this policy when the conflicts it finds come up for review.',
      cta: 'Add owners',
      done: row.ownerCount > 0,
      required: false,
      tab: 'owners',
    },
  ];
}

/**
 * What stands between a draft and being enforced. Empty = ready to activate.
 *
 * Labels keep their capitalisation: they are imperative phrases ("Create the
 * ruleset") that read as the opening of the sentence the callers build from
 * them, not as nouns dropped into the middle of one.
 */
export function sodBlockingSteps(row: SodPolicyRow): string[] {
  return sodPolicyNextSteps(row)
    .filter((s) => s.required && !s.done)
    .map((s) => s.label);
}
