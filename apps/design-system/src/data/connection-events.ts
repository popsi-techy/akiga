/**
 * Connection events — the API calls IGA makes against an application.
 *
 * One event is one call: what triggers it, which stored credentials it uses,
 * and how to read the answer. Events reference an authorization by id rather
 * than carrying credentials of their own, so rotating a secret in one place
 * fixes every call that uses it.
 *
 * `eventStatus` is derived, never stored: a status you can save is a status that
 * can disagree with the record it describes.
 *
 * Hybrid persistence, same contract as the other stores.
 */
import { catalogApps, appProfileFor } from './seed';

export const EVENT_KINDS = [
  { value: 'accounts-fetch', label: 'Accounts Fetch', direction: 'inbound' },
  { value: 'entitlements-fetch', label: 'Entitlements Fetch', direction: 'inbound' },
  { value: 'accounts-entitlements-fetch', label: 'Accounts and Entitlements Fetch', direction: 'inbound' },
  { value: 'account-create', label: 'Account Create', direction: 'outbound' },
  { value: 'account-update', label: 'Account Update', direction: 'outbound' },
  { value: 'account-delete', label: 'Account Delete', direction: 'outbound' },
  { value: 'group-create', label: 'Group Create', direction: 'outbound' },
  { value: 'group-update', label: 'Group Update', direction: 'outbound' },
  { value: 'group-delete', label: 'Group Delete', direction: 'outbound' },
  { value: 'account-entitlement-assignment', label: 'Account Entitlement Assignment', direction: 'outbound' },
  { value: 'account-entitlement-revocation', label: 'Account Entitlement Revocation', direction: 'outbound' },
] as const;
export type EventKind = (typeof EVENT_KINDS)[number]['value'];
export type EventDirection = (typeof EVENT_KINDS)[number]['direction'];

const KIND_ALIASES: Record<string, EventKind> = {
  'user-import': 'accounts-fetch',
  'user-create': 'account-create',
  'user-update': 'account-update',
  'user-deactivate': 'account-delete',
  'group-import': 'group-create',
  'entitlement-import': 'entitlements-fetch',
};

export function eventKindMeta(kind: EventKind) {
  return EVENT_KINDS.find((k) => k.value === kind) ?? EVENT_KINDS[0];
}

export function normalizeEventKind(kind: string): EventKind {
  if (kind in KIND_ALIASES) return KIND_ALIASES[kind];
  return EVENT_KINDS.some((k) => k.value === kind) ? (kind as EventKind) : EVENT_KINDS[0].value;
}

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export const BODY_TYPES = ['application/json', 'application/x-www-form-urlencoded', 'text/xml'] as const;

/**
 * Attribute mapping — for each field the application expects, where its value
 * comes from on the IGA side.
 *
 * `source` narrows `igaAttribute`: the families hold different things, and
 * offering every attribute in one flat list is how a group attribute ends up
 * mapped to a user field.
 */
export const ATTRIBUTE_SOURCES = [
  { value: 'user-profile', label: 'User profile' },
  { value: 'custom-user', label: 'Custom user field' },
  { value: 'group', label: 'Group' },
  { value: 'group-assignment', label: 'Group assignment' },
  { value: 'system', label: 'System' },
] as const;
export type AttributeSource = (typeof ATTRIBUTE_SOURCES)[number]['value'];

export const IGA_ATTRIBUTES: Record<AttributeSource, { value: string; label: string }[]> = {
  'user-profile': [
    { value: 'firstName', label: 'First name' },
    { value: 'lastName', label: 'Last name' },
    { value: 'displayName', label: 'Display name' },
    { value: 'email', label: 'Email' },
    { value: 'jobTitle', label: 'Job title' },
    { value: 'department', label: 'Department' },
    { value: 'location', label: 'Location' },
    { value: 'manager', label: 'Manager' },
    { value: 'status', label: 'Status' },
  ],
  'custom-user': [
    { value: 'employeeId', label: 'Employee ID' },
    { value: 'costCentre', label: 'Cost centre' },
    { value: 'division', label: 'Division' },
    { value: 'startDate', label: 'Start date' },
  ],
  group: [
    { value: 'groupName', label: 'Group name' },
    { value: 'groupDescription', label: 'Group description' },
  ],
  'group-assignment': [
    { value: 'memberIds', label: 'Member IDs' },
    { value: 'memberEmails', label: 'Member emails' },
  ],
  system: [
    { value: 'externalId', label: 'External ID' },
    { value: 'createdAt', label: 'Created at' },
    { value: 'lastSyncedAt', label: 'Last synced at' },
  ],
};

export interface AttributeMapping {
  id: string;
  source: AttributeSource;
  /** The field name the application expects. */
  applicationField: string;
  /** Which IGA attribute supplies it. Ignored when `expression` is set. */
  igaAttribute: string;
  /** Composes a value from several attributes — supersedes `igaAttribute`. */
  expression: string;
}

/** A row is finished when it names a field and has something to put in it. */
export const mappingComplete = (m: AttributeMapping) =>
  m.applicationField.trim() !== '' && (m.expression.trim() !== '' || m.igaAttribute !== '');

export interface ConnectionEvent {
  id: string;
  applicationId: string;
  name: string;
  kind: EventKind;
  /** Which stored authorization this call signs in with. */
  authorizationId: string | null;
  method: HttpMethod;
  url: string;
  headers: string;
  bodyContentType: string;
  body: string;
  // How to read the response.
  successStatusCode: string;
  successMessageKey: string;
  errorMessageKey: string;
  externalIdKey: string;
  priority: number;
  usersKey: string;
  paginate: boolean;
  firstPage: string;
  nextPageKey: string;
  fetchFullRecords: boolean;
  enabled: boolean;
  /** Field-level mapping. The count shown in the table is derived from this. */
  attributes: AttributeMapping[];
  updatedAt: string; // ISO
}

export type EventStatus = 'ready' | 'partial' | 'disabled';

/**
 * What is still missing before this event can run — the same list the status
 * chip is derived from, so the chip and the explanation can never disagree.
 */
export function missingPieces(e: ConnectionEvent): string[] {
  const gaps: string[] = [];
  if (!e.authorizationId) gaps.push('an authorization');
  if (!e.url.trim()) gaps.push('an endpoint');
  if (e.attributes.length === 0) gaps.push('attribute mapping');
  return gaps;
}

export function eventStatus(e: ConnectionEvent): EventStatus {
  if (!e.enabled) return 'disabled';
  return missingPieces(e).length === 0 ? 'ready' : 'partial';
}

export const emptyEvent = (
  applicationId: string,
  kind: EventKind = EVENT_KINDS[0].value,
): Omit<ConnectionEvent, 'id' | 'updatedAt'> => ({
  applicationId,
  name: eventKindMeta(kind).label,
  kind,
  authorizationId: null,
  method: 'GET',
  url: '',
  headers: '',
  bodyContentType: 'application/json',
  body: '{}',
  successStatusCode: '200',
  successMessageKey: '',
  errorMessageKey: '',
  externalIdKey: '',
  priority: 1,
  usersKey: 'users',
  paginate: false,
  firstPage: '1',
  nextPageKey: 'nextPageToken',
  fetchFullRecords: false,
  enabled: true,
  attributes: [],
});

const STORE_KEY = 'iga.connectionEvents.v1';
const SEED_VERSION = 2;

interface Store {
  version?: number;
  events: Record<string, ConnectionEvent>;
}

const hasWindow = () => typeof window !== 'undefined';

/**
 * Applications that already have credentials get a working user import and a
 * half-finished deactivate — so both the ready and partially-configured states
 * are reachable without editing anything. Fixed timestamp, deterministic ids.
 */
const seed: ConnectionEvent[] = catalogApps
  .filter((app) => appProfileFor(app.id).authorizationStatus === 'authorized')
  .flatMap((app) => [
    {
      ...emptyEvent(app.id),
      id: `evt-${app.id}-import`,
      name: 'Accounts Fetch',
      kind: 'accounts-fetch' as const,
      authorizationId: `auth-${app.id}`,
      method: 'GET' as const,
      url: `https://api.${app.id.replace('app-', '')}.example.com/v1/users`,
      successMessageKey: 'message',
      errorMessageKey: 'error.message',
      externalIdKey: 'id',
      paginate: true,
      attributes: [
        { id: 'm1', source: 'user-profile' as const, applicationField: 'userName', igaAttribute: 'email', expression: '' },
        { id: 'm2', source: 'user-profile' as const, applicationField: 'givenName', igaAttribute: 'firstName', expression: '' },
        { id: 'm3', source: 'user-profile' as const, applicationField: 'familyName', igaAttribute: 'lastName', expression: '' },
        { id: 'm4', source: 'user-profile' as const, applicationField: 'displayName', igaAttribute: '', expression: '[firstName] + " " + [lastName]' },
        { id: 'm5', source: 'user-profile' as const, applicationField: 'title', igaAttribute: 'jobTitle', expression: '' },
        { id: 'm6', source: 'system' as const, applicationField: 'externalId', igaAttribute: 'externalId', expression: '' },
      ],
      updatedAt: '2026-07-28T09:05:00.000Z',
    },
    {
      ...emptyEvent(app.id),
      id: `evt-${app.id}-deactivate`,
      name: 'Deactivate leaver',
      kind: 'account-delete' as const,
      authorizationId: `auth-${app.id}`,
      method: 'POST' as const,
      url: '',
      priority: 2,
      updatedAt: '2026-07-28T09:06:00.000Z',
    },
  ]);

function seedStore(): Store {
  const events: Record<string, ConnectionEvent> = {};
  for (const e of seed) events[e.id] = structuredClone(e);
  return { version: SEED_VERSION, events };
}

function readStore(): Store {
  if (!hasWindow()) return seedStore();
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) {
      const seeded = seedStore();
      window.localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as Store;
    if (!parsed || typeof parsed !== 'object' || !parsed.events) return seedStore();
    if (parsed.version !== SEED_VERSION) {
      for (const e of seed) if (!parsed.events[e.id]) parsed.events[e.id] = structuredClone(e);
      for (const e of Object.values(parsed.events)) {
        e.kind = normalizeEventKind(e.kind);
      }
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

export function listConnectionEvents(applicationId: string): ConnectionEvent[] {
  return Object.values(readStore().events)
    .filter((e) => e.applicationId === applicationId)
    .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
}

const makeId = () => `evt-${Math.random().toString(36).slice(2, 10)}`;

export function saveConnectionEvent(
  input: Omit<ConnectionEvent, 'id' | 'updatedAt'> & { id?: string },
): ConnectionEvent {
  const store = readStore();
  const id = input.id ?? makeId();
  const record: ConnectionEvent = { ...input, id, updatedAt: new Date().toISOString() };
  store.events[id] = record;
  writeStore(store);
  return record;
}

export function deleteConnectionEvent(id: string): void {
  const store = readStore();
  delete store.events[id];
  writeStore(store);
}
