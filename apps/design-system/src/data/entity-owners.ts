/**
 * Entity owner/reviewer assignment store — one localStorage-backed map keyed by
 * `${entityType}:${entityId}`, seeded from each entity's initial ownerIds. Mirrors
 * the store pattern in `sod.ts`. Owners/reviewers are always User Identity ids.
 */
export type OwnedEntityType =
  | 'application'
  | 'entitlement'
  | 'technical-role'
  | 'business-role'
  | 'governance-group';

const STORE_KEY = 'iga.entityOwners.v1';
const SEED_VERSION = 1;

interface Store {
  version: number;
  owners: Record<string, string[]>;
}

const hasWindow = () => typeof window !== 'undefined';
const keyOf = (type: OwnedEntityType, id: string) => `${type}:${id}`;

function seedStore(): Store {
  return { version: SEED_VERSION, owners: {} };
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
    if (!parsed?.owners || parsed.version !== SEED_VERSION) {
      const s = seedStore();
      window.localStorage.setItem(STORE_KEY, JSON.stringify(s));
      return s;
    }
    return parsed;
  } catch {
    return seedStore();
  }
}
function writeStore(s: Store) {
  if (hasWindow()) window.localStorage.setItem(STORE_KEY, JSON.stringify(s));
}

/** Current owner ids for an entity — the stored override, or the seed defaults. */
export function getOwners(type: OwnedEntityType, id: string, seedIds: string[]): string[] {
  const s = readStore();
  return s.owners[keyOf(type, id)] ?? seedIds;
}
/** Persist the full owner set for an entity; returns the saved list. */
export function setOwners(type: OwnedEntityType, id: string, ids: string[]): string[] {
  const s = readStore();
  s.owners[keyOf(type, id)] = ids;
  writeStore(s);
  return ids;
}
