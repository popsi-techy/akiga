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
  {
    value: 'accounts-fetch',
    label: 'Accounts Fetch',
    direction: 'inbound',
    description: 'Import users from this application into IGA.',
  },
  {
    value: 'entitlements-fetch',
    label: 'Entitlements Fetch',
    direction: 'inbound',
    description: 'Import groups and entitlements from this application.',
  },
  {
    value: 'accounts-entitlements-fetch',
    label: 'Accounts and Entitlements Fetch',
    direction: 'inbound',
    description: 'Import users and their entitlements in one call.',
  },
  {
    value: 'account-create',
    label: 'Account Create',
    direction: 'outbound',
    description: 'Create an account when IGA grants access.',
  },
  {
    value: 'account-update',
    label: 'Account Update',
    direction: 'outbound',
    description: 'Update an account when its profile or access changes.',
  },
  {
    value: 'account-delete',
    label: 'Account Delete',
    direction: 'outbound',
    description: 'Disable or delete an account when IGA revokes access.',
  },
  {
    value: 'group-create',
    label: 'Group Create',
    direction: 'outbound',
    description: 'Create a group in this application.',
  },
  {
    value: 'group-update',
    label: 'Group Update',
    direction: 'outbound',
    description: 'Update a group in this application.',
  },
  {
    value: 'group-delete',
    label: 'Group Delete',
    direction: 'outbound',
    description: 'Remove a group from this application.',
  },
  {
    value: 'account-entitlement-assignment',
    label: 'Account Entitlement Assignment',
    direction: 'outbound',
    description: 'Grant an entitlement to an account.',
  },
  {
    value: 'account-entitlement-revocation',
    label: 'Account Entitlement Revocation',
    direction: 'outbound',
    description: 'Remove an entitlement from an account.',
  },
] as const;
/**
 * SCIM/UMAPI does not expose HTTP calls. The three resources a SCIM client
 * actually sends — users, groups, and who is in which group — are the whole
 * catalog, unlabeled by direction.
 */
export const SCIM_EVENT_KINDS = [
  { value: 'accounts-fetch', label: 'User import', description: 'Users this application pushes into IGA.' },
  { value: 'entitlements-fetch', label: 'Group Import', description: 'Groups this application pushes into IGA.' },
  { value: 'group-membership', label: 'Group membership', description: 'Who belongs to each imported group.' },
] as const;
export type EventKind =
  | (typeof EVENT_KINDS)[number]['value']
  | (typeof SCIM_EVENT_KINDS)[number]['value'];
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
  return (
    EVENT_KINDS.find((k) => k.value === kind) ??
    SCIM_EVENT_KINDS.find((k) => k.value === kind) ??
    EVENT_KINDS[0]
  );
}

/** Label on the SCIM event catalog; falls back to the REST name. */
export function scimEventLabel(kind: EventKind): string {
  return SCIM_EVENT_KINDS.find((k) => k.value === kind)?.label ?? eventKindMeta(kind).label;
}

export function normalizeEventKind(kind: string): EventKind {
  if (kind in KIND_ALIASES) return KIND_ALIASES[kind];
  if (EVENT_KINDS.some((k) => k.value === kind)) return kind as EventKind;
  if (SCIM_EVENT_KINDS.some((k) => k.value === kind)) return kind as EventKind;
  return EVENT_KINDS[0].value;
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
    { value: 'terminationDate', label: 'Termination date' },
  ],
};

/**
 * Attributes that are a date, and so cannot be read without knowing its shape.
 *
 * Every other attribute is a string IGA passes through. A date is a string that has to
 * parse, and an HR system will send 04/03/2026 meaning either the fourth of March or the
 * third of April — guessing produces a leaver date that is silently months wrong, which is
 * the one attribute where being wrong revokes the wrong person's access.
 *
 * `startDate` under custom-user is the obvious next member; it is not here yet because
 * nothing asked for it, and adding a required field to an attribute people already map
 * would make their finished rows incomplete.
 */
const DATE_ATTRIBUTES = new Set(['terminationDate']);

/** Whether this mapping has to declare an incoming date format. */
export const needsDateFormat = (m: Pick<AttributeMapping, 'igaAttribute' | 'expression'>) =>
  m.expression.trim() === '' && DATE_ATTRIBUTES.has(m.igaAttribute);

/**
 * The pattern rendered against one fixed instant, so the reader can see what they typed.
 *
 * Every field of the sample is a different number — March, the 9th, 17:04:05 — so no token
 * can look correct by coincidence. Returns null when the pattern carries no recognisable
 * token at all, which is the case worth saying something about.
 */
const SAMPLE = { yyyy: '2026', yy: '26', MMMM: 'March', MMM: 'Mar', MM: '03', dd: '09', HH: '17', mm: '04', ss: '05' };
const TOKEN = /yyyy|yy|MMMM|MMM|MM|dd|HH|mm|ss/g;

export function formatDateSample(pattern: string): string | null {
  const p = pattern.trim();
  if (p === '' || !TOKEN.test(p)) return null;
  TOKEN.lastIndex = 0;
  return p.replace(TOKEN, (t) => SAMPLE[t as keyof typeof SAMPLE]);
}

export interface AttributeMapping {
  id: string;
  source: AttributeSource;
  /** The field name the application expects. */
  applicationField: string;
  /** Which IGA attribute supplies it. Ignored when `expression` is set. */
  igaAttribute: string;
  /** Composes a value from several attributes — supersedes `igaAttribute`. */
  expression: string;
  /**
   * How the source system writes this date — `dd/MM/yyyy`, `yyyy-MM-dd`, and so on. Sync
   * checks the column against it once; a mismatch skips updating this field. Only for
   * `DATE_ATTRIBUTES`; ignored elsewhere.
   */
  dateFormat?: string;
}

/**
 * A row is finished when it names a field, has something to put in it, and — for a date —
 * says how that date is written. A termination date with no format is not a half-finished
 * row, it is a row that will parse wrongly on the first sync.
 */
export const mappingComplete = (m: AttributeMapping) =>
  m.applicationField.trim() !== '' &&
  (m.expression.trim() !== '' || m.igaAttribute !== '') &&
  (!needsDateFormat(m) || (m.dateFormat ?? '').trim() !== '');

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
const SEED_VERSION = 3;

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

/** The first configured call of this kind for an application, if any. */
export function getConnectionEventByKind(
  applicationId: string,
  kind: EventKind,
): ConnectionEvent | null {
  return listConnectionEvents(applicationId).find((e) => e.kind === kind) ?? null;
}

/** Returns an existing fetch event or creates a disabled stub the mapping UI can save into. */
export function ensureConnectionEventForKind(
  applicationId: string,
  kind: EventKind,
): ConnectionEvent {
  const existing = getConnectionEventByKind(applicationId, kind);
  if (existing) return existing;
  return saveConnectionEvent({
    ...emptyEvent(applicationId, kind),
    name: eventKindMeta(kind).label,
    enabled: false,
  });
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

/* ------------------------------------------------------ default mappings */

/**
 * The mapping a SCIM event is auto-filled with when the connection is made — the shipped
 * connector default. A tenant can reset back to it, or promote their own edits to be the
 * default from then on (kept per application + event in localStorage, overriding this).
 */
const SCIM_DEFAULT_MAPPINGS: Partial<Record<EventKind, Omit<AttributeMapping, 'id'>[]>> = {
  'accounts-fetch': [
    { source: 'user-profile', applicationField: 'userName', igaAttribute: 'email', expression: '' },
    { source: 'user-profile', applicationField: 'givenName', igaAttribute: 'firstName', expression: '' },
    { source: 'user-profile', applicationField: 'familyName', igaAttribute: 'lastName', expression: '' },
    { source: 'user-profile', applicationField: 'displayName', igaAttribute: '', expression: '[firstName] + " " + [lastName]' },
    { source: 'user-profile', applicationField: 'title', igaAttribute: 'jobTitle', expression: '' },
    { source: 'system', applicationField: 'externalId', igaAttribute: 'externalId', expression: '' },
  ],
};

const DEFAULTS_KEY = 'iga.scimDefaultMappings.v1';
const defaultsKey = (applicationId: string, kind: EventKind) => `${applicationId}:${kind}`;

function readDefaultOverrides(): Record<string, AttributeMapping[]> {
  if (!hasWindow()) return {};
  try {
    const raw = window.localStorage.getItem(DEFAULTS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, AttributeMapping[]>) : {};
  } catch {
    return {};
  }
}

/** The default mapping for an event — the tenant's promoted default, else the shipped one. */
export function getDefaultMapping(applicationId: string, kind: EventKind): AttributeMapping[] {
  const override = readDefaultOverrides()[defaultsKey(applicationId, kind)];
  const base: (AttributeMapping | Omit<AttributeMapping, 'id'>)[] =
    override ?? SCIM_DEFAULT_MAPPINGS[kind] ?? [];
  // Fresh ids so editor rows stay independent of the stored default.
  return base.map((m, i) => ({ ...m, id: `def-${i}-${Math.random().toString(36).slice(2, 7)}` }));
}

/** Promote a mapping to be this event's default from now on. */
export function setDefaultMapping(
  applicationId: string,
  kind: EventKind,
  attributes: AttributeMapping[],
): void {
  if (!hasWindow()) return;
  const all = readDefaultOverrides();
  all[defaultsKey(applicationId, kind)] = attributes.map((m) => ({ ...m }));
  window.localStorage.setItem(DEFAULTS_KEY, JSON.stringify(all));
}

export function deleteConnectionEvent(id: string): void {
  const store = readStore();
  delete store.events[id];
  writeStore(store);
}
