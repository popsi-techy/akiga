/**
 * Governance Team charter store — which entities each team is accountable for.
 *
 * ## Why this exists
 *
 * A team's charter lived only in the seed, so the relation was read-only from both ends:
 * an application's Owners tab said "team ownership is assigned on the team", and the
 * team's Owned Applications tab said "this team owns no applications yet" and offered
 * nothing either. The sentence pointed at a door that opened onto a wall.
 *
 * The relation is many-to-many, and either end is a legitimate place to edit it — you add
 * a team to an application for the same reason you add a person. What must not differ is
 * the answer: both ends read the effective charter through here, so the application cannot
 * claim a team owns it while the team's own page disagrees.
 *
 * Mirrors `entity-owners.ts`: one localStorage map, a stored list overrides the seed
 * wholesale, and nothing is written until someone changes something.
 */

/** The charter fields a team can hold. One per governable entity kind. */
export type TeamCharterField =
  | 'ownedApplicationIds'
  | 'ownedEntitlementIds'
  | 'ownedTechnicalRoleIds'
  | 'ownedBusinessRoleIds';

const STORE_KEY = 'iga.governanceTeamCharter.v1';
const SEED_VERSION = 1;

interface Store {
  version: number;
  /** Keyed `${teamId}:${field}`. A present list replaces the seed's entirely. */
  charter: Record<string, string[]>;
}

const hasWindow = () => typeof window !== 'undefined';
const keyOf = (teamId: string, field: TeamCharterField) => `${teamId}:${field}`;

function seedStore(): Store {
  return { version: SEED_VERSION, charter: {} };
}

function readStore(): Store {
  if (!hasWindow()) return seedStore();
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return seedStore();
    const parsed = JSON.parse(raw) as Store;
    if (!parsed?.charter || parsed.version !== SEED_VERSION) return seedStore();
    return parsed;
  } catch {
    return seedStore();
  }
}

function writeStore(s: Store) {
  if (hasWindow()) window.localStorage.setItem(STORE_KEY, JSON.stringify(s));
}

/**
 * What this team is accountable for today — the stored override, or the seed.
 *
 * Returns the seed on the server, so the first paint matches the seed on both sides and
 * the caller can adopt the store after mount without a hydration mismatch.
 */
export function getTeamCharter(teamId: string, field: TeamCharterField, seedIds: string[]): string[] {
  return readStore().charter[keyOf(teamId, field)] ?? seedIds;
}

/** Persist the full list for one team and one field. */
export function setTeamCharter(teamId: string, field: TeamCharterField, ids: string[]): string[] {
  const s = readStore();
  s.charter[keyOf(teamId, field)] = ids;
  writeStore(s);
  return ids;
}
