/**
 * Entitlement types — the categories of access this tenant recognises
 * (GROUP, PERMISSION, ROLE, and any custom labels).
 *
 * Hybrid persistence: the seed primes an empty store on first visit, then
 * localStorage is the source of truth. Screens call these functions; they never
 * touch storage themselves.
 */

const STORE_KEY = 'iga.entitlementTypes.v1';
const SEED_VERSION = 1;

export interface EntitlementType {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export type EntitlementTypeDraft = Pick<EntitlementType, 'name'>;

interface Store {
  version: number;
  types: Record<string, EntitlementType>;
}

const hasWindow = () => typeof window !== 'undefined';

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  return `et-${Math.random().toString(36).slice(2, 10)}`;
}

function typeOf(partial: Omit<EntitlementType, 'createdAt' | 'updatedAt'> & { stamp: string }): EntitlementType {
  const { stamp, ...rest } = partial;
  return { ...rest, createdAt: stamp, updatedAt: stamp };
}

/** Screenshot order is name-sorted; keep that once the list hydrates. */
const SEED_NAMES = ['DEMO7899', 'ent1', 'grant', 'GROUP', 'PERMISSION', 'remove', 'revoke', 'ROLE'];

function seedStore(): Store {
  const stamp = '2026-08-18T10:00:00.000Z';
  const list = SEED_NAMES.map((name, i) =>
    typeOf({
      id: `et-${name.toLowerCase()}`,
      name,
      stamp: new Date(Date.parse(stamp) + i * 1000).toISOString(),
    }),
  );
  return {
    version: SEED_VERSION,
    types: Object.fromEntries(list.map((t) => [t.id, t])),
  };
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
    if (!parsed?.types || parsed.version !== SEED_VERSION) {
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

export function normalizeEntitlementTypeName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

export function entitlementTypeNameTaken(name: string, exceptId?: string): boolean {
  const key = name.toLowerCase();
  return listEntitlementTypes().some((t) => t.name.toLowerCase() === key && t.id !== exceptId);
}

/** Name order, case-insensitive. */
export function listEntitlementTypes(): EntitlementType[] {
  return Object.values(readStore().types).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );
}

export function getEntitlementType(id: string): EntitlementType | null {
  return readStore().types[id] ?? null;
}

export function createEntitlementType(draft: EntitlementTypeDraft): EntitlementType | null {
  const name = normalizeEntitlementTypeName(draft.name);
  if (!name || entitlementTypeNameTaken(name)) return null;
  const s = readStore();
  const stamp = nowIso();
  const record: EntitlementType = { id: newId(), name, createdAt: stamp, updatedAt: stamp };
  s.types[record.id] = record;
  writeStore(s);
  return record;
}

export function updateEntitlementType(id: string, draft: EntitlementTypeDraft): EntitlementType | null {
  const name = normalizeEntitlementTypeName(draft.name);
  if (!name || entitlementTypeNameTaken(name, id)) return null;
  const s = readStore();
  const existing = s.types[id];
  if (!existing) return null;
  const record: EntitlementType = { ...existing, name, updatedAt: nowIso() };
  s.types[id] = record;
  writeStore(s);
  return record;
}

export function deleteEntitlementType(id: string): void {
  const s = readStore();
  delete s.types[id];
  writeStore(s);
}
