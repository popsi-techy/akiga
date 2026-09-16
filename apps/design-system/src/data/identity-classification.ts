/**
 * Identity classification — how users imported from a connected application are
 * typed on the way in. One default covers the whole source; rules override it when
 * a single feed carries more than one category (contractors alongside employees).
 *
 * Hybrid persistence, same contract as the other connector stores.
 */

export const IDENTITY_TYPES = [
  { value: 'workforce', label: 'Workforce' },
  { value: 'contractor', label: 'Contractor (External)' },
  { value: 'vendor', label: 'Vendor (External)' },
  { value: 'partner', label: 'Partner (External)' },
] as const;

export type IdentityTypeValue = (typeof IDENTITY_TYPES)[number]['value'];

export const CLASSIFICATION_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
] as const;

export type ClassificationOperator = (typeof CLASSIFICATION_OPERATORS)[number]['value'];

export interface ClassificationRule {
  id: string;
  operator: ClassificationOperator;
  value: string;
  identityType: IdentityTypeValue | '';
}

export interface IdentityClassification {
  applicationId: string;
  /** Used when no rule matches — and for every record when there are no rules. */
  defaultIdentityType: IdentityTypeValue | '';
  /** Source attribute every rule reads — e.g. userType. */
  classifyBasedOn: string;
  rules: ClassificationRule[];
  updatedAt: string;
}

const STORE_KEY = 'iga.identityClassification.v1';

interface Store {
  byApp: Record<string, IdentityClassification>;
}

const hasWindow = () => typeof window !== 'undefined';

const empty = (applicationId: string): IdentityClassification => ({
  applicationId,
  defaultIdentityType: '',
  classifyBasedOn: '',
  rules: [],
  updatedAt: new Date().toISOString(),
});

function readStore(): Store {
  if (!hasWindow()) return { byApp: {} };
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return { byApp: {} };
    const parsed = JSON.parse(raw) as Store;
    return parsed?.byApp && typeof parsed.byApp === 'object' ? parsed : { byApp: {} };
  } catch {
    return { byApp: {} };
  }
}

function writeStore(store: Store) {
  if (hasWindow()) window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

export function getIdentityClassification(applicationId: string): IdentityClassification {
  return readStore().byApp[applicationId] ?? empty(applicationId);
}

export function saveIdentityClassification(
  input: Omit<IdentityClassification, 'updatedAt'>,
): IdentityClassification {
  const record: IdentityClassification = { ...input, updatedAt: new Date().toISOString() };
  const store = readStore();
  store.byApp[input.applicationId] = record;
  writeStore(store);
  return record;
}

export const blankClassificationRule = (i: number): ClassificationRule => ({
  id: `cr-${Date.now().toString(36)}-${i}`,
  operator: 'equals',
  value: '',
  identityType: '',
});
