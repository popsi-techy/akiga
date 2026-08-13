/**
 * Applications a user onboarded through the catalog.
 *
 * Additive on purpose: the ten catalog applications in the seed stay exactly as
 * they are, and this store holds only what the Add Application drawer created.
 * Merging the two happens in `directory.ts`, so screens keep asking one place
 * for applications and never need to know which half a row came from.
 *
 * No seed of its own — an empty store is the correct starting state, since a
 * fresh tenant has onboarded nothing.
 */
import type { AppTypeCategory } from './app-types';

export interface OnboardedApplication {
  id: string;
  name: string;
  /** Prepended to account names imported from this application. */
  prefix: string;
  accessUrl: string;
  enableProvisioning: boolean;
  identitySource: boolean;
  requestable: boolean;
  allEntitlementsRequestable: boolean;
  /** The application type it was onboarded from — Salesforce, Okta, AWS. */
  appTypeId: string;
  appType: string;
  appTypeCategory: AppTypeCategory;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

const STORE_KEY = 'iga.onboardedApplications.v1';

interface Store {
  applications: Record<string, OnboardedApplication>;
}

const hasWindow = () => typeof window !== 'undefined';
const emptyStore = (): Store => ({ applications: {} });

function readStore(): Store {
  if (!hasWindow()) return emptyStore(); // SSR: nothing onboarded yet
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Store;
    if (!parsed || typeof parsed !== 'object' || !parsed.applications) return emptyStore();
    return parsed;
  } catch {
    return emptyStore();
  }
}

function writeStore(s: Store) {
  if (hasWindow()) window.localStorage.setItem(STORE_KEY, JSON.stringify(s));
}

/** Newest first — the application you just onboarded is the one you are looking for. */
export function listOnboardedApplications(): OnboardedApplication[] {
  return Object.values(readStore().applications).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getOnboardedApplication(id: string): OnboardedApplication | null {
  return readStore().applications[id] ?? null;
}

/** Prefixed so it can never collide with a seeded `app-okta`-style id. */
const makeId = () => `app-new-${Math.random().toString(36).slice(2, 10)}`;

export interface OnboardApplicationInput {
  name: string;
  prefix: string;
  accessUrl: string;
  enableProvisioning: boolean;
  identitySource: boolean;
  requestable: boolean;
  allEntitlementsRequestable: boolean;
  appTypeId: string;
  appType: string;
  appTypeCategory: AppTypeCategory;
}

export function onboardApplication(input: OnboardApplicationInput): OnboardedApplication {
  const now = new Date().toISOString();
  const app: OnboardedApplication = {
    ...input,
    id: makeId(),
    name: input.name.trim() || input.appType,
    prefix: input.prefix.trim(),
    accessUrl: input.accessUrl.trim(),
    createdAt: now,
    updatedAt: now,
  };
  const store = readStore();
  store.applications[app.id] = app;
  writeStore(store);
  return app;
}

export function deleteOnboardedApplication(id: string): void {
  const store = readStore();
  delete store.applications[id];
  writeStore(store);
}
