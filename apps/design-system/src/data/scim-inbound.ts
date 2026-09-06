/**
 * Inbound SCIM — IGA as the SCIM server an application pushes to.
 *
 * The base URL is owned by IGA and is stable per application. The bearer token
 * is generated here and rotated on demand; screens never invent either value.
 *
 * Hybrid persistence, same contract as the other stores.
 */
import { getOnboardedApplication } from './applications-store';
import { appTypeHasInboundScim } from './app-types';
import { appProfileFor } from './seed';

export interface ScimInbound {
  applicationId: string;
  baseUrl: string;
  token: string;
}

const STORE_KEY = 'iga.scimInbound.v1';

interface Store {
  byApp: Record<string, ScimInbound>;
}

const hasWindow = () => typeof window !== 'undefined';

/** Same host as the OAuth redirect — IGA owns this path. */
export const scimBaseUrlFor = (applicationId: string) =>
  `https://iga.example.com/api/provisioning/scim/v2/${applicationId}`;

function newToken(): string {
  const bytes = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = (i * 17 + 11) % 256;
  }
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function emptyStore(): Store {
  return { byApp: {} };
}

function readStore(): Store {
  if (!hasWindow()) return emptyStore();
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) {
      const seeded = emptyStore();
      window.localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as Store;
    if (!parsed || typeof parsed !== 'object' || !parsed.byApp) return emptyStore();
    return parsed;
  } catch {
    return emptyStore();
  }
}

function writeStore(s: Store) {
  if (hasWindow()) window.localStorage.setItem(STORE_KEY, JSON.stringify(s));
}

/** True when IGA is the SCIM server this application pushes into. */
export function applicationHasScimInbound(applicationId: string): boolean {
  const onboarded = getOnboardedApplication(applicationId);
  if (onboarded) {
    return appTypeHasInboundScim(onboarded.appTypeId) || appTypeHasInboundScim(onboarded.appType);
  }
  return appTypeHasInboundScim(appProfileFor(applicationId).appType);
}

export function getScimInbound(applicationId: string): ScimInbound {
  const store = readStore();
  const existing = store.byApp[applicationId];
  if (existing) return existing;
  const created: ScimInbound = {
    applicationId,
    baseUrl: scimBaseUrlFor(applicationId),
    token: newToken(),
  };
  store.byApp[applicationId] = created;
  writeStore(store);
  return created;
}

export function regenerateScimInboundToken(applicationId: string): ScimInbound {
  const store = readStore();
  const current = store.byApp[applicationId] ?? {
    applicationId,
    baseUrl: scimBaseUrlFor(applicationId),
    token: '',
  };
  const next: ScimInbound = { ...current, token: newToken() };
  store.byApp[applicationId] = next;
  writeStore(store);
  return next;
}
