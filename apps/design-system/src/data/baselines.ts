/**
 * Access baselines — the entitlements an application is *expected* to grant.
 *
 * A baseline is a named reference set, not a policy: nothing is enforced by it.
 * Its job is to give drift something to be measured against, which is why the
 * only fields are a name, the entitlements, and whether it is the one used when
 * nothing else is specified.
 *
 * One default per application, enforced on write rather than trusted on read —
 * two defaults is a state no screen could explain.
 *
 * Hybrid persistence, same contract as the other stores.
 */
import { catalogApps } from './seed';

export interface AccessBaseline {
  id: string;
  applicationId: string;
  name: string;
  entitlementIds: string[];
  isDefault: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

const STORE_KEY = 'iga.accessBaselines.v1';
const SEED_VERSION = 1;

interface Store {
  version?: number;
  baselines: Record<string, AccessBaseline>;
}

const hasWindow = () => typeof window !== 'undefined';

/**
 * Every application starts with one baseline holding its lower-risk
 * entitlements — the access nobody would question. Fixed timestamps so a seeded
 * record reads the same on every load.
 */
const seed: AccessBaseline[] = catalogApps
  .filter((app) => app.entitlements.length > 0)
  .map((app) => ({
    id: `bl-${app.id}-standard`,
    applicationId: app.id,
    name: 'Standard access',
    entitlementIds: app.entitlements.filter((e) => e.risk < 60).map((e) => e.id),
    isDefault: true,
    createdAt: '2026-06-02T09:00:00.000Z',
    updatedAt: '2026-07-30T09:00:00.000Z',
  }));

function seedStore(): Store {
  const baselines: Record<string, AccessBaseline> = {};
  for (const b of seed) baselines[b.id] = structuredClone(b);
  return { version: SEED_VERSION, baselines };
}

function readStore(): Store {
  if (!hasWindow()) return seedStore();
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) {
      const seeded = seedStore();
      window.localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as Store;
    if (!parsed || typeof parsed !== 'object' || !parsed.baselines) return seedStore();
    if (parsed.version !== SEED_VERSION) {
      for (const b of seed) if (!parsed.baselines[b.id]) parsed.baselines[b.id] = structuredClone(b);
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

export function listBaselines(applicationId: string): AccessBaseline[] {
  return Object.values(readStore().baselines)
    .filter((b) => b.applicationId === applicationId)
    // Default first: it is the one every other baseline is an exception to.
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || (a.updatedAt < b.updatedAt ? 1 : -1));
}

const makeId = () => `bl-${Math.random().toString(36).slice(2, 10)}`;

/** Clears the flag from every other baseline of the same application. */
function applyDefault(store: Store, applicationId: string, keepId: string) {
  for (const b of Object.values(store.baselines)) {
    if (b.applicationId === applicationId && b.id !== keepId && b.isDefault) {
      store.baselines[b.id] = { ...b, isDefault: false };
    }
  }
}

export function saveBaseline(
  input: Omit<AccessBaseline, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): AccessBaseline {
  const store = readStore();
  const id = input.id ?? makeId();
  const previous = store.baselines[id];
  const now = new Date().toISOString();
  const record: AccessBaseline = {
    ...input,
    id,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  };
  store.baselines[id] = record;
  if (record.isDefault) applyDefault(store, record.applicationId, id);
  writeStore(store);
  return record;
}

export function setDefaultBaseline(id: string): void {
  const store = readStore();
  const record = store.baselines[id];
  if (!record) return;
  store.baselines[id] = { ...record, isDefault: true, updatedAt: new Date().toISOString() };
  applyDefault(store, record.applicationId, id);
  writeStore(store);
}

export function deleteBaseline(id: string): void {
  const store = readStore();
  delete store.baselines[id];
  writeStore(store);
}
