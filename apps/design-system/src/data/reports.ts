/**
 * Reports — the one catalogue behind the Reports hub.
 *
 * Three things live here that used to be three modules: the operational registers an
 * administrator runs, the compliance packages an assessor asks for, and the schedules that
 * produce the second on a cadence. They are one module because they are one question asked
 * at three altitudes — *what does our access look like*, *can we prove it*, and *prove it
 * again every quarter without being asked* — and because a compliance package is literally
 * a set of operational registers sealed together.
 *
 * Custom analytics is deliberately **not** here: it already exists as Governance Analytics
 * V2, and the hub reads that module rather than copying its templates into a fourth list.
 *
 * Read-only seed. Nothing on this screen is editable yet except a schedule's enabled flag,
 * so there is no store and no localStorage — when the first write lands, it follows the
 * pattern in `data/connection-events.ts` rather than growing a second one here.
 */

import type { StatusIntent } from '@ds/components';

/* ------------------------------------------------------------------ status */

/**
 * Every state anything in this module can be in, and the chip it renders as.
 *
 * One table, because the alternative is what the screenshots show: "Launched" tinted blue
 * in a campaign list, "Partial" tinted yellow in a clause matrix and "Skipped" tinted grey
 * in a schedule table, each decided at its own call site, and none of them able to tell you
 * why. Here the mapping is a fact about the domain — a run that is going is `info`, a
 * requirement half-covered is `warning`, a thing not built yet is `neutral` — and every
 * table in the hub reads it from the same place.
 *
 * `warning` rather than a literal orange for Partial: the visual language reserves brand
 * orange for selection and the current step (§5.1), so a status may not spend it. The
 * warning token is the amber the rest of the product already uses for "attention, not
 * failure", which is exactly what a partially evidenced clause is.
 */
export type ReportState =
  // operational runs
  | 'launched'
  | 'completed'
  | 'failed'
  // compliance evidence
  | 'evidenced'
  | 'partial'
  | 'notEvidenced'
  // schedules
  | 'enabled'
  | 'paused'
  | 'skipped'
  | 'neverRun'
  // anything catalogued but not built
  | 'comingSoon';

export const REPORT_STATE: Record<ReportState, { label: string; intent: StatusIntent }> = {
  launched: { label: 'Launched', intent: 'info' },
  completed: { label: 'Completed', intent: 'success' },
  failed: { label: 'Failed', intent: 'danger' },

  evidenced: { label: 'Evidenced', intent: 'success' },
  partial: { label: 'Partial', intent: 'warning' },
  notEvidenced: { label: 'Not evidenced', intent: 'danger' },

  enabled: { label: 'Enabled', intent: 'success' },
  paused: { label: 'Paused', intent: 'neutral' },
  skipped: { label: 'Skipped', intent: 'warning' },
  neverRun: { label: 'Never run', intent: 'neutral' },

  comingSoon: { label: 'Coming soon', intent: 'neutral' },
};

/* ------------------------------------------------------------ navigation */

/**
 * Where Custom Analytics lives, for the pages that live under it.
 *
 * Governance Analytics V2 kept its own routes when it moved into the hub — the builder, the
 * template gallery and the report view are all still at `/iga/governance-analytics-v2/*`.
 * What it lost was its sidebar entry, and with it any reason for a reader arriving from
 * Reports to be told they are in "Governance Analytics V2": the trail has to lead back to
 * the tab they came from, not to a module that no longer appears in the navigation.
 *
 * Exported as one constant rather than repeated at four call sites, because a trail that
 * disagrees with itself between two screens of the same flow is worse than no trail.
 */
export const CUSTOM_ANALYTICS_CRUMBS = [
  { label: 'Reports', href: '/iga/reports' },
  { label: 'Custom Analytics', href: '/iga/reports?tab=custom' },
] as const;

/* ------------------------------------------------- operational registers */

export type ReportCategory = 'access' | 'identity' | 'governance' | 'security';

export const REPORT_CATEGORY_LABEL: Record<ReportCategory, string> = {
  access: 'Access',
  identity: 'Identity',
  governance: 'Governance',
  security: 'Security',
};

export interface OperationalReport {
  id: string;
  name: string;
  description: string;
  category: ReportCategory;
  /** Where it opens. Absent means the register is catalogued but not built. */
  href?: string;
  /** Rows the last run returned — the reader's cue to how big this thing is. */
  rows?: number;
  /**
   * Whether the view carries an evidence header.
   *
   * Only the registers an assessor quotes need one: the provenance block states the
   * definition version, the window, that these are current records rather than a
   * reconstruction, and that the screen is unsealed. A campaign list is read by the person
   * running the campaigns, who needs none of that — and eleven rows of provenance above an
   * operational list is eleven rows they scroll past every time.
   */
  provenance?: boolean;
}

/**
 * The register catalogue.
 *
 * Two are built — the Access Assignment Register and the Access Certification Campaign
 * Report. The rest are catalogued and keep their place with a Coming soon tag rather than
 * being hidden: an administrator deciding whether IGA can answer a question needs to know
 * what it *will* answer, and a card marked "Coming soon" says that more honestly than an
 * absence — the same rule the Audit Logs landing page already follows.
 *
 * A register earns its `href` when it has a view behind it, and not before. A card that
 * opens a 404 is worse than a card that says it is not ready.
 */
export const OPERATIONAL_REPORTS: OperationalReport[] = [
  {
    id: 'access-assignment-register',
    name: 'Access Assignment Register',
    description:
      'Every entitlement held on every governed account, with who granted it, when, and on what justification, as at the reporting date.',
    category: 'access',
    href: '/iga/reports/view/access-assignment-register',
    rows: 169,
    provenance: true,
  },
  {
    id: 'privileged-and-remote-access',
    name: 'Privileged and Remote Access',
    description:
      'Access that is privileged, or that reaches a system classified as sensitive or remotely reachable, with the classification that put each grant in scope.',
    category: 'security',
  },
  {
    id: 'access-certification',
    name: 'Access Certification Campaign Report',
    description: 'Comprehensive access review and certification detail for every campaign.',
    category: 'governance',
    href: '/iga/reports/view/access-certification',
    rows: 24,
  },
  {
    id: 'sod-breaches',
    name: 'SoD Breaches Report',
    description: 'Segregation of duties violations, the rule each one broke, and whether it is still open.',
    category: 'governance',
  },
  {
    id: 'access-request-and-approval',
    name: 'Access Request and Approval',
    description: 'Requests raised, who approved them, how long each level took, and what was granted as a result.',
    category: 'access',
  },
  {
    id: 'role-and-entitlement-governance',
    name: 'Role and Entitlement Governance',
    description:
      'Every entitlement, business role and technical role with its owners, its classification and whether it is still current.',
    category: 'governance',
  },
  {
    id: 'access-change-and-revocation',
    name: 'Access Change and Revocation',
    description:
      'Entitlement assignments granted, revoked or removed during the reporting period, with who made each change and when it took effect.',
    category: 'access',
  },
  {
    id: 'identity-and-account-inventory',
    name: 'Identity and Account Inventory',
    description: 'Every identity and the accounts correlated to it, with lifecycle state and source system.',
    category: 'identity',
  },
  {
    id: 'orphan-and-dormant-accounts',
    name: 'Orphan and Dormant Accounts',
    description: 'Accounts with no owning identity, and accounts unused past the dormancy threshold.',
    category: 'identity',
  },
  {
    id: 'access-exceptions-and-open-items',
    name: 'Access Exceptions and Open Items',
    description:
      'Time-bound entitlement assignments and their expiry dates, including exceptions that remain active past the date they were due to end.',
    category: 'access',
  },
  {
    id: 'admin-audit',
    name: 'Admin Audit Report',
    description: 'Administrative activity across the tenant — who changed configuration, and what it was before.',
    category: 'security',
  },
  {
    id: 'jml-drift-analysis',
    name: 'JML Drift Analysis',
    description:
      'Access acquired at joining against access held now, so a mover who never lost the old job reads as drift rather than as normal.',
    category: 'identity',
  },
];

/* ------------------------------------------------- compliance frameworks */

export interface ComplianceFramework {
  id: string;
  name: string;
  /** The published version being evidenced against — an assessor quotes it back. */
  version: string;
  description: string;
  /** Absent means catalogued, not built. */
  href?: string;
  clausesInScope?: number;
}

export const COMPLIANCE_FRAMEWORKS: ComplianceFramework[] = [
  {
    id: 'sama-csf',
    name: 'SAMA Cyber Security Framework',
    version: 'SAMA CSF 1.0',
    description:
      'Identity and access governance evidence for the SAMA CSF, mapped clause by clause with the requirement text reproduced verbatim.',
    href: '/iga/reports/compliance/sama-csf',
    clausesInScope: 15,
  },
  {
    id: 'iso-27001',
    name: 'ISO/IEC 27001:2022',
    version: 'ISO 27001',
    description:
      'Annex A access control evidence. The same reports, mapped to ISO clauses instead — no new extraction, only a catalogue.',
  },
  {
    id: 'pci-dss-v4',
    name: 'PCI DSS v4.0',
    version: 'PCI DSS v4.0',
    description:
      'Requirement 7 and 8 evidence covering access to cardholder data, least privilege and account lifecycle.',
  },
];

export const frameworkById = (id: string) => COMPLIANCE_FRAMEWORKS.find((f) => f.id === id) ?? null;

export interface ComplianceClause {
  id: string;
  clause: string;
  subClause: string;
  /** Reproduced verbatim — an assessor matches this against their own copy. */
  requirement: string;
  ref: string;
  /** The operational register that evidences it, when one does. */
  evidencedBy?: string;
  /** The register's id, so a clause row can open the thing that evidences it. */
  evidencedById?: string;
  state: Extract<ReportState, 'evidenced' | 'partial' | 'notEvidenced'>;
}

export const SAMA_CLAUSES: ComplianceClause[] = [
  {
    id: 'c-1',
    clause: '3.3.5',
    subClause: 'N/A',
    requirement: 'Identity and Access Management',
    ref: 'N/A',
    state: 'notEvidenced',
  },
  {
    id: 'c-2',
    clause: '3.3.5.4',
    subClause: '4.b.1',
    requirement:
      'user access should be granted based on the need-to-have or need-to-know principles, and be limited to the minimum required.',
    ref: 'E02',
    evidencedBy: 'Access Assignment Register',
    evidencedById: 'access-assignment-register',
    state: 'partial',
  },
  {
    id: 'c-3',
    clause: '3.3.5.4',
    subClause: '4.b.1',
    requirement:
      'user access should be granted based on the need-to-have or need-to-know principles, and be limited to the minimum required.',
    ref: 'E07',
    evidencedBy: 'Privileged and Remote Access',
    evidencedById: 'privileged-and-remote-access',
    state: 'partial',
  },
  {
    id: 'c-4',
    clause: '3.3.5.4',
    subClause: '4.b.4',
    requirement: 'the user access rights should be granted based on a formal approval process.',
    ref: 'E04',
    evidencedBy: 'Access Request and Approval',
    evidencedById: 'access-request-and-approval',
    state: 'evidenced',
  },
  {
    id: 'c-5',
    clause: '3.3.5.4',
    subClause: '4.b.6',
    requirement: 'periodically user access rights and profiles should be reviewed.',
    ref: 'E05',
    evidencedBy: 'Access Certification Campaign Report',
    evidencedById: 'access-certification',
    state: 'partial',
  },
  {
    id: 'c-6',
    clause: '3.3.5.4',
    subClause: '4.b.6',
    requirement: 'periodically user access rights and profiles should be reviewed.',
    ref: 'E06',
    evidencedBy: 'Role and Entitlement Governance',
    evidencedById: 'role-and-entitlement-governance',
    state: 'partial',
  },
  {
    id: 'c-7',
    clause: '3.3.5.4',
    subClause: '4.b.7',
    requirement: 'an audit trail of the user access management activities should be maintained.',
    ref: 'E04',
    evidencedBy: 'Access Change and Revocation',
    evidencedById: 'access-change-and-revocation',
    state: 'partial',
  },
  {
    id: 'c-8',
    clause: '3.3.5.4',
    subClause: '4.b.9',
    requirement: 'dormant and orphaned accounts should be identified and disabled.',
    ref: 'E09',
    evidencedBy: 'Orphan and Dormant Accounts',
    evidencedById: 'orphan-and-dormant-accounts',
    state: 'evidenced',
  },
  {
    id: 'c-9',
    clause: '3.3.14',
    subClause: 'N/A',
    requirement: 'Cyber Security Event Management',
    ref: 'N/A',
    state: 'notEvidenced',
  },
  {
    id: 'c-10',
    clause: '3.3.14.4',
    subClause: '4.c',
    requirement: 'security event logs should be protected against unauthorised modification and deletion.',
    ref: 'E14',
    state: 'notEvidenced',
  },
];

export const clausesForFramework = (frameworkId: string): ComplianceClause[] =>
  frameworkId === 'sama-csf' ? SAMA_CLAUSES : [];

/** How many clauses sit in each state — the coverage strip, and the readiness KPI. */
export function clauseCoverage(clauses: ComplianceClause[]) {
  return {
    evidenced: clauses.filter((c) => c.state === 'evidenced').length,
    partial: clauses.filter((c) => c.state === 'partial').length,
    notEvidenced: clauses.filter((c) => c.state === 'notEvidenced').length,
    total: clauses.length,
  };
}

/**
 * A gap is a clause an assessor would open the package and fail to find an answer for.
 *
 * Partial counts. A clause evidenced by a register that only holds current state, when the
 * requirement asks about a period, reads as answered right up until someone checks — which
 * is the worst moment to discover it.
 */
export const evidenceGaps = (clauses: ComplianceClause[]) =>
  clauses.filter((c) => c.state === 'notEvidenced' || c.state === 'partial');

/** The seal a package would carry if it were sealed right now. */
export function sealOutcome(clauses: ComplianceClause[]): Extract<ReportState, 'evidenced' | 'partial' | 'notEvidenced'> {
  const { evidenced, total } = clauseCoverage(clauses);
  if (evidenced === total && total > 0) return 'evidenced';
  if (evidenced === 0) return 'notEvidenced';
  return 'partial';
}

/* ---------------------------------------------------- sealed packages */

export interface SealedPackage {
  id: string;
  frameworkId: string;
  periodFrom: string;
  periodTo: string;
  sealedAt: string;
  generatedBy: string;
  trigger: 'Manual' | 'Scheduled';
  /** Shown in full, not truncated — it is the reference an assessor quotes back. */
  sha256: string;
  state: Extract<ReportState, 'evidenced' | 'partial' | 'notEvidenced'>;
}

export const SEALED_PACKAGES: SealedPackage[] = [
  {
    id: 'PKG-1B84C955-D6D',
    frameworkId: 'sama-csf',
    periodFrom: '2026-01-01',
    periodTo: '2026-09-16',
    sealedAt: '2026-09-16T10:03:00.000Z',
    generatedBy: 'harsh.rajani@xecurify.com',
    trigger: 'Manual',
    sha256: 'f7e7d7dc4463a1b0c9d2e5f4a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9',
    state: 'partial',
  },
  {
    id: 'PKG-5A64486B-E98',
    frameworkId: 'sama-csf',
    periodFrom: '2026-01-01',
    periodTo: '2026-09-15',
    sealedAt: '2026-09-15T16:51:00.000Z',
    generatedBy: 'scheduler',
    trigger: 'Scheduled',
    sha256: '76aeb12bcd82f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8',
    state: 'partial',
  },
  {
    id: 'PKG-F6902F6F-3CB',
    frameworkId: 'sama-csf',
    periodFrom: '2026-07-01',
    periodTo: '2026-09-15',
    sealedAt: '2026-09-15T16:26:00.000Z',
    generatedBy: 'harsh.rajani@xecurify.com',
    trigger: 'Manual',
    sha256: '42295a79f48d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f',
    state: 'partial',
  },
];

export const packagesForFramework = (frameworkId: string) =>
  SEALED_PACKAGES.filter((p) => p.frameworkId === frameworkId);

/**
 * The package sealed most recently, across every framework.
 *
 * "Last delivered" is a fact about the tenant, not about a framework, so it is not scoped:
 * a reader arriving at the hub wants to know whether anything has come out of here lately,
 * and which framework it belonged to is the second question, answered by where it links.
 */
export function latestSealedPackage(packages: SealedPackage[] = SEALED_PACKAGES): SealedPackage | null {
  return packages.slice().sort((a, b) => b.sealedAt.localeCompare(a.sealedAt))[0] ?? null;
}

/* --------------------------------------------------------- schedules */

export type Cadence = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annual';

export interface ReportSchedule {
  id: string;
  name: string;
  frameworkId: string;
  frameworkLabel: string;
  cadence: Cadence;
  /** The window each run covers, stored as a rule rather than as dates. */
  covers: string;
  timezone: string;
  lastRunAt?: string;
  lastRunState: Extract<ReportState, 'completed' | 'failed' | 'skipped' | 'neverRun'>;
  /** The next firing, as an instant. Drives the hub's first KPI. */
  nextRunAt: string;
  enabled: boolean;
  recipients: string[];
}

export const REPORT_SCHEDULES: ReportSchedule[] = [
  {
    id: 'sch-1',
    name: 'SAMA_Quarterly_Package',
    frameworkId: 'sama-csf',
    frameworkLabel: 'SAMA CSF',
    cadence: 'Quarterly',
    covers: 'Previous calendar quarter',
    timezone: 'Asia/Kolkata',
    lastRunAt: '2026-09-09T02:00:00.000Z',
    lastRunState: 'skipped',
    nextRunAt: '2026-10-01T02:00:00.000Z',
    enabled: true,
    recipients: ['compliance@xecurify.com'],
  },
  {
    id: 'sch-2',
    name: 'SAMA_Annual_Package',
    frameworkId: 'sama-csf',
    frameworkLabel: 'SAMA CSF',
    cadence: 'Annual',
    covers: 'Previous calendar year',
    timezone: 'Asia/Kolkata',
    lastRunState: 'neverRun',
    nextRunAt: '2027-01-01T02:00:00.000Z',
    enabled: true,
    recipients: ['compliance@xecurify.com', 'ciso@xecurify.com'],
  },
  {
    id: 'sch-3',
    name: 'Monthly_Access_Review_Pack',
    frameworkId: 'sama-csf',
    frameworkLabel: 'SAMA CSF',
    cadence: 'Monthly',
    covers: 'Previous calendar month',
    timezone: 'America/New_York',
    lastRunAt: '2026-09-01T06:00:00.000Z',
    lastRunState: 'completed',
    nextRunAt: '2026-10-01T06:00:00.000Z',
    enabled: false,
    recipients: ['it-governance@xecurify.com'],
  },
];

/**
 * The next run that will actually happen.
 *
 * Disabled subscriptions are excluded rather than shown greyed: the KPI answers "when does
 * the next package land", and a paused schedule's date is not an answer to that.
 */
export function nextScheduledRun(schedules: ReportSchedule[] = REPORT_SCHEDULES): ReportSchedule | null {
  return (
    schedules
      .filter((s) => s.enabled)
      .slice()
      .sort((a, b) => a.nextRunAt.localeCompare(b.nextRunAt))[0] ?? null
  );
}

/**
 * The subscriptions that produce one framework's packages.
 *
 * A framework card says how it is produced — "Quarterly, next Oct 1" — because a reader
 * looking at 8 of 15 clauses evidenced needs to know whether that number is about to be
 * sealed into an artefact and mailed, or is only a screen.
 */
export const schedulesForFramework = (frameworkId: string) =>
  REPORT_SCHEDULES.filter((s) => s.frameworkId === frameworkId);

/* ------------------------------------------------------------- attention */

/**
 * Something in the hub that is not doing what it was set up to do.
 *
 * This is the one summary the hub is allowed to lead with, and it is not a count of
 * reports. Counts of catalogued things were the old KPI strip: true, inert, and on the
 * wrong tab half the time. An attention item is the opposite — it exists only when
 * something is wrong, it names the one thing, and it carries the route that shows it.
 *
 * Ordered by severity, so the tile that shows the first one shows the worst one. A failed
 * run beats a skipped run (nothing was produced, and the attempt broke), a skipped run
 * beats missing evidence (the cadence is live but silently producing nothing), and missing
 * evidence is last because it is a state of the world rather than a malfunction.
 */
export interface ReportsAttentionItem {
  id: string;
  /** The finding, as a sentence fragment that can stand alone in a tile. */
  label: string;
  href: string;
}

export function reportsAttention(): ReportsAttentionItem[] {
  const runs = REPORT_SCHEDULES.filter((s) => s.enabled)
    .filter((s) => s.lastRunState === 'failed' || s.lastRunState === 'skipped')
    .sort((a, b) => (a.lastRunState === 'failed' ? -1 : b.lastRunState === 'failed' ? 1 : 0))
    .map((s) => ({
      id: `run-${s.id}`,
      label: `${s.name} — last run ${REPORT_STATE[s.lastRunState].label.toLowerCase()}`,
      href: '/iga/reports/schedules',
    }));

  // Only frameworks with a page behind them: a framework that is not built has no gaps,
  // it has no clauses, and reporting zero coverage on it would read as a failure to
  // evidence something nobody has been asked to evidence yet.
  const evidence = COMPLIANCE_FRAMEWORKS.filter((f) => f.href)
    .map((f) => ({ framework: f, gaps: evidenceGaps(clausesForFramework(f.id)).length }))
    .filter(({ gaps }) => gaps > 0)
    .map(({ framework, gaps }) => ({
      id: `evidence-${framework.id}`,
      label: `${framework.version} — ${gaps} ${gaps === 1 ? 'clause needs' : 'clauses need'} evidence`,
      href: framework.href as string,
    }));

  return [...runs, ...evidence];
}

export const CADENCE_OPTIONS: Cadence[] = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual'];

export const COVERS_OPTIONS = [
  'Previous calendar quarter',
  'Previous calendar month',
  'Previous calendar year',
  'Last 30 days',
  'Year to date',
];

export const TIMEZONE_OPTIONS = [
  'Asia/Kolkata',
  'Asia/Riyadh',
  'Europe/London',
  'America/New_York',
  'UTC',
];
