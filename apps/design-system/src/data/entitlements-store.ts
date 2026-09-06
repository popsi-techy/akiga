/**
 * Entitlements created manually or imported from CSV.
 *
 * Seed catalog entitlements stay immutable; this store holds admin-authored
 * records and merges into `directory.ts` at read time.
 */

const STORE_KEY = 'iga.customEntitlements.v1';

export interface CreateEntitlementInput {
  name: string;
  value: string;
  description: string;
  entitlementTypeId: string;
  risk: number;
  requestable: boolean;
  applicationId: string;
}

export interface StoredEntitlement extends CreateEntitlementInput {
  id: string;
  createdAt: string;
}

interface Store {
  entitlements: Record<string, StoredEntitlement>;
}

const hasWindow = () => typeof window !== 'undefined';
const emptyStore = (): Store => ({ entitlements: {} });

function readStore(): Store {
  if (!hasWindow()) return emptyStore();
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Store;
    if (!parsed?.entitlements || typeof parsed.entitlements !== 'object') return emptyStore();
    return parsed;
  } catch {
    return emptyStore();
  }
}

function writeStore(s: Store) {
  if (hasWindow()) window.localStorage.setItem(STORE_KEY, JSON.stringify(s));
}

const makeId = () => `ent-new-${Math.random().toString(36).slice(2, 10)}`;

function clampRisk(n: number) {
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function listStoredEntitlements(): StoredEntitlement[] {
  return Object.values(readStore().entitlements).sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
}

export function getStoredEntitlement(id: string): StoredEntitlement | null {
  return readStore().entitlements[id] ?? null;
}

export function createEntitlement(input: CreateEntitlementInput): StoredEntitlement {
  const now = new Date().toISOString();
  const record: StoredEntitlement = {
    id: makeId(),
    name: input.name.trim(),
    value: input.value.trim(),
    description: input.description.trim(),
    entitlementTypeId: input.entitlementTypeId,
    risk: clampRisk(input.risk),
    requestable: input.requestable,
    applicationId: input.applicationId,
    createdAt: now,
  };
  const s = readStore();
  s.entitlements[record.id] = record;
  writeStore(s);
  return record;
}

export interface CsvEntitlementRow {
  name: string;
  value: string;
  description: string;
  risk: number;
  requestable: boolean;
}

/** Minimal CSV parser for the sample template — comma-separated, no quoted commas. */
export function parseEntitlementCsv(text: string): CsvEntitlementRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const idx = (key: string) => headers.indexOf(key);

  const nameI = idx('name');
  const valueI = idx('value');
  const descI = idx('description');
  const riskI = idx('risk');
  const reqI = idx('requestable');

  if (nameI < 0 || valueI < 0 || descI < 0 || riskI < 0) return [];

  return lines.slice(1).flatMap((line) => {
    const cols = line.split(',').map((c) => c.trim());
    const name = cols[nameI] ?? '';
    const value = cols[valueI] ?? '';
    const description = cols[descI] ?? '';
    if (!name || !value || !description) return [];
    const risk = clampRisk(Number.parseInt(cols[riskI] ?? '0', 10) || 0);
    const requestable = reqI >= 0 ? ['true', 'yes', '1'].includes((cols[reqI] ?? '').toLowerCase()) : false;
    return [{ name, value, description, risk, requestable }];
  });
}

export function importEntitlementsFromCsv(
  rows: CsvEntitlementRow[],
  applicationId: string,
  entitlementTypeId: string,
): StoredEntitlement[] {
  return rows.map((row) =>
    createEntitlement({
      name: row.name,
      value: row.value,
      description: row.description,
      risk: row.risk,
      requestable: row.requestable,
      applicationId,
      entitlementTypeId,
    }),
  );
}

export const ENTITLEMENT_CSV_SAMPLE = `name,value,description,risk,requestable
PROD_DEPLOY,prod_deploy,Deploy to production environments,45,true
READ_ONLY,read_only,View-only access to application data,12,false`;

export function downloadEntitlementCsvSample() {
  if (!hasWindow()) return;
  const blob = new Blob([ENTITLEMENT_CSV_SAMPLE], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'entitlements-sample.csv';
  a.click();
  URL.revokeObjectURL(url);
}
