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
import { directoryListLifecycle, type DirectoryListAppId } from './application-directory-list';

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
  /**
   * `setup` is still being onboarded. `active` is live. `inactive` was live and
   * then deactivated — Activate brings it back without repeating setup.
   */
  status: 'setup' | 'active' | 'inactive';
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

const STORE_KEY = 'iga.onboardedApplications.v2';

interface Store {
  applications: Record<string, OnboardedApplication>;
  /**
   * Seeded catalog ids the admin removed from the list. The seed itself is
   * immutable; hiding is how Delete works for those ten applications.
   */
  hiddenCatalogIds: string[];
  /** Lifecycle overlay for seeded catalog apps (default active). */
  catalogLifecycle: Record<string, 'active' | 'inactive'>;
}

const hasWindow = () => typeof window !== 'undefined';
const emptyStore = (): Store => ({ applications: {}, hiddenCatalogIds: [], catalogLifecycle: {} });

function readStore(): Store {
  if (!hasWindow()) return emptyStore(); // SSR: nothing onboarded yet
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Store;
    if (!parsed || typeof parsed !== 'object' || !parsed.applications) return emptyStore();
    return {
      applications: parsed.applications,
      hiddenCatalogIds: Array.isArray(parsed.hiddenCatalogIds) ? parsed.hiddenCatalogIds : [],
      catalogLifecycle:
        parsed.catalogLifecycle && typeof parsed.catalogLifecycle === 'object'
          ? parsed.catalogLifecycle
          : {},
    };
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
    status: raw.status === 'active' || raw.status === 'inactive' ? raw.status : 'setup',
    name: raw.name ?? '',
    description: raw.description ?? '',
    accessUrl: raw.accessUrl ?? '',
    enableProvisioning: Boolean(raw.enableProvisioning),
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

export function listHiddenCatalogIds(): string[] {
  return readStore().hiddenCatalogIds;
}

export function isCatalogHidden(id: string): boolean {
  return readStore().hiddenCatalogIds.includes(id);
}

/** Soft-delete a seeded catalog application so it leaves the list. */
export function hideCatalogApplication(id: string): void {
  const store = readStore();
  if (store.hiddenCatalogIds.includes(id)) return;
  store.hiddenCatalogIds = [...store.hiddenCatalogIds, id];
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
  return activateOnboardedApplication(id);
}

export function activateOnboardedApplication(id: string): OnboardedApplication | null {
  const store = readStore();
  const app = store.applications[id];
  if (!app) return null;
  if (app.status === 'active') return normalizeOnboarded(app);
  const now = new Date().toISOString();
  const next = normalizeOnboarded({ ...app, status: 'active', updatedAt: now });
  store.applications[id] = next;
  writeStore(store);
  return next;
}

export function deactivateOnboardedApplication(id: string): OnboardedApplication | null {
  const store = readStore();
  const app = store.applications[id];
  if (!app || app.status !== 'active') return app ? normalizeOnboarded(app) : null;
  const now = new Date().toISOString();
  const next = normalizeOnboarded({ ...app, status: 'inactive', updatedAt: now });
  store.applications[id] = next;
  writeStore(store);
  return next;
}

export function catalogApplicationLifecycle(id: string): 'active' | 'inactive' {
  const overlay = readStore().catalogLifecycle[id];
  if (overlay) return overlay;
  if (id in directoryListLifecycle) return directoryListLifecycle[id as DirectoryListAppId];
  return 'active';
}

export function setCatalogApplicationLifecycle(id: string, status: 'active' | 'inactive'): void {
  const store = readStore();
  store.catalogLifecycle = { ...store.catalogLifecycle, [id]: status };
  writeStore(store);
}

export type ApplicationLifecycle = 'draft' | 'active' | 'inactive';

/** Draft while onboarding, then Active or Inactive after the first activate. */
export function applicationLifecycle(id: string): ApplicationLifecycle {
  const onboarded = getOnboardedApplication(id);
  if (onboarded) {
    if (onboarded.status === 'active') return 'active';
    if (onboarded.status === 'inactive') return 'inactive';
    return 'draft';
  }
  return catalogApplicationLifecycle(id);
}
