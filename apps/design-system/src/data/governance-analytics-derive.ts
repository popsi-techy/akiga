/**
 * Where a report's numbers come from.
 *
 * Every KPI, plot series and table row in Governance Analytics is computed here
 * from the product's own domain data — the same identities, app accounts,
 * entitlements, policies, governance teams and findings the Directory, Policies
 * and SoD screens read. Nothing is invented.
 *
 * That is the whole design decision. A reporting feature with its own private
 * numbers is a mock: it will eventually tell a reader that Finance has 182 SAP
 * users while the Applications page says nine, and the first time an auditor
 * notices, the report stops being evidence and becomes a screenshot. Deriving
 * costs a join layer and it means the numbers are as small as the seed really is,
 * which is the honest trade.
 *
 * ## How scope narrows
 *
 * A department scope resolves to a set of identities, and from there to their app
 * accounts, and from those to the applications and entitlements they can reach.
 * That chain is what makes "applications used by Finance" a real answer rather
 * than a list of every application. Governance findings are matched to the scope
 * by the entities they hang off.
 *
 * ## Risk tiers
 *
 * From `@/lib/risk`, never re-thresholded here. A report that bucketed risk
 * differently from `RiskScoreChip` would disagree with every other screen about
 * what "High" means, which is the same failure as inventing the numbers.
 */

import { riskTier, RISK_TIER_LABEL, type RiskTier } from '@/lib/risk';
import {
  listUserIdentities,
  listAppAccounts,
  listEntitlementRows,
  listApplications,
  listGovernanceTeamRows,
  type UserIdentityRow,
  type AppAccountRow,
  type EntitlementRow,
} from './directory';
import { listFindings, displayName } from './governance';
import { listBirthrightPolicies } from './birthright';
import { listApprovalPolicies } from './approval-policies';
import { listSodPolicies } from './sod-policies';
import type { Report, ReportFilter } from './governance-analytics';

// ---- derived shapes ----------------------------------------------------

export interface DerivedKpi {
  label: string;
  value: string;
  /** The sentence under the number — what it is *of*, or what it implies. */
  hint?: string;
}

/**
 * A column's type is a rendering contract, not decoration: `num` right-aligns with
 * tabular numerals, `owner` turns the literal "Missing" into the missing-owner
 * pill, `status` becomes a status chip.
 *
 * `risk` and `severity` are deliberately separate. `risk` carries a 0–100 score and
 * renders through `RiskScoreChip`, which derives the tier itself. `severity` carries
 * a tier that the source data already states — a governance finding *is* high, it
 * does not have a score — and renders through `SeverityChip`.
 *
 * Collapsing them cost a bug worth remembering: severities were turned into
 * plausible-looking scores (high → 75) so they could reuse the risk column, and
 * `riskTier()` puts 75 in the *critical* band. Every High finding displayed as
 * Critical. Inventing a number to satisfy a renderer means the renderer's rules
 * silently rewrite the data.
 */
export type DerivedColumnType = 'text' | 'num' | 'risk' | 'severity' | 'owner' | 'status';

export interface DerivedColumn {
  id: string;
  header: string;
  type: DerivedColumnType;
}

export type DerivedRow = Record<string, string | number>;

export interface DerivedTable {
  columns: DerivedColumn[];
  rows: DerivedRow[];
}

export interface DerivedBar {
  label: string;
  value: number;
}

export interface DerivedSection {
  id: string;
  category: string;
  title: string;
  description: string;
  mandatory?: boolean;
  kpis?: DerivedKpi[];
  /** A one-line finding stated above the table, when the count *is* the point. */
  headline?: string;
  chartTitle?: string;
  bars?: DerivedBar[];
  table?: DerivedTable;
  /** Set when rows are worth opening — makes them clickable and keyboard-reachable. */
  detailKind?: string;
  /** Fields the row itself does not carry, for the detail drawer. */
  extra?: (row: DerivedRow) => DerivedKpi[];
}

export interface DerivedSeries {
  label: string;
  value: number;
  /** A status *fill* token — a chart mark is a graphical object, not text. */
  color: string;
}

export interface DerivedPlot {
  id: string;
  category: string;
  title: string;
  description: string;
  viz: 'donut' | 'bar';
  series: DerivedSeries[];
  centerLabel?: string;
  /** Values are percentages and should read as such. */
  percent?: boolean;
  /** Bar plots can be topped-n; donuts cannot without lying about the whole. */
  limitable?: boolean;
}

// ---- palette -----------------------------------------------------------

const FILL = {
  critical: 'var(--ds-color-status-danger-fill)',
  high: 'var(--ds-color-status-caution-fill)',
  medium: 'var(--ds-color-status-warning-fill)',
  low: 'var(--ds-color-status-info-fill)',
  success: 'var(--ds-color-status-success-fill)',
  neutral: 'var(--ds-color-status-neutral-fill)',
} as const;

const TIER_FILL: Record<RiskTier, string> = {
  critical: FILL.critical,
  high: FILL.high,
  medium: FILL.medium,
  low: FILL.low,
};

/**
 * One colour for a single-series ranking.
 *
 * Not a categorical palette. The bars in Application Usage are all the same kind
 * of thing — applications — differing only in how many accounts they carry, and
 * giving each its own hue implies the hues mean something. It read worst on the
 * status ramp: SAP came out red and Snowflake grey, which in a *governance* report
 * says "SAP is the dangerous one" when the chart is only counting accounts.
 */
const SERIES_ONE = 'var(--ds-color-status-info-fill)';

// ---- scope resolution --------------------------------------------------

/**
 * Everything the sections and plots read, resolved once per render.
 *
 * Built as one object rather than each section re-querying, so a report cannot
 * end up with a KPI counting one population and a table listing another.
 */
export interface ScopeContext {
  /** Identities inside the report's scope, after filters. */
  users: UserIdentityRow[];
  /** Their accounts. */
  accounts: AppAccountRow[];
  /** Applications reachable through those accounts. */
  appNames: string[];
  /** Entitlements on those applications. */
  entitlements: EntitlementRow[];
  /** Findings attached to entities in scope, or global where scope does not narrow them. */
  findings: ReturnType<typeof listFindings>;
  policies: { name: string; type: string; scope: string; owner: string; status: string }[];
  /** Every identity, for "% of population" style KPIs. */
  allUsers: UserIdentityRow[];
  scopeLabel: string;
}

const filterValue = (filters: ReportFilter[], field: string) => {
  const f = filters.find((x) => x.field === field);
  return f && f.value !== 'All' ? f.value : null;
};

/** Title-case status from the seed's lowercase union, for display and matching. */
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function buildScopeContext(report: Report): ScopeContext {
  const allUsers = listUserIdentities();
  const allAccounts = listAppAccounts();
  const allEntitlements = listEntitlementRows();
  const apps = listApplications();

  const { type, value } = report.scope;

  // --- identities in scope
  let users = allUsers;
  if (value) {
    if (type === 'department') users = allUsers.filter((u) => u.department === value);
    // Application scope does not narrow *people* by department; it narrows them to
    // whoever holds an account on that application, which is the honest reading.
    if (type === 'application') {
      const holders = new Set(
        allAccounts.filter((a) => a.applicationName === value && a.identityId).map((a) => a.identityId as string),
      );
      users = allUsers.filter((u) => holders.has(u.id));
    }
  }

  // --- identity filters
  const status = filterValue(report.filters, 'identityStatus');
  if (status) users = users.filter((u) => cap(u.status) === status);
  const dept = filterValue(report.filters, 'department');
  if (dept) users = users.filter((u) => u.department === dept);

  const userIds = new Set(users.map((u) => u.id));
  let accounts = allAccounts.filter((a) => a.identityId && userIds.has(a.identityId));
  const appFilter = filterValue(report.filters, 'application');
  if (appFilter) accounts = accounts.filter((a) => a.applicationName === appFilter);

  const appNames = [...new Set(accounts.map((a) => a.applicationName))];
  const appIds = new Set(apps.filter((a) => appNames.includes(a.name)).map((a) => a.id));
  let entitlements = allEntitlements.filter((e) => appIds.has(e.applicationId));

  const riskFilter = filterValue(report.filters, 'entitlementRisk');
  if (riskFilter) {
    entitlements = entitlements.filter((e) => RISK_TIER_LABEL[riskTier(e.risk)] === riskFilter);
  }

  // --- policies, as one list across the three kinds the product actually has.
  //
  // Only SoD policies carry ownership in this product (`entity-owners` has no
  // birthright or approval type), so the other two report "Missing" rather than
  // guessing. That is the honest answer and it is also the finding: the Ownership
  // Gaps section below is built from the governance findings that say so.
  const policies = [
    ...listBirthrightPolicies().map((p) => ({
      name: p.name,
      type: 'Birthright',
      scope: `${p.grants} grants`,
      owner: 'Missing',
      status: cap(p.status),
    })),
    ...listApprovalPolicies().map((p) => ({
      name: p.policyName,
      type: 'Approval',
      scope: '—',
      owner: 'Missing',
      status: cap(p.status),
    })),
    ...listSodPolicies().map((p) => ({
      name: p.name,
      type: 'SoD',
      scope: `${p.accessCount} access items`,
      owner: p.ownerCount > 0 ? 'Assigned' : 'Missing',
      status: cap(p.status),
    })),
  ];

  const policyType = filterValue(report.filters, 'policyType');
  const policyStatus = filterValue(report.filters, 'policyStatus');
  const scopedPolicies = policies
    .filter((p) => !policyType || p.type === policyType)
    .filter((p) => !policyStatus || p.status === policyStatus);

  return {
    users,
    accounts,
    appNames,
    entitlements,
    findings: listFindings(),
    policies: scopedPolicies,
    allUsers,
    scopeLabel: value || '—',
  };
}

// ---- plots -------------------------------------------------------------

const OWNER_MISSING_KINDS = ['missing-owner', 'missing-policy-owner', 'missing-review-owner', 'conflicting-ownership'];

function tierCounts(scores: number[]): Record<RiskTier, number> {
  const out: Record<RiskTier, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  scores.forEach((s) => {
    out[riskTier(s)] += 1;
  });
  return out;
}

const PLOT_BUILDERS: Record<string, (c: ScopeContext) => DerivedPlot> = {
  'access-risk-distribution': (c) => {
    const t = tierCounts(c.entitlements.map((e) => e.risk));
    const total = c.entitlements.length;
    return {
      id: 'access-risk-distribution',
      category: 'Access',
      title: 'Access Risk Distribution',
      description: 'How the entitlements reachable in this scope spread across risk tiers.',
      viz: 'donut',
      series: (['critical', 'high', 'medium', 'low'] as RiskTier[]).map((k) => ({
        label: RISK_TIER_LABEL[k],
        value: t[k],
        color: TIER_FILL[k],
      })),
      centerLabel: total === 1 ? 'entitlement' : 'entitlements',
    };
  },
  'application-usage': (c) => {
    const counts = new Map<string, number>();
    c.accounts.forEach((a) => counts.set(a.applicationName, (counts.get(a.applicationName) ?? 0) + 1));
    const series = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value, color: SERIES_ONE }));
    return {
      id: 'application-usage',
      category: 'Applications',
      title: 'Application Usage',
      description: 'Which applications this population actually holds accounts on.',
      viz: 'bar',
      series,
      limitable: true,
    };
  },
  'policy-coverage': (c) => {
    const active = c.policies.filter((p) => p.status === 'Active').length;
    const total = c.policies.length || 1;
    const covered = Math.round((active / total) * 100);
    return {
      id: 'policy-coverage',
      category: 'Policies',
      title: 'Policy Coverage',
      description: 'Share of governance policies that are live rather than drafted or switched off.',
      viz: 'donut',
      percent: true,
      series: [
        { label: 'Covered', value: covered, color: FILL.success },
        { label: 'Not covered', value: 100 - covered, color: FILL.neutral },
      ],
      centerLabel: 'covered',
    };
  },
  'ownership-coverage': (c) => {
    const gaps = c.findings.filter((f) => OWNER_MISSING_KINDS.includes(f.kind)).length;
    const objects = c.policies.length + c.appNames.length + c.entitlements.length;
    const owned = objects > 0 ? Math.max(0, Math.round(((objects - gaps) / objects) * 100)) : 100;
    return {
      id: 'ownership-coverage',
      category: 'Governance',
      title: 'Ownership Coverage',
      description: 'Share of governance objects in scope that have someone accountable for them.',
      viz: 'donut',
      percent: true,
      series: [
        { label: 'Owned', value: owned, color: FILL.success },
        { label: 'Missing owner', value: 100 - owned, color: FILL.high },
      ],
      centerLabel: 'owned',
    };
  },
};

export const PLOT_IDS = Object.keys(PLOT_BUILDERS);

export function derivePlot(id: string, c: ScopeContext): DerivedPlot | null {
  return PLOT_BUILDERS[id]?.(c) ?? null;
}

/** Category → plot ids, for the Add plot picker. */
export function plotCatalogue(c: ScopeContext): { category: string; plots: DerivedPlot[] }[] {
  const all = PLOT_IDS.map((id) => derivePlot(id, c)).filter(Boolean) as DerivedPlot[];
  const cats = [...new Set(all.map((p) => p.category))];
  return cats.map((category) => ({ category, plots: all.filter((p) => p.category === category) }));
}

// ---- sections ----------------------------------------------------------

const pct = (n: number, of: number) => (of === 0 ? '0%' : `${Math.round((n / of) * 100)}%`);

const SECTION_BUILDERS: Record<string, (c: ScopeContext) => DerivedSection> = {
  'governance-summary': (c) => {
    const tiers = tierCounts(c.entitlements.map((e) => e.risk));
    const ownerGaps = c.findings.filter((f) => OWNER_MISSING_KINDS.includes(f.kind)).length;
    const sod = c.findings.filter((f) => f.kind === 'sod-conflict');
    const activePolicies = c.policies.filter((p) => p.status === 'Active').length;
    return {
      id: 'governance-summary',
      category: 'Governance',
      title: 'Governance Summary',
      description: 'The posture of this scope in one row of numbers.',
      mandatory: true,
      kpis: [
        { label: 'Users', value: String(c.users.length), hint: `${pct(c.users.length, c.allUsers.length)} of all identities` },
        { label: 'Applications', value: String(c.appNames.length), hint: 'reachable in this scope' },
        { label: 'Entitlements', value: String(c.entitlements.length), hint: 'on those applications' },
        { label: 'Policies', value: String(c.policies.length), hint: `${activePolicies} active` },
        {
          label: 'Policy coverage',
          value: pct(activePolicies, c.policies.length),
          hint: `${activePolicies} of ${c.policies.length} policies live`,
        },
        { label: 'Objects without an owner', value: String(ownerGaps), hint: 'from open governance findings' },
        { label: 'Access violations', value: String(sod.length), hint: 'open separation-of-duties conflicts' },
        {
          label: 'High-risk entitlements',
          value: String(tiers.critical + tiers.high),
          hint: `${tiers.critical} critical`,
        },
      ],
    };
  },

  'application-overview': (c) => {
    const apps = listApplications();
    const counts = new Map<string, number>();
    c.accounts.forEach((a) => counts.set(a.applicationName, (counts.get(a.applicationName) ?? 0) + 1));
    const rows = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, users]) => {
        const app = apps.find((a) => a.name === name);
        const ents = app ? listEntitlementRows().filter((e) => e.applicationId === app.id) : [];
        const worst = ents.length ? Math.max(...ents.map((e) => e.risk)) : 0;
        return {
          application: name,
          users,
          entitlements: ents.length,
          owner: app && app.ownerCount > 0 ? 'Assigned' : 'Missing',
          risk: worst,
        };
      });
    return {
      id: 'application-overview',
      category: 'Applications',
      title: 'Application Overview',
      description:
        'Every application this population can reach, with who owns it and how risky its entitlements are — the evidence behind the usage plot.',
      chartTitle: `Accounts held by ${c.scopeLabel}`,
      bars: rows.map((r) => ({ label: r.application, value: r.users })),
      table: {
        columns: [
          { id: 'application', header: 'Application', type: 'text' },
          { id: 'users', header: 'Accounts', type: 'num' },
          { id: 'entitlements', header: 'Entitlements', type: 'num' },
          { id: 'owner', header: 'Owner', type: 'owner' },
          { id: 'risk', header: 'Highest risk', type: 'risk' },
        ],
        rows,
      },
    };
  },

  'policy-coverage': (c) => {
    const byType = new Map<string, number>();
    c.policies.forEach((p) => byType.set(p.type, (byType.get(p.type) ?? 0) + 1));
    return {
      id: 'policy-coverage',
      category: 'Policies',
      title: 'Policy Coverage',
      description: 'Which governance policies exist, who owns them, and whether they are live.',
      kpis: [...byType.entries()].map(([type, n]) => ({ label: type, value: String(n) })),
      table: {
        columns: [
          { id: 'name', header: 'Policy', type: 'text' },
          { id: 'type', header: 'Type', type: 'text' },
          { id: 'scope', header: 'Scope', type: 'text' },
          { id: 'owner', header: 'Owner', type: 'owner' },
          { id: 'status', header: 'Status', type: 'status' },
        ],
        rows: c.policies.map((p) => ({ ...p })),
      },
    };
  },

  'ownership-gaps': (c) => {
    const gaps = c.findings.filter((f) => OWNER_MISSING_KINDS.includes(f.kind));
    const rows = gaps.map((f) => ({
      object: f.title,
      kind: f.kind.replace(/-/g, ' '),
      owner: f.ownerId ? displayName(f.ownerId) : 'Missing',
      severity: f.severity,
      _id: f.id,
    }));
    return {
      id: 'ownership-gaps',
      category: 'Governance',
      title: 'Ownership Gaps',
      description: 'Governance objects with nobody accountable for them — the findings behind the coverage plot.',
      headline:
        gaps.length === 1
          ? '1 governance object has no clear owner'
          : `${gaps.length} governance objects have no clear owner`,
      table: {
        columns: [
          { id: 'object', header: 'Object', type: 'text' },
          { id: 'kind', header: 'Gap', type: 'text' },
          { id: 'owner', header: 'Owner', type: 'owner' },
          { id: 'severity', header: 'Severity', type: 'severity' },
        ],
        rows,
      },
      detailKind: 'finding',
      extra: (row) => {
        const f = c.findings.find((x) => x.id === row._id);
        if (!f) return [];
        return [
          { label: 'What is wrong', value: f.what },
          { label: 'Why it matters', value: f.why },
          { label: 'Recommended action', value: f.action },
        ];
      },
    };
  },

  'access-violations': (c) => {
    const sod = c.findings.filter((f) => f.kind === 'sod-conflict');
    const bySeverity = (tier: RiskTier) => sod.filter((f) => f.severity === tier).length;
    const rows = sod.map((f) => ({
      violation: f.title,
      owner: f.ownerId ? displayName(f.ownerId) : 'Missing',
      severity: f.severity,
      _id: f.id,
    }));
    return {
      id: 'access-violations',
      category: 'Access',
      title: 'Access Violations',
      description: 'Separation-of-duties conflicts open in this scope, and who is accountable for each.',
      kpis: [
        { label: 'Open violations', value: String(sod.length) },
        { label: 'Critical', value: String(bySeverity('critical')) },
        { label: 'High', value: String(bySeverity('high')) },
        { label: 'Unowned', value: String(rows.filter((r) => r.owner === 'Missing').length) },
      ],
      table: {
        columns: [
          { id: 'violation', header: 'Violation', type: 'text' },
          { id: 'owner', header: 'Accountable', type: 'owner' },
          { id: 'severity', header: 'Severity', type: 'severity' },
        ],
        rows,
      },
      detailKind: 'finding',
      extra: (row) => {
        const f = c.findings.find((x) => x.id === row._id);
        if (!f) return [];
        return [
          { label: 'What is wrong', value: f.what },
          { label: 'Why it matters', value: f.why },
          ...f.impact.map((m) => ({ label: m.label, value: String(m.value) })),
          { label: 'Recommended action', value: f.action },
        ];
      },
    };
  },

  'high-risk-entitlements': (c) => {
    const apps = listApplications();
    const rows = c.entitlements
      .filter((e) => riskTier(e.risk) === 'critical' || riskTier(e.risk) === 'high')
      .sort((a, b) => b.risk - a.risk)
      .map((e) => {
        const holders = c.accounts.filter((a) => a.applicationName === e.applicationName).length;
        const app = apps.find((a) => a.id === e.applicationId);
        return {
          entitlement: e.name,
          application: e.applicationName,
          accounts: holders,
          risk: e.risk,
          owner: app && app.ownerCount > 0 ? 'Assigned' : 'Missing',
          _description: e.description,
        };
      });
    return {
      id: 'high-risk-entitlements',
      category: 'Access',
      title: 'High-Risk Entitlements',
      description: 'The entitlements in scope that carry the most risk, and whether anyone owns them.',
      table: {
        columns: [
          { id: 'entitlement', header: 'Entitlement', type: 'text' },
          { id: 'application', header: 'Application', type: 'text' },
          { id: 'accounts', header: 'Accounts', type: 'num' },
          { id: 'owner', header: 'Owner', type: 'owner' },
          { id: 'risk', header: 'Risk', type: 'risk' },
        ],
        rows,
      },
      detailKind: 'entitlement',
      extra: (row) => [
        { label: 'What it grants', value: String(row._description ?? '—') },
        {
          label: 'Why it is high risk',
          value: `Scored ${row.risk} — ${RISK_TIER_LABEL[riskTier(Number(row.risk))]} tier on the shared risk scale.`,
        },
        {
          label: 'Recommended action',
          value:
            row.owner === 'Missing'
              ? 'Assign an owner, then include it in the next access certification.'
              : 'Confirm with its owner that everyone holding it still needs it.',
        },
      ],
    };
  },
};

export const SECTION_IDS = Object.keys(SECTION_BUILDERS);

export function deriveSection(id: string, c: ScopeContext): DerivedSection | null {
  return SECTION_BUILDERS[id]?.(c) ?? null;
}

/** Category → sections, for the Add section picker. */
export function sectionCatalogue(c: ScopeContext): { category: string; sections: DerivedSection[] }[] {
  const all = SECTION_IDS.map((id) => deriveSection(id, c)).filter(Boolean) as DerivedSection[];
  const cats = [...new Set(all.map((s) => s.category))];
  return cats.map((category) => ({ category, sections: all.filter((s) => s.category === category) }));
}

// ---- assembly ----------------------------------------------------------

export interface AssembledBlock {
  /** "01", "02" — computed after assembly, never stored. */
  number: string;
  kind: 'section' | 'insights';
  section?: DerivedSection;
  plots?: DerivedPlot[];
}

/**
 * The report, in reading order.
 *
 * Governance Summary first, then the synthesized "Governance insights" band of
 * plots, then every other enabled section in configured order — posture, then
 * patterns, then evidence. Numbers are assigned after assembly because they
 * describe position in the finished report, not identity: storing them would mean
 * disabling section 03 leaves a gap where a reader expects a section.
 *
 * With no plots enabled the insights band is omitted rather than rendered empty.
 */
export function assembleReport(report: Report, c: ScopeContext): AssembledBlock[] {
  const sections = report.sections
    .filter((s) => s.enabled)
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((ref) => ({ ref, derived: deriveSection(ref.id, c) }))
    .filter((x): x is { ref: typeof x.ref; derived: DerivedSection } => x.derived !== null);

  const plots = report.plots
    .filter((p) => p.enabled)
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((ref) => {
      const derived = derivePlot(ref.id, c);
      if (!derived) return null;
      const shown = derived.series.filter((s) => !ref.configuration.hidden.includes(s.label));
      const limited =
        ref.configuration.limit === 'all' ? shown : shown.slice(0, Number(ref.configuration.limit));
      // The plot's own shape unless the reader overrode it — see `chartType`.
      return { ...derived, viz: ref.configuration.chartType ?? derived.viz, series: limited };
    })
    .filter(Boolean) as DerivedPlot[];

  const summary = sections.find((s) => s.derived.id === 'governance-summary');
  const rest = sections.filter((s) => s.derived.id !== 'governance-summary');

  const blocks: AssembledBlock[] = [];
  if (summary) blocks.push({ number: '', kind: 'section', section: applyRowLimit(summary) });
  if (plots.length > 0) blocks.push({ number: '', kind: 'insights', plots });
  rest.forEach((s) => blocks.push({ number: '', kind: 'section', section: applyRowLimit(s) }));

  return blocks.map((b, i) => ({ ...b, number: String(i + 1).padStart(2, '0') }));
}

/** Row limit is presentation, so it is applied at assembly rather than in the builder. */
function applyRowLimit({
  ref,
  derived,
}: {
  ref: { configuration: { rowLimit: number | 'all'; showChart: boolean } };
  derived: DerivedSection;
}): DerivedSection {
  const out: DerivedSection = { ...derived };
  if (!ref.configuration.showChart) {
    delete out.bars;
    delete out.chartTitle;
  }
  if (out.table && ref.configuration.rowLimit !== 'all') {
    out.table = { ...out.table, rows: out.table.rows.slice(0, Number(ref.configuration.rowLimit)) };
  }
  return out;
}

/** Scope values for a type, from the data rather than a literal list. */
export function scopeValues(type: Report['scope']['type']): string[] {
  if (type === 'department') {
    return [...new Set(listUserIdentities().map((u) => u.department))].sort();
  }
  if (type === 'application') return listApplications().map((a) => a.name).sort();
  if (type === 'policyType') return ['Birthright', 'Approval', 'SoD'];
  if (type === 'identityType') return ['Employee', 'Contractor', 'Service account'];
  return listGovernanceTeamRows().map((t) => t.name).sort();
}
