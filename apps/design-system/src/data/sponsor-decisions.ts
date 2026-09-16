/**
 * Sponsor decisions on external identities — approve to onboard, reject to disable.
 *
 * Seed status is the starting point. A reviewer decision overlays it so a refresh
 * does not put a just-approved person back in the pending queue.
 */
export type SponsorDecision = 'approved' | 'rejected';

const STORE_KEY = 'iga.sponsorDecisions.v1';

interface Store {
  decisions: Record<string, { decision: SponsorDecision; at: string }>;
}

const hasWindow = () => typeof window !== 'undefined';
const empty = (): Store => ({ decisions: {} });

function readStore(): Store {
  if (!hasWindow()) return empty();
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Store;
    return parsed?.decisions && typeof parsed.decisions === 'object' ? parsed : empty();
  } catch {
    return empty();
  }
}

function writeStore(store: Store) {
  if (hasWindow()) window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

export function getSponsorDecision(identityId: string): { decision: SponsorDecision; at: string } | null {
  return readStore().decisions[identityId] ?? null;
}

export function recordSponsorDecision(identityId: string, decision: SponsorDecision): void {
  const store = readStore();
  store.decisions[identityId] = { decision, at: new Date().toISOString() };
  writeStore(store);
}
