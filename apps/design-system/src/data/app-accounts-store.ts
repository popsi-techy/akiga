/**
 * App accounts created manually on an application.
 *
 * Seed catalog accounts stay immutable; this store holds admin-authored
 * records and merges into `directory.ts` at read time.
 */

const STORE_KEY = 'iga.customAppAccounts.v1';

export interface CreateAppAccountInput {
  accountName: string;
  email: string;
  applicationId: string;
  identityId: string | null;
}

export interface StoredAppAccount extends CreateAppAccountInput {
  id: string;
  entitlementIds: string[];
  createdAt: string;
}

interface Store {
  accounts: Record<string, StoredAppAccount>;
}

const hasWindow = () => typeof window !== 'undefined';
const emptyStore = (): Store => ({ accounts: {} });

function readStore(): Store {
  if (!hasWindow()) return emptyStore();
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Store;
    if (!parsed?.accounts || typeof parsed.accounts !== 'object') return emptyStore();
    return parsed;
  } catch {
    return emptyStore();
  }
}

function writeStore(s: Store) {
  if (hasWindow()) window.localStorage.setItem(STORE_KEY, JSON.stringify(s));
}

const makeId = () => `aa-new-${Math.random().toString(36).slice(2, 10)}`;

export function listStoredAppAccounts(): StoredAppAccount[] {
  return Object.values(readStore().accounts).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getStoredAppAccount(id: string): StoredAppAccount | null {
  return readStore().accounts[id] ?? null;
}

export function createAppAccount(input: CreateAppAccountInput): StoredAppAccount {
  const now = new Date().toISOString();
  const record: StoredAppAccount = {
    id: makeId(),
    accountName: input.accountName.trim(),
    email: input.email.trim(),
    applicationId: input.applicationId,
    identityId: input.identityId,
    entitlementIds: [],
    createdAt: now,
  };
  const s = readStore();
  s.accounts[record.id] = record;
  writeStore(s);
  return record;
}
