/**
 * Birthright Policies — the access every identity gets by virtue of existing.
 *
 * A birthright policy is deliberately simpler than an approval policy: no route,
 * no approvers, no branching. It is a named bundle — "what a new joiner starts
 * with" — and the whole of it is *what* it grants. That is why the detail page is
 * three assignment sections and nothing else.
 *
 * Hybrid persistence, same contract as Approval Policies: the seed primes an
 * empty store on first visit, thereafter localStorage is the source of truth.
 * Screens depend on these functions, never on localStorage or the seed directly.
 */
import type { EntitySelection } from './automation-types';

export type BirthrightStatus = 'draft' | 'active';

export interface BirthrightPolicy {
  id: string;
  name: string;
  description: string;
  status: BirthrightStatus;
  /** Entitlements carry their application, so a grant reads "Okta: Standard User". */
  entitlements: EntitySelection[];
  technicalRoles: EntitySelection[];
  businessRoles: EntitySelection[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** Row projection for the list table. */
export interface BirthrightPolicyRow {
  id: string;
  name: string;
  description: string;
  status: BirthrightStatus;
  /** Total things granted — the number that says whether a policy does anything. */
  grants: number;
  createdAt: string;
  updatedAt: string;
}

const STORE_KEY = 'iga.birthrightPolicies.v1';
/** Bump to top-up existing stores with newly-added seed policies (non-destructive). */
const SEED_VERSION = 1;

interface Store {
  version?: number;
  policies: Record<string, BirthrightPolicy>;
}

const hasWindow = () => typeof window !== 'undefined';

/**
 * Fixed timestamps: a seeded record must read the same on every load, and
 * `Date.now()` at module scope would differ between server and client render.
 */
const seed: BirthrightPolicy[] = [
  {
    id: 'br-all-employees',
    name: 'All Employees',
    description: 'Baseline access every employee receives on their first day.',
    status: 'active',
    entitlements: [
      { id: 'ent-okta-standard', name: 'Standard User', appName: 'Okta' },
      { id: 'ent-gw-read', name: 'Read Access', appName: 'Google Workspace' },
    ],
    technicalRoles: [],
    businessRoles: [{ id: 'br-employee', name: 'Employee' }],
    createdAt: '2026-01-12T09:00:00.000Z',
    updatedAt: '2026-06-02T09:00:00.000Z',
  },
  {
    id: 'br-engineering',
    name: 'Engineering Baseline',
    description: 'Source control and CI access for the engineering org.',
    status: 'active',
    entitlements: [{ id: 'ent-gh-write', name: 'Write Access', appName: 'GitHub' }],
    technicalRoles: [{ id: 'tr-developer', name: 'Developer' }],
    businessRoles: [],
    createdAt: '2026-02-03T09:00:00.000Z',
    updatedAt: '2026-07-19T09:00:00.000Z',
  },
  {
    id: 'br-contractor',
    name: 'Contractor Baseline',
    description: 'Minimal access for non-employee contractors.',
    status: 'draft',
    entitlements: [],
    technicalRoles: [],
    businessRoles: [],
    createdAt: '2026-05-21T09:00:00.000Z',
    updatedAt: '2026-05-21T09:00:00.000Z',
  },
];

function seedStore(): Store {
  const policies: Record<string, BirthrightPolicy> = {};
  for (const p of seed) policies[p.id] = structuredClone(p);
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
    if (!parsed || typeof parsed !== 'object' || !parsed.policies) return seedStore();
    // Non-destructive top-up: add seed policies the store has never seen, and
    // never overwrite one the user has edited.
    if (parsed.version !== SEED_VERSION) {
      for (const p of seed) if (!parsed.policies[p.id]) parsed.policies[p.id] = structuredClone(p);
      parsed.version = SEED_VERSION;
      window.localStorage.setItem(STORE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return seedStore();
  }
}

function writeStore(s: Store) {
  if (hasWindow()) window.localStorage.setItem(STORE_KEY, JSON.stringify(s));
}

const grantCount = (p: BirthrightPolicy) =>
  p.entitlements.length + p.technicalRoles.length + p.businessRoles.length;

export function listBirthrightPolicies(): BirthrightPolicyRow[] {
  return Object.values(readStore().policies)
    .map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      grants: grantCount(p),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getBirthrightPolicy(id: string): BirthrightPolicy | null {
  return readStore().policies[id] ?? null;
}

/** Deterministic-enough id; the store is per-browser so collisions are not a risk. */
const makeId = () => `br-${Math.random().toString(36).slice(2, 10)}`;

export function createBirthrightPolicy(input: { name: string; description: string }): BirthrightPolicy {
  const now = new Date().toISOString();
  const policy: BirthrightPolicy = {
    id: makeId(),
    name: input.name.trim() || 'Untitled policy',
    description: input.description.trim(),
    status: 'draft',
    entitlements: [],
    technicalRoles: [],
    businessRoles: [],
    createdAt: now,
    updatedAt: now,
  };
  const store = readStore();
  store.policies[policy.id] = policy;
  writeStore(store);
  return policy;
}

export function updateBirthrightPolicy(policy: BirthrightPolicy): BirthrightPolicy {
  const next = { ...policy, updatedAt: new Date().toISOString() };
  const store = readStore();
  store.policies[next.id] = next;
  writeStore(store);
  return next;
}

export function deleteBirthrightPolicy(id: string): void {
  const store = readStore();
  delete store.policies[id];
  writeStore(store);
}

export { grantCount };
