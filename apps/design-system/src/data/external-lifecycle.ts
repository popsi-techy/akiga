/**
 * External-identity lifecycle — the sponsor/admin decisions that overlay the seed.
 *
 * An external identity's seed row is its starting point. Every decision made about
 * it here — a sponsor approving or rejecting onboarding, extending the contract,
 * suspending and resuming access, ending the contract, or (re)assigning a sponsor —
 * is stored as an overlay so a refresh does not undo it. `directory.ts` merges the
 * overlay onto the seed row, so the lists, the detail page and every count agree.
 *
 * Hybrid persistence, same contract as the other stores: seeded/empty on the
 * server, read from localStorage on the client, wrapped so a bad value cannot throw.
 */
import type { IdentityStatus } from './seed';

export type LifecycleAction =
  | 'approved'
  | 'rejected'
  | 'extended'
  | 'suspended'
  | 'resumed'
  | 'ended'
  | 'sponsor-assigned';

export interface LifecycleEvent {
  action: LifecycleAction;
  at: string; // ISO
  /** Human-readable detail, e.g. the new end date or sponsor name. */
  note?: string;
}

export interface ExternalOverlay {
  /** Overrides the seed status once a decision changes it. */
  status?: IdentityStatus;
  /** Contract start date, set when onboarding is approved. */
  startsOn?: string;
  /** Contract end date (ISO yyyy-mm-dd). */
  endsOn?: string;
  /** Reassigned or newly assigned sponsor. */
  sponsorId?: string;
  /** When the overlay last changed — ISO instant. */
  at: string;
  /** Newest-first log of what happened, for the detail-page timeline. */
  events: LifecycleEvent[];
}

const STORE_KEY = 'iga.externalLifecycle.v1';

interface Store {
  overlays: Record<string, ExternalOverlay>;
}

const hasWindow = () => typeof window !== 'undefined';
const empty = (): Store => ({ overlays: {} });

function readStore(): Store {
  if (!hasWindow()) return empty();
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Store;
    return parsed?.overlays && typeof parsed.overlays === 'object' ? parsed : empty();
  } catch {
    return empty();
  }
}

function writeStore(store: Store) {
  if (hasWindow()) window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

export function getExternalOverlay(identityId: string): ExternalOverlay | null {
  return readStore().overlays[identityId] ?? null;
}

/** Apply a patch and append an event, keeping the event log newest-first. */
function mutate(
  identityId: string,
  patch: Partial<Omit<ExternalOverlay, 'at' | 'events'>>,
  event: Omit<LifecycleEvent, 'at'>,
): void {
  const store = readStore();
  const at = new Date().toISOString();
  const prev = store.overlays[identityId] ?? { at, events: [] };
  store.overlays[identityId] = {
    ...prev,
    ...patch,
    at,
    events: [{ ...event, at }, ...prev.events].slice(0, 40),
  };
  writeStore(store);
}

/** Sponsor's onboarding decision — approve provisions access, reject disables it. */
export function recordSponsorDecision(
  identityId: string,
  decision: 'approved' | 'rejected',
  opts?: { startsOn?: string; endsOn?: string; justification?: string },
): void {
  mutate(
    identityId,
    {
      status: decision === 'approved' ? 'active' : 'inactive',
      ...(decision === 'approved'
        ? { startsOn: opts?.startsOn, endsOn: opts?.endsOn }
        : {}),
    },
    { action: decision, note: opts?.justification },
  );
}

export function extendContract(identityId: string, endsOn: string, note?: string): void {
  mutate(identityId, { endsOn }, { action: 'extended', note: note ?? endsOn });
}

export function suspendAccess(identityId: string): void {
  mutate(identityId, { status: 'suspended' }, { action: 'suspended' });
}

export function resumeAccess(identityId: string): void {
  mutate(identityId, { status: 'active' }, { action: 'resumed' });
}

export function endContract(identityId: string): void {
  mutate(identityId, { status: 'terminated' }, { action: 'ended' });
}

/** Assigning a sponsor to an unclaimed external moves it into the approval queue. */
export function assignSponsor(identityId: string, sponsorId: string, wasUnsponsored: boolean, note?: string): void {
  mutate(
    identityId,
    wasUnsponsored ? { sponsorId, status: 'pending-approval' } : { sponsorId },
    { action: 'sponsor-assigned', note },
  );
}
