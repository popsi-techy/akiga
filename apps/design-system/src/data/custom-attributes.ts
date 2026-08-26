/**
 * Custom attribute schemas — extra fields on identities and accounts that
 * source systems do not already provide. One schema per attribute name.
 *
 * Hybrid persistence: the seed primes an empty store on first visit, then
 * localStorage is the source of truth. Screens call these functions; they never
 * touch storage themselves.
 */

const STORE_KEY = 'iga.customAttributes.v1';
const SEED_VERSION = 1;

export type CustomAttributeFieldType = 'text' | 'date' | 'toggle' | 'number' | 'select';

export const CUSTOM_ATTRIBUTE_FIELD_TYPES: {
  value: CustomAttributeFieldType;
  label: string;
  description: string;
}[] = [
  { value: 'text', label: 'Text Field', description: 'A free-text string.' },
  { value: 'date', label: 'Date Field', description: 'A calendar date.' },
  { value: 'toggle', label: 'Toggle', description: 'A yes / no flag.' },
  { value: 'number', label: 'Number Field', description: 'A numeric value.' },
  { value: 'select', label: 'Select Field', description: 'One value from a fixed list.' },
];

export function customAttributeFieldTypeLabel(type: CustomAttributeFieldType): string {
  return CUSTOM_ATTRIBUTE_FIELD_TYPES.find((t) => t.value === type)?.label ?? type;
}

export interface CustomAttribute {
  id: string;
  displayName: string;
  /** Machine name. Letters, digits, underscore; starts with a letter. Unique. */
  attributeName: string;
  fieldType: CustomAttributeFieldType;
  description: string;
  /** Optional regex applied to text and number values. */
  validationRule: string;
  /** Choices when `fieldType` is `select`. */
  options: string[];
  required: boolean;
  unique: boolean;
  /** Offer this attribute as a matcher when correlating accounts to identities. */
  correlation: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CustomAttributeDraft = Omit<CustomAttribute, 'id' | 'createdAt' | 'updatedAt'>;

interface Store {
  version: number;
  attributes: Record<string, CustomAttribute>;
}

const hasWindow = () => typeof window !== 'undefined';

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function attr(
  partial: Omit<CustomAttribute, 'createdAt' | 'updatedAt'> & { stamp: string },
): CustomAttribute {
  const { stamp, ...rest } = partial;
  return { ...rest, createdAt: stamp, updatedAt: stamp };
}

function seedStore(): Store {
  const stamp = '2026-08-18T10:00:00.000Z';
  const list: CustomAttribute[] = [
    attr({
      id: 'ca-cost-center',
      displayName: 'Cost Center',
      attributeName: 'cost_center',
      fieldType: 'text',
      description: 'Finance reporting code on the identity and its accounts.',
      validationRule: '',
      options: [],
      required: true,
      unique: false,
      correlation: true,
      stamp,
    }),
    attr({
      id: 'ca-employee-type',
      displayName: 'Employee Type',
      attributeName: 'employee_type',
      fieldType: 'select',
      description: 'How this person is engaged.',
      validationRule: '',
      options: ['Full-time', 'Contractor', 'Intern', 'Vendor'],
      required: true,
      unique: false,
      correlation: false,
      stamp,
    }),
    attr({
      id: 'ca-termination-date',
      displayName: 'Termination Date',
      attributeName: 'Termination_Date',
      fieldType: 'date',
      description: 'Last day of employment, when known.',
      validationRule: '',
      options: [],
      required: false,
      unique: false,
      correlation: false,
      stamp,
    }),
    attr({
      id: 'ca-department',
      displayName: 'Department',
      attributeName: 'department',
      fieldType: 'text',
      description: 'Owning organisation unit.',
      validationRule: '',
      options: [],
      required: false,
      unique: false,
      correlation: true,
      stamp,
    }),
    attr({
      id: 'ca-contractor',
      displayName: 'Contractor',
      attributeName: 'is_contractor',
      fieldType: 'toggle',
      description: 'True when this identity is not a full-time employee.',
      validationRule: '',
      options: [],
      required: false,
      unique: false,
      correlation: false,
      stamp,
    }),
    attr({
      id: 'ca-employee-id',
      displayName: 'Employee ID',
      attributeName: 'employee_id',
      fieldType: 'text',
      description: 'HR employee number. Used to match accounts to identities.',
      validationRule: '^[A-Za-z0-9-]+$',
      options: [],
      required: true,
      unique: true,
      correlation: true,
      stamp,
    }),
    attr({
      id: 'ca-hire-date',
      displayName: 'Hire Date',
      attributeName: 'hire_date',
      fieldType: 'date',
      description: 'First day of employment.',
      validationRule: '',
      options: [],
      required: false,
      unique: false,
      correlation: false,
      stamp,
    }),
    attr({
      id: 'ca-office',
      displayName: 'Office Location',
      attributeName: 'office_location',
      fieldType: 'text',
      description: 'Primary workplace city or site code.',
      validationRule: '',
      options: [],
      required: false,
      unique: false,
      correlation: false,
      stamp,
    }),
    attr({
      id: 'ca-job-level',
      displayName: 'Job Level',
      attributeName: 'job_level',
      fieldType: 'number',
      description: 'Numeric band used in role mining and access defaults.',
      validationRule: '',
      options: [],
      required: false,
      unique: false,
      correlation: false,
      stamp,
    }),
    attr({
      id: 'ca-work-mode',
      displayName: 'Work Mode',
      attributeName: 'work_mode',
      fieldType: 'select',
      description: 'Where this person usually works.',
      validationRule: '',
      options: ['Office', 'Hybrid', 'Remote'],
      required: false,
      unique: false,
      correlation: false,
      stamp,
    }),
    attr({
      id: 'ca-building',
      displayName: 'Building Code',
      attributeName: 'building_code',
      fieldType: 'text',
      description: 'Facilities identifier for badge and site access.',
      validationRule: '',
      options: [],
      required: false,
      unique: false,
      correlation: false,
      stamp,
    }),
  ];
  return {
    version: SEED_VERSION,
    attributes: Object.fromEntries(list.map((a) => [a.id, a])),
  };
}

function readStore(): Store {
  if (!hasWindow()) return seedStore();
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) {
      const s = seedStore();
      window.localStorage.setItem(STORE_KEY, JSON.stringify(s));
      return s;
    }
    const parsed = JSON.parse(raw) as Store;
    if (!parsed?.attributes || parsed.version !== SEED_VERSION) {
      const s = seedStore();
      window.localStorage.setItem(STORE_KEY, JSON.stringify(s));
      return s;
    }
    return parsed;
  } catch {
    return seedStore();
  }
}

function writeStore(s: Store): void {
  if (hasWindow()) window.localStorage.setItem(STORE_KEY, JSON.stringify(s));
}

export const ATTRIBUTE_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;

/** Suggest a machine name from a display name. Does not lowercase — operators often keep Title_Case. */
export function suggestAttributeName(displayName: string): string {
  return displayName
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^[0-9]+/, '');
}

export function parseSelectOptions(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of text.split('\n')) {
    const value = line.trim();
    if (!value || seen.has(value.toLowerCase())) continue;
    seen.add(value.toLowerCase());
    out.push(value);
  }
  return out;
}

export function isValidRegex(pattern: string): boolean {
  if (!pattern.trim()) return true;
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

export function emptyCustomAttributeDraft(): CustomAttributeDraft {
  return {
    displayName: '',
    attributeName: '',
    fieldType: 'text',
    description: '',
    validationRule: '',
    options: [],
    required: false,
    unique: false,
    correlation: false,
  };
}

/** Display-name order, then attribute name. */
export function listCustomAttributes(): CustomAttribute[] {
  return Object.values(readStore().attributes).sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }),
  );
}

export function getCustomAttribute(id: string): CustomAttribute | null {
  return readStore().attributes[id] ?? null;
}

export function attributeNameTaken(attributeName: string, exceptId?: string): boolean {
  const key = attributeName.toLowerCase();
  return listCustomAttributes().some((a) => a.attributeName.toLowerCase() === key && a.id !== exceptId);
}

export function createCustomAttribute(draft: CustomAttributeDraft): CustomAttribute | null {
  if (attributeNameTaken(draft.attributeName)) return null;
  const s = readStore();
  const id = newId('ca');
  const stamp = nowIso();
  const record: CustomAttribute = { ...draft, id, createdAt: stamp, updatedAt: stamp };
  s.attributes[id] = record;
  writeStore(s);
  return record;
}

export function updateCustomAttribute(id: string, draft: CustomAttributeDraft): CustomAttribute | null {
  if (attributeNameTaken(draft.attributeName, id)) return null;
  const s = readStore();
  const existing = s.attributes[id];
  if (!existing) return null;
  const record: CustomAttribute = { ...existing, ...draft, id, updatedAt: nowIso() };
  s.attributes[id] = record;
  writeStore(s);
  return record;
}

export function deleteCustomAttribute(id: string): void {
  const s = readStore();
  delete s.attributes[id];
  writeStore(s);
}
