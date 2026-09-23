/**
 * Manager assignments — who each person reports to.
 *
 * The seed gives a starting set of reporting lines; anything an admin changes from
 * the Workforce list (including bulk "assign manager") is stored as an overlay so a
 * refresh does not undo it. Same hybrid contract as the other stores: the seed map
 * is pure (safe on the server and first client render), the overrides are read from
 * localStorage after mount, and every access is wrapped so a bad value cannot throw.
 */

/** Seed reporting lines — personId → managerId (a person id in the same directory). */
export const SEED_MANAGER_IDS: Record<string, string> = {
  'o-liam': 'o-priya',
  'o-frank': 'o-priya',
  'o-nathan': 'o-priya',
  'o-bob': 'o-hana',
  'o-marcus': 'o-henry',
};

const STORE_KEY = 'iga.managerAssignments.v1';

interface Store {
  /** personId → managerId. An empty string clears the seed default. */
  managers: Record<string, string>;
}

const hasWindow = () => typeof window !== 'undefined';
const empty = (): Store => ({ managers: {} });

function readStore(): Store {
  if (!hasWindow()) return empty();
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Store;
    return parsed?.managers && typeof parsed.managers === 'object' ? parsed : empty();
  } catch {
    return empty();
  }
}

function writeStore(store: Store) {
  if (hasWindow()) window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

/** The stored overrides on top of the seed — read after mount and merged in the page. */
export function getManagerOverrides(): Record<string, string> {
  return readStore().managers;
}

/**
 * Resolve one person's manager id: an override wins over the seed default; an
 * override set to the empty string means "explicitly unassigned".
 */
export function resolveManagerId(
  personId: string,
  overrides: Record<string, string> = getManagerOverrides(),
): string | undefined {
  const override = overrides[personId];
  if (override !== undefined) return override || undefined;
  return SEED_MANAGER_IDS[personId];
}

/** Assign one manager to many people at once — the bulk action from the list. */
export function assignManager(personIds: string[], managerId: string): void {
  const store = readStore();
  for (const id of personIds) store.managers[id] = managerId;
  writeStore(store);
}
