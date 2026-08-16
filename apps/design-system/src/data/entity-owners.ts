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
  | 'governance-team'
  | 'sod-policy';

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
    if (migrateGovernanceTeamKeys(parsed)) window.localStorage.setItem(STORE_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    return seedStore();
  }
}
/**
 * Governance Group → Governance Team. The key encodes both the entity type and
 * its id, so a store written before the rename hides its reviewer lists behind
 * `governance-group:gg-*` keys nothing reads any more — the team would silently
 * fall back to seed reviewers. Rewrites the keys instead of dropping the store.
 * Returns whether anything moved. Idempotent.
 */
function migrateGovernanceTeamKeys(s: Store): boolean {
  let moved = false;
  for (const key of Object.keys(s.owners)) {
    if (!key.startsWith('governance-group:')) continue;
    const next = key.replace('governance-group:', 'governance-team:').replace(':gg-', ':gt-');
    s.owners[next] = s.owners[key];
    delete s.owners[key];
    moved = true;
  }
  return moved;
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
