/**
 * How IGA authenticates when it calls an application.
 *
 * **Secrets are never stored here.** Passwords and client secrets are write-only:
 * the form sends them, the record keeps only `hasPassword` / `hasClientSecret`,
 * and editing shows "unchanged" rather than the value. A prototype that round-trips
 * a credential through localStorage teaches the wrong shape to whatever gets built
 * from it — and re-entering a secret to change it is the behaviour a real console
 * has anyway.
 *
 * Hybrid persistence, same contract as the other stores: the seed primes an empty
 * store, thereafter localStorage is the source of truth.
 */
import { catalogApps, appProfileFor } from './seed';

export type AuthMethod = 'basic' | 'bearer' | 'oauth2' | 'custom';

export const GRANT_TYPES = [
  { value: 'authorization_code', label: 'Authorization Code' },
  { value: 'client_credentials', label: 'Client Credentials' },
  { value: 'password', label: 'Resource Owner Password' },
] as const;
export type GrantType = (typeof GRANT_TYPES)[number]['value'];

/** Where the client id and secret ride on the token request. */
export type CredentialsIn = 'body' | 'header';

export interface BasicConfig {
  username: string;
  hasPassword: boolean;
}

export interface OAuthConfig {
  grantType: GrantType;
  redirectUrl: string;
  clientId: string;
  hasClientSecret: boolean;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scope: string;
  credentialsIn: CredentialsIn;
  tokenType: string;
  // Response mapping — the keys to read out of the provider's token response.
  accessTokenKey: string;
  expiresInKey: string;
  refreshTokenKey: string;
  refreshExpiresInKey: string;
}

export interface AppAuthorization {
  id: string;
  applicationId: string;
  method: AuthMethod;
  basic?: BasicConfig;
  oauth?: OAuthConfig;
  /** True once the credentials have been exercised against the application. */
  authorized: boolean;
  updatedAt: string; // ISO
}

export const METHOD_LABEL: Record<AuthMethod, string> = {
  basic: 'Basic',
  bearer: 'Bearer Token',
  oauth2: 'OAuth 2.0',
  custom: 'Custom',
};

/** The callback IGA listens on. Fixed per application — the provider must match it exactly. */
export const redirectUrlFor = (applicationId: string) =>
  `https://iga.example.com/api/provisioning/app/${applicationId}/callback`;

export const emptyOAuth = (applicationId: string): OAuthConfig => ({
  grantType: 'authorization_code',
  redirectUrl: redirectUrlFor(applicationId),
  clientId: '',
  hasClientSecret: false,
  authorizationEndpoint: '',
  tokenEndpoint: '',
  scope: '',
  credentialsIn: 'body',
  tokenType: 'Bearer',
  accessTokenKey: 'access_token',
  expiresInKey: 'expires_in',
  refreshTokenKey: 'refresh_token',
  refreshExpiresInKey: 'refresh_expires_in',
});

const STORE_KEY = 'iga.appAuthorizations.v1';
const SEED_VERSION = 1;

interface Store {
  version?: number;
  authorizations: Record<string, AppAuthorization>;
}

const hasWindow = () => typeof window !== 'undefined';

/**
 * Applications the Directory already calls "authorized" start with a working
 * Basic setup; the ones marked pending start with none, so the empty state is
 * reachable without deleting anything. Fixed timestamp — a seeded record must
 * read the same on every load.
 */
const seed: AppAuthorization[] = catalogApps
  .filter((app) => appProfileFor(app.id).authorizationStatus === 'authorized')
  .map((app) => ({
    id: `auth-${app.id}`,
    applicationId: app.id,
    method: 'basic' as const,
    basic: { username: 'svc.iga@northwind.example', hasPassword: true },
    authorized: true,
    updatedAt: '2026-07-28T09:00:00.000Z',
  }));

function seedStore(): Store {
  const authorizations: Record<string, AppAuthorization> = {};
  for (const a of seed) authorizations[a.id] = structuredClone(a);
  return { version: SEED_VERSION, authorizations };
}

function readStore(): Store {
  if (!hasWindow()) return seedStore(); // SSR: read-only seed view
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) {
      const seeded = seedStore();
      window.localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as Store;
    if (!parsed || typeof parsed !== 'object' || !parsed.authorizations) return seedStore();
    if (parsed.version !== SEED_VERSION) {
      for (const a of seed) if (!parsed.authorizations[a.id]) parsed.authorizations[a.id] = structuredClone(a);
      parsed.version = SEED_VERSION;
      window.localStorage.setItem(STORE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return seedStore();
  }
}

function writeStore(s: Store) {
  if (hasWindow()) window.localStorage.setItem(STORE_KEY, JSON.stringify(s));
}

export function listAuthorizations(applicationId: string): AppAuthorization[] {
  return Object.values(readStore().authorizations)
    .filter((a) => a.applicationId === applicationId)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

const makeId = () => `auth-${Math.random().toString(36).slice(2, 10)}`;

export function saveAuthorization(
  input: Omit<AppAuthorization, 'id' | 'updatedAt' | 'authorized'> & { id?: string; authorized?: boolean },
): AppAuthorization {
  const store = readStore();
  const id = input.id ?? makeId();
  const previous = store.authorizations[id];
  const record: AppAuthorization = {
    ...input,
    id,
    // Changing how IGA authenticates invalidates the last handshake, so an
    // edited record goes back to unauthorized unless it is untouched.
    authorized: input.authorized ?? false,
    updatedAt: new Date().toISOString(),
  };
  if (previous && !input.authorized) record.authorized = false;
  store.authorizations[id] = record;
  writeStore(store);
  return record;
}

export function setAuthorized(id: string, authorized: boolean): void {
  const store = readStore();
  const record = store.authorizations[id];
  if (!record) return;
  store.authorizations[id] = { ...record, authorized, updatedAt: new Date().toISOString() };
  writeStore(store);
}

export function deleteAuthorization(id: string): void {
  const store = readStore();
  delete store.authorizations[id];
  writeStore(store);
}
