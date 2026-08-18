/**
 * Governance Analytics — the report model, the template library, and the store.
 *
 * The feature answers one question for a CISO: *show me everything important
 * about one part of the organisation*. A report is therefore not a dashboard but
 * an evidence artifact, and it always reads in the same order: KPIs (what is the
 * posture), plots (what should I notice), tables (what exactly is happening, and
 * what backs it up).
 *
 * ## Scope is not a filter
 *
 * `scope` answers "what am I analysing?" and `filters` answer "which subset?".
 * They are separate fields because merging them makes the report's own subject
 * ambiguous — a reader cannot tell whether Finance is the thing being reported on
 * or one of several conditions narrowing it. Every plot prints both at its foot
 * for the same reason.
 *
 * ## Save is generate
 *
 * There is no separate Generate action. A report that could be saved without
 * being generated would let the list show a row whose numbers nobody has ever
 * produced, and "last generated" would be a field that lies. See
 * `stampGenerated`.
 *
 * ## Where the numbers come from
 *
 * Nowhere in this file. Sections and plots are *derived* from the product's own
 * domain data by `governance-analytics-derive.ts` — the same identities,
 * accounts, entitlements, policies, teams and findings the Directory and SoD
 * screens read. A report that invented its own numbers would contradict the
 * screens a reader checks it against, and the contradiction is the one thing an
 * evidence artifact cannot survive.
 */

const STORE_KEY = 'iga.governance-analytics.v1';
/** Bump when the seed shape or content changes, so stale stores re-seed on load. */
const SEED_VERSION = 1;

// ---- scope -------------------------------------------------------------

/**
 * What a report can be *about*.
 *
 * Each type names the axis the whole report is organised around. The values come
 * from the product's own data rather than a literal list, so a report can never
 * be scoped to a department that does not exist — see `scopeValues`.
 */
export type ScopeType = 'department' | 'application' | 'policyType' | 'identityType' | 'governanceTeam';

export const SCOPE_TYPE_LABEL: Record<ScopeType, string> = {
  department: 'Department',
  application: 'Application',
  policyType: 'Policy Type',
  identityType: 'Identity Type',
  governanceTeam: 'Governance Team',
};

export interface ReportScope {
  type: ScopeType;
  /** Empty until chosen — an unscoped report cannot be saved. */
  value: string;
}

// ---- filters -----------------------------------------------------------

/**
 * The filter catalogue, grouped the way the reader thinks about it rather than
 * the way the data is stored.
 *
 * Shown only behind "Add filter". Listing twenty fields at once turns a narrowing
 * tool into a form, and a reader who has to read twenty labels to find one has
 * been given a worse version of no filters at all.
 */
export type FilterCategory = 'Identity' | 'Application' | 'Access' | 'Governance';

export interface FilterField {
  id: string;
  label: string;
  category: FilterCategory;
  values: string[];
}

export const FILTER_FIELDS: FilterField[] = [
  { id: 'identityStatus', label: 'Identity Status', category: 'Identity', values: ['All', 'Active', 'Inactive', 'Suspended'] },
  { id: 'identityType', label: 'Identity Type', category: 'Identity', values: ['All', 'Employee', 'Contractor', 'Service account'] },
  { id: 'jobRole', label: 'Job Role', category: 'Identity', values: ['All', 'Manager', 'Individual contributor', 'Executive'] },
  { id: 'location', label: 'Location', category: 'Identity', values: ['All', 'Pune', 'London', 'New York', 'Singapore'] },
  { id: 'department', label: 'Department', category: 'Identity', values: ['All'] },
  { id: 'application', label: 'Application', category: 'Application', values: ['All'] },
  { id: 'applicationType', label: 'Application Type', category: 'Application', values: ['All', 'SaaS', 'On-premise', 'Custom'] },
  { id: 'applicationOwner', label: 'Application Owner', category: 'Application', values: ['All', 'Assigned', 'Missing'] },
  { id: 'applicationStatus', label: 'Application Status', category: 'Application', values: ['All', 'Active', 'Onboarding', 'Retired'] },
  { id: 'entitlementRisk', label: 'Entitlement Risk', category: 'Access', values: ['All', 'Critical', 'High', 'Medium', 'Low'] },
  { id: 'accessType', label: 'Access Type', category: 'Access', values: ['All', 'Entitlement', 'Technical role', 'Business role'] },
  { id: 'privilegedAccess', label: 'Privileged Access', category: 'Access', values: ['All', 'Privileged only', 'Non-privileged'] },
  { id: 'violationStatus', label: 'Violation Status', category: 'Access', values: ['All', 'Open', 'Resolved'] },
  { id: 'policyType', label: 'Policy Type', category: 'Governance', values: ['All', 'Birthright', 'Approval', 'SoD'] },
  { id: 'policyStatus', label: 'Policy Status', category: 'Governance', values: ['All', 'Active', 'Draft', 'Inactive'] },
  { id: 'ownerStatus', label: 'Owner Status', category: 'Governance', values: ['All', 'Assigned', 'Missing'] },
  { id: 'governanceTeam', label: 'Governance Team', category: 'Governance', values: ['All'] },
];

export interface ReportFilter {
  field: string;
  value: string;
}

export const filterFieldById = (id: string) => FILTER_FIELDS.find((f) => f.id === id);

/** "Identity Status = Active · Entitlement Risk = High", for headers and plot feet. */
export function describeFilters(filters: ReportFilter[]): string {
  return filters
    .filter((f) => f.value && f.value !== 'All')
    .map((f) => `${filterFieldById(f.field)?.label ?? f.field} = ${f.value}`)
    .join(' · ');
}

/** "Department = Finance · Identity Status = Active" — a plot's provenance line. */
export function describeProvenance(scope: ReportScope, filters: ReportFilter[]): string {
  const head = scope.value ? `${SCOPE_TYPE_LABEL[scope.type]} = ${scope.value}` : 'No scope';
  const rest = describeFilters(filters);
  return rest ? `${head} · ${rest}` : head;
}

// ---- report ------------------------------------------------------------

export type ReportStatus = 'draft' | 'ready';

/** A plot or section in a report: which one, whether it runs, and where it sits. */
export interface ReportPlotRef {
  id: string;
  enabled: boolean;
  order: number;
  configuration: {
    /**
     * The reader's chart-type *override*, or null for the plot's own shape.
     *
     * Null rather than a copy of the library's default, so a bar-shaped dataset
     * stays a bar until somebody actually asks for a donut. Seeding this with
     * `'donut'` silently turned Application Usage — a ranked list of application
     * names — into a pie of five nearly equal slices, which is the one chart that
     * dataset must not be. Donut and bar are the only two options either way: a
     * plot library is not a chart builder.
     */
    chartType: 'donut' | 'bar' | null;
    /** Series the reader has switched off, by label. */
    hidden: string[];
    /** Bars only — All, or the top n. */
    limit: number | 'all';
  };
}

export interface ReportSectionRef {
  id: string;
  enabled: boolean;
  order: number;
  configuration: {
    rowLimit: number | 'all';
    showChart: boolean;
  };
}

export interface Report {
  id: string;
  name: string;
  description: string;
  /** The template it came from, for the header eyebrow and Change template. */
  templateId: string | null;
  scope: ReportScope;
  filters: ReportFilter[];
  plots: ReportPlotRef[];
  sections: ReportSectionRef[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  /** Null until the first save — save is what generates. */
  lastGeneratedAt: string | null;
  /** When the underlying governance data was read, which is not the same instant. */
  dataAsOf: string | null;
  status: ReportStatus;
}

// ---- templates ---------------------------------------------------------

export interface ReportTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  /** The chips on the card — what the reader gets without configuring anything. */
  covers: string[];
  scopeType: ScopeType;
  /** Empty means "ask the reader" (Start from scratch). */
  scopeValue: string;
  filters: ReportFilter[];
  plots: string[];
  sections: string[];
  /**
   * Renaming when the scope changes.
   *
   * A report called "Finance Governance Overview" that is now scoped to Legal is
   * mislabelled evidence, and the name is the first thing anyone reads. Applied
   * only while the report is unsaved — once someone has named a report, renaming
   * it underneath them would be worse than a stale default.
   */
  nameFor: (scopeValue: string) => string;
  descFor: (scopeValue: string) => string;
}

/** The Department template's sections, in the order §8 assembles them. */
const DEPARTMENT_SECTIONS = [
  'governance-summary',
  'application-overview',
  'policy-coverage',
  'ownership-gaps',
  'access-violations',
  'high-risk-entitlements',
];

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'department',
    name: 'Department Governance Overview',
    type: 'Department',
    description:
      'Everything that matters about one department: who is in it, what they can reach, which policies apply, and where accountability is missing.',
    covers: ['Identities', 'Applications', 'Entitlements', 'Policies', 'Ownership', 'Violations'],
    scopeType: 'department',
    scopeValue: 'Finance',
    filters: [{ field: 'identityStatus', value: 'Active' }],
    plots: ['access-risk-distribution', 'application-usage', 'policy-coverage', 'ownership-coverage'],
    sections: DEPARTMENT_SECTIONS,
    nameFor: (v) => `${v} Governance Overview`,
    descFor: (v) => `Governance posture and access risk for the ${v} department.`,
  },
];

export const templateById = (id: string | null) =>
  id ? REPORT_TEMPLATES.find((t) => t.id === id) ?? null : null;

/**
 * The eyebrow above a report's name.
 *
 * Falls back to the scope type for a report with no template — a scratch report
 * still has a subject, and "Department" is more use than an empty line.
 */
export function reportKindLabel(report: Report): string {
  return templateById(report.templateId)?.name ?? `${SCOPE_TYPE_LABEL[report.scope.type]} report`;
}

/**
 * The short type, for a table column.
 *
 * "Department", not "Department Governance Overview". A column is read under its
 * own header, so the cell should not restate it — and in a list where every row is
 * a Governance Overview, those two words are the only part of the string that
 * carries no information, while being the part that survives truncation. The full
 * template name still shows on the workspace header, where there is room for it.
 */
export function reportTypeLabel(report: Report): string {
  return SCOPE_TYPE_LABEL[report.scope.type];
}

// ---- deterministic clock ----------------------------------------------

/**
 * The seed's "now".
 *
 * A fixed instant, like every other seeded module here: `Date.now()` at module
 * scope makes the server and the client disagree about the timestamps in a
 * rendered report, and React calls that a hydration error. Real saves stamp the
 * actual clock, which is fine because they only ever happen in the browser.
 */
const SEED_NOW = '2026-08-13T18:12:00.000Z';

// ---- store -------------------------------------------------------------

interface Store {
  version: number;
  reports: Report[];
}

const hasWindow = () => typeof window !== 'undefined';

/** A template's defaults, as a report — the shape "Use template" produces. */
export function reportFromTemplate(template: ReportTemplate, createdBy = 'Aman Kumar'): Report {
  return {
    id: '',
    name: template.scopeValue ? template.nameFor(template.scopeValue) : '',
    description: template.scopeValue ? template.descFor(template.scopeValue) : '',
    templateId: template.id,
    scope: { type: template.scopeType, value: template.scopeValue },
    filters: template.filters.map((f) => ({ ...f })),
    plots: template.plots.map((id, i) => ({
      id,
      enabled: true,
      order: i,
      configuration: { chartType: null, hidden: [], limit: 'all' },
    })),
    sections: template.sections.map((id, i) => ({
      id,
      enabled: true,
      order: i,
      configuration: { rowLimit: 'all', showChart: true },
    })),
    createdBy,
    createdAt: SEED_NOW,
    updatedAt: SEED_NOW,
    lastGeneratedAt: null,
    dataAsOf: null,
    status: 'draft',
  };
}

/** An empty report — Start from scratch. Scope deliberately unset. */
export function blankReport(createdBy = 'Aman Kumar'): Report {
  return {
    id: '',
    name: '',
    description: '',
    templateId: null,
    scope: { type: 'department', value: '' },
    filters: [],
    plots: [],
    sections: [],
    createdBy,
    createdAt: SEED_NOW,
    updatedAt: SEED_NOW,
    lastGeneratedAt: null,
    dataAsOf: null,
    status: 'draft',
  };
}

function seedStore(): Store {
  const finance = reportFromTemplate(REPORT_TEMPLATES[0]);
  const reports: Report[] = [
    {
      ...finance,
      id: 'gar-finance-overview',
      lastGeneratedAt: SEED_NOW,
      dataAsOf: SEED_NOW,
      status: 'ready',
    },
  ];
  return { version: SEED_VERSION, reports };
}

function readStore(): Store {
  if (!hasWindow()) return seedStore(); // SSR: read-only seed view
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

function writeStore(store: Store) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    /* quota or private mode — the in-memory result still renders */
  }
}

export function listReports(): Report[] {
  return readStore().reports;
}

export function getReport(id: string): Report | null {
  return readStore().reports.find((r) => r.id === id) ?? null;
}

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `gar-${Date.now().toString(36)}-${idCounter}`;
}

/**
 * Save, which is also generate.
 *
 * Assigns an id on first save, marks the report ready, and stamps all three
 * timestamps — `updatedAt` because the record changed, `lastGeneratedAt` because
 * the numbers were produced, `dataAsOf` because the governance data was read.
 * They are three fields rather than one because an auditor asks three different
 * questions, and answering all of them with one instant is how a report starts
 * being trusted for something it cannot support.
 */
export function saveReport(input: Report): Report {
  const store = readStore();
  const now = new Date().toISOString();
  const saved: Report = {
    ...input,
    id: input.id || nextId(),
    name: input.name.trim() || 'Untitled report',
    status: 'ready',
    updatedAt: now,
    lastGeneratedAt: now,
    dataAsOf: now,
  };
  const i = store.reports.findIndex((r) => r.id === saved.id);
  if (i >= 0) store.reports[i] = saved;
  else store.reports.unshift(saved);
  writeStore(store);
  return saved;
}

export function deleteReport(id: string) {
  const store = readStore();
  store.reports = store.reports.filter((r) => r.id !== id);
  writeStore(store);
}

/** Duplicate, unsaved-looking: a copy nobody has generated has no timestamps. */
export function duplicateReport(id: string): Report | null {
  const store = readStore();
  const source = store.reports.find((r) => r.id === id);
  if (!source) return null;
  const copy: Report = {
    ...structuredClone(source),
    id: nextId(),
    name: `${source.name} (copy)`,
    status: 'draft',
    lastGeneratedAt: null,
    dataAsOf: null,
  };
  store.reports.unshift(copy);
  writeStore(store);
  return copy;
}

// ---- validation --------------------------------------------------------

/**
 * What stops a save, in the reader's words.
 *
 * Two rules only. A report may legitimately be plots-only or sections-only —
 * "what should I notice" and "what exactly is happening" are different questions
 * and either is a valid thing to ask on its own — so the check is that *something*
 * is enabled, never that both are.
 */
export function reportBlockers(report: Report): string[] {
  const out: string[] = [];
  if (!report.scope.value) {
    out.push(`Select a ${SCOPE_TYPE_LABEL[report.scope.type].toLowerCase()} to define the report scope.`);
  }
  const anyPlots = report.plots.some((p) => p.enabled);
  const anySections = report.sections.some((s) => s.enabled);
  if (!anyPlots && !anySections) {
    out.push('Add at least one plot or section before saving this report.');
  }
  return out;
}

/**
 * Has the reader changed anything the template chose?
 *
 * Used to decide whether switching templates needs a confirmation. Comparing the
 * configuration rather than tracking a dirty flag means a reader who changes a
 * filter and changes it back is correctly treated as untouched.
 */
export function divergesFromTemplate(report: Report): boolean {
  const t = templateById(report.templateId);
  if (!t) return report.plots.length > 0 || report.sections.length > 0;
  const ids = (xs: { id: string; enabled: boolean }[]) => xs.filter((x) => x.enabled).map((x) => x.id).join(',');
  return (
    report.scope.value !== t.scopeValue ||
    describeFilters(report.filters) !== describeFilters(t.filters) ||
    ids(report.plots) !== t.plots.join(',') ||
    ids(report.sections) !== t.sections.join(',')
  );
}
