/**
 * Emergency Access eligibility criteria — who may request an emergency profile.
 * Groups are OR'd together; conditions within a group are AND'd. Operator is
 * always Equals.
 */
import { listUsers } from './directory';
import { listBusinessRoles } from './catalog';
import { userIdentities } from './seed';

export type EligibilityAttribute =
  | 'specificUser'
  | 'businessRole'
  | 'location'
  | 'jobTitle'
  | 'department'
  | 'company'
  | 'employeeId'
  | 'username'
  | 'manager'
  | 'costCenter'
  | 'employeeType';

export interface EligibilityCondition {
  id: string;
  attribute?: EligibilityAttribute;
  operator: 'equals';
  value?: string;
}

export interface EligibilityGroup {
  id: string;
  /** Display name; defaults to "Group N" when created. */
  name: string;
  conditions: EligibilityCondition[];
  /** ISO timestamp of last create/update. */
  updatedAt: string;
}

export interface EligibilityAttributeOption {
  value: EligibilityAttribute | string;
  label: string;
  /** Non-selectable section header in the Attribute Select. */
  section?: boolean;
}

let _seq = 0;
function eid(prefix: string): string {
  _seq += 1;
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}${_seq}`;
}

export function newEligibilityCondition(): EligibilityCondition {
  return { id: eid('ec'), operator: 'equals' };
}

export function emptyEligibilityGroup(defaultName = 'Group 1'): EligibilityGroup {
  return {
    id: eid('eg'),
    name: defaultName,
    conditions: [newEligibilityCondition()],
    updatedAt: new Date().toISOString(),
  };
}

/** Stamp `updatedAt` to now — call when persisting create/edit. */
export function touchEligibilityGroup(group: EligibilityGroup): EligibilityGroup {
  return { ...group, updatedAt: new Date().toISOString() };
}

export function isEligibilityConditionValid(c: EligibilityCondition): boolean {
  return Boolean(c.attribute && c.operator === 'equals' && c.value?.trim());
}

export function isEligibilityGroupValid(g: EligibilityGroup): boolean {
  return Boolean(g.name?.trim()) && g.conditions.length > 0 && g.conditions.every(isEligibilityConditionValid);
}

/** Display name for a group, with fallback for legacy groups missing `name`. */
export function eligibilityGroupDisplayName(group: EligibilityGroup, index: number): string {
  return group.name?.trim() || `Group ${index + 1}`;
}

/** Attribute Select options — Specific User / Business Role, then Requester Attributes. */
export const ELIGIBILITY_ATTRIBUTE_OPTIONS: EligibilityAttributeOption[] = [
  { value: 'specificUser', label: 'Specific User' },
  { value: 'businessRole', label: 'Business Role' },
  { value: '__section_requester', label: 'Requester Attributes', section: true },
  { value: 'location', label: 'Location' },
  { value: 'jobTitle', label: 'Job Title' },
  { value: 'department', label: 'Department' },
  { value: 'company', label: 'Company' },
  { value: 'employeeId', label: 'Employee ID' },
  { value: 'username', label: 'Username' },
  { value: 'manager', label: 'Manager' },
  { value: 'costCenter', label: 'Cost Center' },
  { value: 'employeeType', label: 'Employee Type' },
];

/** Selectable (non-section) attribute options for the Attribute dropdown. */
export function eligibilityAttributeSelectOptions(): { value: string; label: string; disabled?: boolean }[] {
  return ELIGIBILITY_ATTRIBUTE_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
    disabled: Boolean(o.section),
  }));
}

const ATTR_LABEL: Record<EligibilityAttribute, string> = {
  specificUser: 'Specific User',
  businessRole: 'Business Role',
  location: 'Location',
  jobTitle: 'Job Title',
  department: 'Department',
  company: 'Company',
  employeeId: 'Employee ID',
  username: 'Username',
  manager: 'Manager',
  costCenter: 'Cost Center',
  employeeType: 'Employee Type',
};

export function eligibilityAttributeLabel(attr?: EligibilityAttribute): string {
  return attr ? ATTR_LABEL[attr] : 'Attribute';
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

const FIXTURE = {
  location: ['New York', 'London', 'Bangalore', 'Berlin', 'Remote', 'San Francisco'],
  company: ['Acme Corp', 'Acme International', 'Acme Labs'],
  employeeId: ['EMP-1001', 'EMP-1002', 'EMP-1042', 'EMP-2088', 'EMP-3310'],
  username: ['liam.turner', 'marcus.lee', 'priya.sharma', 'bob.smith', 'hana.kim'],
  manager: ['Priya Sharma', 'Hana Kim', 'Emily Davis', 'Marcus Lee', 'Olivia Martin'],
  costCenter: ['CC-100', 'CC-200', 'CC-310', 'CC-450', 'CC-900'],
  employeeType: ['Full-time', 'Contractor', 'Intern', 'Part-time'],
};

/** Value options for a given attribute (id+label for entity picks; plain strings otherwise). */
export function valuesForEligibilityAttribute(
  attribute: EligibilityAttribute | undefined,
): { value: string; label: string }[] {
  if (!attribute) return [];
  if (attribute === 'specificUser') {
    return listUsers().map((u) => ({ value: u.id, label: u.name }));
  }
  if (attribute === 'businessRole') {
    return listBusinessRoles().map((r) => ({ value: r.id, label: r.name }));
  }
  if (attribute === 'department') {
    return uniqueSorted(userIdentities.map((u) => u.department)).map((v) => ({ value: v, label: v }));
  }
  if (attribute === 'jobTitle') {
    return uniqueSorted(userIdentities.map((u) => u.jobTitle)).map((v) => ({ value: v, label: v }));
  }
  const list = FIXTURE[attribute as keyof typeof FIXTURE] ?? [];
  return list.map((v) => ({ value: v, label: v }));
}

/** Resolve a stored value to a display label (entity ids → names). */
export function eligibilityValueLabel(attribute: EligibilityAttribute | undefined, value?: string): string {
  if (!value) return '';
  if (!attribute) return value;
  const hit = valuesForEligibilityAttribute(attribute).find((o) => o.value === value);
  return hit?.label ?? value;
}

/** Chip text, e.g. "Department = Engineering". */
export function eligibilityConditionText(c: EligibilityCondition): string {
  const left = eligibilityAttributeLabel(c.attribute);
  const right = eligibilityValueLabel(c.attribute, c.value) || '…';
  return `${left} = ${right}`;
}

/** Fallback for groups created before `updatedAt` existed (stable demo stamp). */
const LEGACY_UPDATED_AT = '2020-08-12T12:23:00.000Z';

/**
 * Seeded groups, so the populated state of this feature is reachable without
 * building one by hand.
 *
 * Nothing used to seed this, which meant every profile opened on the empty state
 * and the whole populated Eligibility tab — the group cards, the bulk-select bar,
 * the search — could only be seen by walking a drawer with two selects. That is a
 * cost paid by anyone reviewing the screen, not just the person who built it.
 *
 * Two profiles, deliberately different shapes: one group with a single condition,
 * and a profile with two groups where one carries two conditions (an AND) — which
 * is what exercises the card's condition preview and the "matching any group"
 * copy. Timestamps are fixed instants, like every other seed here, so nothing
 * re-renders differently between server and client.
 */
const SEEDED_GROUPS: Record<string, EligibilityGroup[]> = {
  'ea-bitbucket-prod': [
    {
      id: 'eg-bitbucket-1',
      name: 'Platform engineers',
      updatedAt: '2026-07-14T09:20:00.000Z',
      conditions: [{ id: 'ec-bb-1', attribute: 'department', operator: 'equals', value: 'Engineering' }],
    },
  ],
  'ea-github-staging': [
    {
      id: 'eg-github-1',
      name: 'Engineering leads',
      updatedAt: '2026-07-28T15:05:00.000Z',
      conditions: [
        { id: 'ec-gh-1', attribute: 'department', operator: 'equals', value: 'Engineering' },
        { id: 'ec-gh-2', attribute: 'jobTitle', operator: 'equals', value: 'Engineering Manager' },
      ],
    },
    {
      id: 'eg-github-2',
      name: 'IT administrators',
      updatedAt: '2026-08-03T11:40:00.000Z',
      conditions: [{ id: 'ec-gh-3', attribute: 'department', operator: 'equals', value: 'IT' }],
    },
  ],
};

/**
 * In-memory eligibility store keyed by emergency-access profile id.
 *
 * Seeded from `SEEDED_GROUPS` with a deep copy, so an edit in one session cannot
 * reach back and mutate the seed for the next one.
 */
const store = new Map<string, EligibilityGroup[]>(
  Object.entries(SEEDED_GROUPS).map(([id, groups]) => [
    id,
    groups.map((g) => ({ ...g, conditions: g.conditions.map((c) => ({ ...c })) })),
  ]),
);

export function getEligibilityGroups(eaId: string): EligibilityGroup[] {
  const groups = store.get(eaId) ?? [];
  // Migrate legacy groups that predate `name` / `updatedAt`.
  return groups.map((g, i) => ({
    ...g,
    name: g.name?.trim() || `Group ${i + 1}`,
    updatedAt: g.updatedAt || LEGACY_UPDATED_AT,
    conditions: g.conditions.map((c) => ({ ...c })),
  }));
}

export function setEligibilityGroups(eaId: string, groups: EligibilityGroup[]): EligibilityGroup[] {
  const next = groups.map((g, i) => ({
    ...g,
    name: g.name?.trim() || `Group ${i + 1}`,
    updatedAt: g.updatedAt || LEGACY_UPDATED_AT,
    conditions: g.conditions.map((c) => ({ ...c })),
  }));
  store.set(eaId, next);
  return next;
}
