/**
 * Governance Analytics V2 — the report model, its section catalogue, and the store.
 *
 * ## What changed from V1, and why
 *
 * V1 configured a report as *scope + filters + plots + sections*: four axes, three of
 * which were global. A reader adding "risk above 75" could not say whether it applied to
 * the permissions table, the charts, or everything — so the answer was "everything", and a
 * filter that belonged to one table silently rewrote the rest of the document.
 *
 * V2 moves configuration **into the section**. A report is four decisions —
 * name, description, *what part of the organisation*, *what period* — and then a list of
 * sections, each of which brings its own columns, its own filters and its own charts. The
 * two organisation-and-period answers are the only things that apply to the whole
 * document, which is exactly the pair a reader would expect to.
 *
 * ## The catalogue is data, not code
 *
 * A section is declared here — its key, its columns, the filters it offers, the charts it
 * draws — and rendered generically. Adding a section is an entry in `SECTION_CATALOGUE`,
 * not a new component, and the configuration screen and the edit dock both pick it up
 * without being told. Overview is the exception that looks at its siblings: it recaps
 * every other included section rather than reading the Directory itself.
 */

const STORE_KEY = 'iga.governance-analytics-v2.v1';
const SEED_VERSION = 2;

// ---- organisation ------------------------------------------------------

/**
 * What part of the organisation the report is about.
 *
 * `entire` carries no value; the rest name one. Kept as a discriminated pair rather than a
 * free-text scope so a report can never claim to be about a department that does not exist.
 */
export type OrganizationScope = 'entire' | 'department' | 'application' | 'governanceTeam';

export const ORGANIZATION_LABEL: Record<OrganizationScope, string> = {
  entire: 'Entire organisation',
  department: 'By department',
  application: 'By application',
  governanceTeam: 'By governance team',
};

export interface ReportOrganization {
  scope: OrganizationScope;
  /** Empty for `entire`, required for the rest. */
  value: string;
}

/**
 * The same four scopes as nouns.
 *
 * `ORGANIZATION_LABEL` is written for a picker ("By department"), and stripping the "By "
 * off it leaves a lowercase noun mid-sentence — "department: Engineering". A label that
 * reads correctly in a menu and one that reads correctly in a column are two strings, so
 * they are two records.
 */
export const ORGANIZATION_NOUN: Record<OrganizationScope, string> = {
  entire: 'Entire organisation',
  department: 'Department',
  application: 'Application',
  governanceTeam: 'Governance team',
};

export function describeOrganization(org: ReportOrganization): string {
  if (org.scope === 'entire') return ORGANIZATION_NOUN.entire;
  return org.value ? `${ORGANIZATION_NOUN[org.scope]}: ${org.value}` : ORGANIZATION_LABEL[org.scope];
}

// ---- timeline ----------------------------------------------------------

/**
 * The period the report covers.
 *
 * A fixed list rather than a date range picker: governance reporting runs on the
 * organisation's own calendar, and a reader asked for "Q1 2026" should not have to know
 * which two dates that is — nor should two readers disagree about it.
 */
export interface TimelineOption {
  id: string;
  label: string;
  /** The plain-English span, printed under the report title. */
  covers: string;
}

export const TIMELINE_OPTIONS: TimelineOption[] = [
  { id: 'fy-2026', label: 'Financial year 2026', covers: '1 Apr 2026 – 31 Mar 2027' },
  { id: 'fy-2025', label: 'Financial year 2025', covers: '1 Apr 2025 – 31 Mar 2026' },
  { id: 'q1-2026', label: 'Quarter 1, 2026', covers: '1 Apr 2026 – 30 Jun 2026' },
  { id: 'q2-2026', label: 'Quarter 2, 2026', covers: '1 Jul 2026 – 30 Sep 2026' },
  { id: 'q3-2026', label: 'Quarter 3, 2026', covers: '1 Oct 2026 – 31 Dec 2026' },
  { id: 'last-90', label: 'Last 90 days', covers: 'Rolling, from the day the report runs' },
  { id: 'all-time', label: 'All time', covers: 'Everything on record' },
];

export const timelineById = (id: string) => TIMELINE_OPTIONS.find((t) => t.id === id) ?? null;

// ---- the section catalogue --------------------------------------------

export type SectionCategory = 'Report' | 'Access' | 'Identity' | 'Governance';

/** The recap that opens a report — not a Directory table of its own. */
export const OVERVIEW_SECTION_ID = 'overview';

/** One filter a section offers. `values[0]` is the default and always means "no filter". */
export interface SectionFilterDef {
  id: string;
  label: string;
  values: string[];
  /** Values come from the tenant rather than this file — applications, departments. */
  dynamic?: 'applications';
}

export interface SectionColumnDef {
  id: string;
  header: string;
  /** `num` and `risk` are right-aligned; `risk` renders through `RiskScoreChip`. */
  type: 'text' | 'num' | 'risk' | 'status';
}

export interface SectionChartDef {
  id: string;
  title: string;
  shape: 'donut' | 'bar';
}

export interface SectionDef {
  id: string;
  category: SectionCategory;
  /** The reader-facing name — plain English, not the key. */
  title: string;
  description: string;
  columns: SectionColumnDef[];
  filters: SectionFilterDef[];
  charts: SectionChartDef[];
  /** Whether a new report includes it without being asked. */
  defaultOn: boolean;
}

/**
 * The sections V2 ships with.
 *
 * Overview sits first and default-on: it recaps every other included section. The Access
 * blocks carry the columns, filters and charts the specification names. Titles are
 * plain English — "All Permissions", not "high-risk-entitlements" — because the key is
 * for the URL and the store, and the reader of a governance report is not reading keys.
 */
export const SECTION_CATALOGUE: SectionDef[] = [
  {
    id: OVERVIEW_SECTION_ID,
    category: 'Report',
    title: 'Overview',
    description:
      'Opens the report with a recap of every other section you include — what each one found for this organisation and period.',
    columns: [],
    filters: [],
    charts: [],
    defaultOn: true,
  },
  {
    id: 'access-distribution',
    category: 'Access',
    title: 'How People Got Their Access',
    description: 'The different ways access was handed out, and how risky each one is.',
    columns: [
      { id: 'route', header: 'How it was given', type: 'text' },
      { id: 'grants', header: 'Times given', type: 'num' },
      { id: 'people', header: 'People', type: 'num' },
      { id: 'apps', header: 'Apps', type: 'num' },
      { id: 'risk', header: 'Risk', type: 'risk' },
    ],
    filters: [
      {
        id: 'route',
        label: 'How access was given',
        values: ['All', 'Given directly', 'Through a business role', 'Through a technical role', 'Given automatically'],
      },
      { id: 'risk', label: 'Permission risk', values: ['All', 'Critical', 'High', 'Medium', 'Low'] },
    ],
    charts: [
      { id: 'by-route', title: 'How People Got Access', shape: 'donut' },
      { id: 'by-risk', title: 'Access by Risk Level', shape: 'bar' },
    ],
    defaultOn: true,
  },
  {
    id: 'high-risk-entitlements',
    category: 'Access',
    title: 'All Permissions',
    description: 'Every permission in this report, how risky it is, and who holds it.',
    columns: [
      { id: 'permission', header: 'Permission', type: 'text' },
      { id: 'app', header: 'App', type: 'text' },
      { id: 'people', header: 'People', type: 'num' },
      { id: 'owner', header: 'Risk Owner', type: 'status' },
      { id: 'breaks', header: 'Rule breaks', type: 'num' },
      { id: 'risk', header: 'Owner Risk', type: 'risk' },
    ],
    filters: [
      { id: 'application', label: 'Application', values: ['All'], dynamic: 'applications' },
      { id: 'minRisk', label: 'Risk score above', values: ['All', '25', '50', '75', '90'] },
    ],
    charts: [
      { id: 'riskiest', title: 'Riskiest Permissions', shape: 'bar' },
      { id: 'by-risk', title: 'Permissions by Risk Level', shape: 'donut' },
    ],
    defaultOn: true,
  },
];

export const sectionDefById = (id: string) => SECTION_CATALOGUE.find((s) => s.id === id) ?? null;

// ---- the report --------------------------------------------------------

/** One section as this report configures it: whether it runs, where it sits, its filters. */
export interface ReportSectionV2 {
  id: string;
  enabled: boolean;
  /** Filter id → chosen value. Absent means the default, which is "no filter". */
  filters: Record<string, string>;
  /** Chart ids the reader has switched off. */
  hiddenCharts: string[];
}

export type ReportV2Status = 'draft' | 'ready';

export interface ReportV2 {
  id: string;
  name: string;
  description: string;
  organization: ReportOrganization;
  timelineId: string;
  /** Order is the array order — there is no `order` field to disagree with it. */
  sections: ReportSectionV2[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  status: ReportV2Status;
}

/** A blank report, with every default-on section already in it. */
export function draftReport(): Omit<ReportV2, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: '',
    description: '',
    organization: { scope: 'entire', value: '' },
    timelineId: 'fy-2026',
    sections: SECTION_CATALOGUE.filter((s) => s.defaultOn).map((s) => ({
      id: s.id,
      enabled: true,
      filters: {},
      hiddenCharts: [],
    })),
    createdBy: 'Aman Kumar',
    status: 'draft',
  };
}

// ---- store -------------------------------------------------------------

interface Store {
  version: number;
  reports: Record<string, ReportV2>;
}

const hasWindow = () => typeof window !== 'undefined';

/**
 * One sample report, so the gallery's "View a sample report" has something real to open
 * and the list is not empty on a first visit.
 */
function seedStore(): Store {
  const now = '2026-09-01T09:00:00.000Z';
  const sample: ReportV2 = {
    id: 'gar-sample',
    name: 'Access Posture — Engineering',
    description: 'How access reached the Engineering department this financial year, and what it carries.',
    organization: { scope: 'department', value: 'Engineering' },
    timelineId: 'fy-2026',
    sections: SECTION_CATALOGUE.map((s) => ({ id: s.id, enabled: true, filters: {}, hiddenCharts: [] })),
    createdBy: 'Aman Kumar',
    createdAt: now,
    updatedAt: now,
    status: 'ready',
  };
  return { version: SEED_VERSION, reports: { [sample.id]: sample } };
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
    if (!parsed?.reports || parsed.version !== SEED_VERSION) {
      const s = seedStore();
      window.localStorage.setItem(STORE_KEY, JSON.stringify(s));
      return s;
    }
    return parsed;
  } catch {
    return seedStore();
  }
}

function writeStore(s: Store) {
  if (hasWindow()) window.localStorage.setItem(STORE_KEY, JSON.stringify(s));
}

/** Newest first — a report list is read from the top. */
export function listReportsV2(): ReportV2[] {
  return Object.values(readStore().reports).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getReportV2(id: string): ReportV2 | null {
  return readStore().reports[id] ?? null;
}

export const SAMPLE_REPORT_ID = 'gar-sample';

export function createReportV2(input: Omit<ReportV2, 'id' | 'createdAt' | 'updatedAt'>): ReportV2 {
  const store = readStore();
  const now = new Date().toISOString();
  const report: ReportV2 = {
    ...input,
    id: `gar-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  };
  store.reports[report.id] = report;
  writeStore(store);
  return report;
}

export function updateReportV2(id: string, patch: Partial<Omit<ReportV2, 'id'>>): ReportV2 | null {
  const store = readStore();
  const current = store.reports[id];
  if (!current) return null;
  const next: ReportV2 = { ...current, ...patch, updatedAt: new Date().toISOString() };
  store.reports[id] = next;
  writeStore(store);
  return next;
}

export function deleteReportV2(id: string): void {
  const store = readStore();
  delete store.reports[id];
  writeStore(store);
}

/**
 * Move a section one place up or down.
 *
 * Lives here rather than in the component because order *is* the array, so the reorder and
 * the persistence are the same operation — a component that spliced its own copy would be
 * one render away from disagreeing with the store.
 */
export function moveSection(sections: ReportSectionV2[], id: string, direction: -1 | 1): ReportSectionV2[] {
  if (id === OVERVIEW_SECTION_ID) return sections;
  const from = sections.findIndex((s) => s.id === id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= sections.length) return sections;
  if (sections[to]?.id === OVERVIEW_SECTION_ID) return sections;
  const next = [...sections];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Move a section to an arbitrary index — what a drag ends with. */
export function reorderSection(sections: ReportSectionV2[], from: number, to: number): ReportSectionV2[] {
  if (from === to || from < 0 || to < 0 || from >= sections.length || to >= sections.length) return sections;
  if (sections[from]?.id === OVERVIEW_SECTION_ID || sections[to]?.id === OVERVIEW_SECTION_ID) return sections;
  const next = [...sections];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

// ---- the template gallery ---------------------------------------------

/**
 * What the create flow offers before a report exists.
 *
 * A template is not a section — it is a whole report someone has already thought through,
 * and the gallery is the same shape as the workflow and email ones so a reader meets one
 * idea rather than three. Only one is built; the rest hold their place, because the set of
 * reports the product intends to answer is itself information.
 */
export type ReportTemplateStatus = 'available' | 'comingSoon';

export interface ReportTemplateV2 {
  id: string;
  name: string;
  description: string;
  category: SectionCategory;
  /** The questions it answers — chips in the preview. */
  covers: string[];
  status: ReportTemplateStatus;
  /** The stored report this opens. Only set on `available` templates. */
  reportId?: string;
}

export const REPORT_TEMPLATES_V2: ReportTemplateV2[] = [
  {
    id: 'access-posture',
    name: 'Access Posture',
    description:
      'How access reached a part of the organisation over a period, and what that access carries.',
    category: 'Access',
    covers: ['Overview of included sections', 'How access was given', 'Every permission', 'Risk levels', 'Rule breaks'],
    status: 'available',
    reportId: 'gar-sample',
  },
  {
    id: 'joiner-mover-leaver',
    name: 'Joiner, Mover, Leaver',
    description:
      'What people arrived with, what changed when they moved, and what was left behind when they left.',
    category: 'Identity',
    covers: ['Access at joining', 'Access after a move', 'Leftover access'],
    status: 'comingSoon',
  },
];

/** Categories in gallery order — the rail's rows, and the grid's headings. */
export const REPORT_TEMPLATE_CATEGORIES: SectionCategory[] = ['Access', 'Identity', 'Governance'];

export const CATEGORY_HEADING: Record<SectionCategory, string> = {
  Report: 'Report templates',
  Access: 'Access templates',
  Identity: 'Identity templates',
  Governance: 'Governance templates',
};
