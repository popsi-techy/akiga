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
  /** Shown on the profile and in application lists. */
  description: string;
  accessUrl: string;
  enableProvisioning: boolean;
  identitySource: boolean;
  requestable: boolean;
  allEntitlementsRequestable: boolean;
  /** The application type it was onboarded from — Salesforce, Okta, AWS. */
  appTypeId: string;
  appType: string;
  appTypeCategory: AppTypeCategory;
  /** Draft until the connector is connected; then active in the catalog. */
  status: 'setup' | 'active';
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

function normalizeOnboarded(raw: OnboardedApplication): OnboardedApplication {
  return {
    ...raw,
    status: raw.status ?? 'setup',
    name: raw.name ?? '',
    description: raw.description ?? '',
    accessUrl: raw.accessUrl ?? '',
    appType: raw.appType ?? '',
  };
}

/** Newest first — the application you just onboarded is the one you are looking for. */
export function listOnboardedApplications(): OnboardedApplication[] {
  return Object.values(readStore().applications)
    .filter((a): a is OnboardedApplication => Boolean(a && typeof a === 'object' && a.id))
    .map(normalizeOnboarded)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getOnboardedApplication(id: string): OnboardedApplication | null {
  const app = readStore().applications[id];
  return app ? normalizeOnboarded(app) : null;
}

/** Prefixed so it can never collide with a seeded `app-okta`-style id. */
const makeId = () => `app-new-${Math.random().toString(36).slice(2, 10)}`;

export interface OnboardApplicationInput {
  name: string;
  description: string;
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
    description: input.description.trim(),
    accessUrl: input.accessUrl.trim(),
    status: 'setup',
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

export function updateApplicationBasics(
  id: string,
  basics: { name: string; description: string },
): OnboardedApplication | null {
  const store = readStore();
  const app = store.applications[id];
  if (!app) return null;
  const now = new Date().toISOString();
  const next = normalizeOnboarded({
    ...app,
    name: basics.name.trim() || app.name,
    description: basics.description.trim(),
    updatedAt: now,
  });
  store.applications[id] = next;
  writeStore(store);
  return next;
}

export function connectApplication(id: string): OnboardedApplication | null {
  const store = readStore();
  const app = store.applications[id];
  if (!app || app.status === 'active') return app ? normalizeOnboarded(app) : null;
  const now = new Date().toISOString();
  const next = normalizeOnboarded({ ...app, status: 'active', updatedAt: now });
  store.applications[id] = next;
  writeStore(store);
  return next;
}
