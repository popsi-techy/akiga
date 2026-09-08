/**
 * Governance Analytics V2 — where a section's rows and charts come from.
 *
 * Nowhere in `governance-analytics-v2.ts`. That file declares what a section *is* — its
 * columns, its filters, its charts — and this one fills it from the product's own domain
 * data: the same entitlements, accounts, applications and SoD findings the Directory and
 * SoD screens read. A report that invented its own numbers would contradict the screens a
 * reader checks it against, and that contradiction is the one thing an evidence artifact
 * cannot survive.
 *
 * Deterministic: no `Math.random`, no `Date.now`. The same report renders the same numbers
 * on the server and in the browser, and twice in a row.
 */
import { riskTier, RISK_TIER_LABEL, type RiskTier } from '@/lib/risk';
import {
  getEntitlementDetail,
  listApplications,
  listEntitlementRows,
  type EntitlementRow,
} from './directory';
import { sodAccess, sodReviewSeed } from './sod-seed';
import {
  OVERVIEW_SECTION_ID,
  sectionDefById,
  type ReportOrganization,
  type ReportSectionV2,
  type SectionDef,
} from './governance-analytics-v2';

export interface DerivedRow {
  /** Stable within a section — `DataTable` keys on it. */
  id: string;
  /** Column id → cell value. `risk` cells carry the score so the chip can tier it. */
  [columnId: string]: string | number;
}

export interface DerivedChart {
  id: string;
  title: string;
  shape: 'donut' | 'bar';
  data: { label: string; value: number; color: string }[];
}

export interface DerivedKpi {
  id: string;
  label: string;
  value: string;
  hint?: string;
}

export interface DerivedSection {
  def: SectionDef;
  rows: DerivedRow[];
  charts: DerivedChart[];
  /** What the reader narrowed to, printed under the section title. Empty when nothing. */
  filterSummary: string;
  /** Headline figures — Overview is a KPI grid, not a table. */
  kpis?: DerivedKpi[];
}

const RISK_COLOR: Record<RiskTier, string> = {
  low: 'var(--ds-color-status-info-fill)',
  medium: 'var(--ds-color-status-warning-fill)',
  high: 'var(--ds-color-status-caution-fill)',
  critical: 'var(--ds-color-status-danger-fill)',
};

/**
 * How a permission reached the people who hold it.
 *
 * The domain has no grant-route field, so the route is derived from the entitlement's own
 * shape — an admin-flavoured permission is one somebody asked for, a baseline one arrives
 * with the job. Deterministic per entitlement, and stable across renders, which is what
 * matters for a report; a real deployment would read this from the grant record.
 */
const ROUTES = ['Given directly', 'Through a business role', 'Through a technical role', 'Given automatically'] as const;

function routeOf(e: EntitlementRow): string {
  if (/admin|owner|super/i.test(e.name)) return 'Given directly';
  if (/read|view|user|standard/i.test(e.name)) return 'Given automatically';
  return ROUTES[e.name.length % ROUTES.length];
}

/** The entitlements this report is about, before any section's own filters. */
function scopedEntitlements(org: ReportOrganization): EntitlementRow[] {
  const all = listEntitlementRows();
  if (org.scope === 'application' && org.value) {
    return all.filter((e) => e.applicationName === org.value);
  }
  // Department and governance-team scoping narrow *people*, not the permission catalogue —
  // every permission still exists, so the honest read is the full catalogue for both.
  return all;
}

/**
 * How many accounts hold this permission.
 *
 * Through `getEntitlementDetail`, which owns the account↔entitlement join — an
 * `AppAccountRow` deliberately does not carry its entitlement ids, and reproducing the
 * join here would be a second answer to a question the Directory already answers.
 */
function holdersOf(e: EntitlementRow): number {
  return getEntitlementDetail(e.id)?.accounts.length ?? 0;
}

/**
 * How many separation-of-duties rules a permission takes part in.
 *
 * Joined on name + application rather than on an id, because the SoD module carries its own
 * access catalogue: the two seeds describe the same permissions and do not share keys. A
 * permission the SoD catalogue has never heard of scores 0, which is the honest answer —
 * "no rule mentions it", not "no rule is broken".
 *
 * Counted as distinct rule *codes*, not instances. The same conflict firing for eleven
 * people is one rule the permission breaks, and reporting eleven would make a widely-held
 * permission look like a worse control failure than a rare one.
 */
const SOD_ACCESS_BY_KEY = new Map(
  sodAccess.map((a) => [`${a.name.toLowerCase()}|${a.appName.toLowerCase()}`, a.id]),
);

const SOD_CODES_BY_ACCESS = (() => {
  const byAccess = new Map<string, Set<string>>();
  for (const review of sodReviewSeed) {
    for (const rule of review.rules) {
      for (const accessId of rule.accessIds) {
        const codes = byAccess.get(accessId) ?? new Set<string>();
        codes.add(rule.code);
        byAccess.set(accessId, codes);
      }
    }
  }
  return byAccess;
})();

function ruleBreaksOf(e: EntitlementRow): number {
  const accessId = SOD_ACCESS_BY_KEY.get(`${e.name.toLowerCase()}|${e.applicationName.toLowerCase()}`);
  return accessId ? (SOD_CODES_BY_ACCESS.get(accessId)?.size ?? 0) : 0;
}

// ---- section 1: how people got their access ---------------------------

function deriveAccessDistribution(def: SectionDef, cfg: ReportSectionV2, org: ReportOrganization): DerivedSection {
  const routeFilter = cfg.filters.route ?? 'All';
  const riskFilter = cfg.filters.risk ?? 'All';

  let items = scopedEntitlements(org);
  if (riskFilter !== 'All') {
    items = items.filter((e) => RISK_TIER_LABEL[riskTier(e.risk)] === riskFilter);
  }

  const byRoute = new Map<string, { grants: number; people: number; apps: Set<string>; riskSum: number }>();
  for (const e of items) {
    const route = routeOf(e);
    if (routeFilter !== 'All' && route !== routeFilter) continue;
    const bucket = byRoute.get(route) ?? { grants: 0, people: 0, apps: new Set<string>(), riskSum: 0 };
    const holders = holdersOf(e);
    bucket.grants += 1;
    bucket.people += holders;
    bucket.apps.add(e.applicationName);
    bucket.riskSum += e.risk;
    byRoute.set(route, bucket);
  }

  const rows: DerivedRow[] = ROUTES.filter((r) => byRoute.has(r)).map((route) => {
    const b = byRoute.get(route)!;
    return {
      id: route,
      route,
      grants: b.grants,
      people: b.people,
      apps: b.apps.size,
      risk: Math.round(b.riskSum / Math.max(1, b.grants)),
    };
  });

  const riskBuckets = new Map<RiskTier, number>();
  for (const e of items) {
    if (routeFilter !== 'All' && routeOf(e) !== routeFilter) continue;
    const t = riskTier(e.risk);
    riskBuckets.set(t, (riskBuckets.get(t) ?? 0) + 1);
  }

  return {
    def,
    rows,
    charts: [
      {
        id: 'by-route',
        title: 'How People Got Access',
        shape: 'donut',
        data: rows.map((r, i) => ({
          label: String(r.route),
          value: Number(r.grants),
          color: ROUTE_COLORS[i % ROUTE_COLORS.length],
        })),
      },
      {
        id: 'by-risk',
        title: 'Access by Risk Level',
        shape: 'bar',
        data: (['critical', 'high', 'medium', 'low'] as RiskTier[])
          .filter((t) => riskBuckets.has(t))
          .map((t) => ({ label: RISK_TIER_LABEL[t], value: riskBuckets.get(t) ?? 0, color: RISK_COLOR[t] })),
      },
    ],
    filterSummary: summarise([
      routeFilter !== 'All' ? `${def.filters[0].label}: ${routeFilter}` : null,
      riskFilter !== 'All' ? `${def.filters[1].label}: ${riskFilter}` : null,
    ]),
  };
}

const ROUTE_COLORS = [
  'var(--ds-color-status-info-fill)',
  'var(--ds-color-status-success-fill)',
  'var(--ds-color-status-caution-fill)',
  'var(--ds-color-status-neutral-fill)',
];

// ---- section 2: all permissions ---------------------------------------

function deriveAllPermissions(def: SectionDef, cfg: ReportSectionV2, org: ReportOrganization): DerivedSection {
  const appFilter = cfg.filters.application ?? 'All';
  const minRisk = cfg.filters.minRisk ?? 'All';
  const floor = minRisk === 'All' ? -1 : Number(minRisk);

  const apps = listApplications();

  let items = scopedEntitlements(org).filter((e) => e.risk > floor);
  if (appFilter !== 'All') items = items.filter((e) => e.applicationName === appFilter);
  items = [...items].sort((a, b) => b.risk - a.risk);

  const rows: DerivedRow[] = items.map((e) => {
    const app = apps.find((a) => a.id === e.applicationId);
    return {
      id: e.id,
      permission: e.name,
      app: e.applicationName,
      people: holdersOf(e),
      // "Risk Owner" is whether anyone answers for it — the gap is the point, so it is a
      // status rather than a name nobody can act on when it is missing.
      owner: app && app.ownerCount > 0 ? 'Assigned' : 'Unassigned',
      breaks: ruleBreaksOf(e),
      risk: e.risk,
    };
  });

  const riskBuckets = new Map<RiskTier, number>();
  for (const e of items) {
    const t = riskTier(e.risk);
    riskBuckets.set(t, (riskBuckets.get(t) ?? 0) + 1);
  }

  return {
    def,
    rows,
    charts: [
      {
        id: 'riskiest',
        title: 'Riskiest Permissions',
        shape: 'bar',
        // Top eight: a ranked bar chart of forty permissions is a wall, and the tail is
        // exactly the part nobody is going to act on.
        // Qualified by application: "Super Admin" exists in three tenants, and an
        // unqualified label would both repeat itself down the axis and collide as a
        // React key.
        data: items.slice(0, 8).map((e) => ({
          label: `${e.name} (${e.applicationName})`,
          value: e.risk,
          color: RISK_COLOR[riskTier(e.risk)],
        })),
      },
      {
        id: 'by-risk',
        title: 'Permissions by Risk Level',
        shape: 'donut',
        data: (['critical', 'high', 'medium', 'low'] as RiskTier[])
          .filter((t) => riskBuckets.has(t))
          .map((t) => ({ label: RISK_TIER_LABEL[t], value: riskBuckets.get(t) ?? 0, color: RISK_COLOR[t] })),
      },
    ],
    filterSummary: summarise([
      appFilter !== 'All' ? `${def.filters[0].label}: ${appFilter}` : null,
      minRisk !== 'All' ? `${def.filters[1].label}: ${minRisk}` : null,
    ]),
  };
}

const summarise = (parts: (string | null)[]) => parts.filter(Boolean).join(' · ');

const formatCount = (n: number) => n.toLocaleString('en-US');

function sumCol(rows: DerivedRow[], id: string) {
  return rows.reduce((n, r) => n + Number(r[id] || 0), 0);
}

function kpisFromAccess(derived: DerivedSection): DerivedKpi[] {
  const peak = derived.rows.reduce((n, r) => Math.max(n, Number(r.risk) || 0), 0);
  return [
    { id: 'routes', label: 'Routes', value: formatCount(derived.rows.length) },
    { id: 'grants', label: 'Times given', value: formatCount(sumCol(derived.rows, 'grants')) },
    { id: 'access-people', label: 'People', value: formatCount(sumCol(derived.rows, 'people')) },
    {
      id: 'peak-risk',
      label: 'Highest route risk',
      value: peak ? RISK_TIER_LABEL[riskTier(peak)] : '—',
    },
  ];
}

function kpisFromPermissions(derived: DerivedSection): DerivedKpi[] {
  const highRisk = derived.rows.filter((r) => {
    const t = riskTier(Number(r.risk));
    return t === 'critical' || t === 'high';
  }).length;
  const unassigned = derived.rows.filter((r) => r.owner === 'Unassigned').length;
  const breaks = derived.rows.filter((r) => Number(r.breaks) > 0).length;
  return [
    { id: 'permissions', label: 'Permissions', value: formatCount(derived.rows.length) },
    { id: 'high-risk', label: 'High-risk entitlements', value: formatCount(highRisk) },
    { id: 'unassigned', label: 'Unassigned owners', value: formatCount(unassigned) },
    { id: 'breaks', label: 'Rule breaks', value: formatCount(breaks) },
  ];
}

function sectionCfg(siblings: ReportSectionV2[], id: string): ReportSectionV2 {
  return siblings.find((s) => s.id === id) ?? { id, enabled: true, filters: {}, hiddenCharts: [] };
}

/**
 * Eight headline figures — the dashboard's top row, filled from this report's
 * organisation and the filters on the Access sections when those sections are
 * in the document. Always eight, so the row does not collapse when a section
 * below is switched off.
 */
function deriveOverview(
  def: SectionDef,
  siblings: ReportSectionV2[],
  org: ReportOrganization,
): DerivedSection {
  const access = deriveContentSection(sectionCfg(siblings, 'access-distribution'), org);
  const permissions = deriveContentSection(sectionCfg(siblings, 'high-risk-entitlements'), org);
  return {
    def,
    rows: [],
    charts: [],
    filterSummary: '',
    kpis: [...(access ? kpisFromAccess(access) : []), ...(permissions ? kpisFromPermissions(permissions) : [])],
  };
}

/** A section that reads Directory data — never Overview, so Overview cannot recurse. */
function deriveContentSection(cfg: ReportSectionV2, org: ReportOrganization): DerivedSection | null {
  const def = sectionDefById(cfg.id);
  if (!def || def.id === OVERVIEW_SECTION_ID) return null;
  if (def.id === 'access-distribution') return deriveAccessDistribution(def, cfg, org);
  if (def.id === 'high-risk-entitlements') return deriveAllPermissions(def, cfg, org);
  return null;
}

// ---- entry point -------------------------------------------------------

/**
 * Build one section's content.
 *
 * `siblings` is the report's section list so Overview can recap the others. Content
 * sections ignore it. Returns null for a section id the catalogue no longer knows — a
 * stored report outliving a section it referenced should lose that block, not the whole
 * document.
 */
export function deriveSection(
  cfg: ReportSectionV2,
  org: ReportOrganization,
  siblings: ReportSectionV2[] = [],
): DerivedSection | null {
  const def = sectionDefById(cfg.id);
  if (!def) return null;
  if (def.id === OVERVIEW_SECTION_ID) return deriveOverview(def, siblings, org);
  return deriveContentSection(cfg, org);
}

/** The values a `dynamic: 'applications'` filter offers, from the tenant's own catalogue. */
export function dynamicFilterValues(kind: 'applications'): string[] {
  if (kind === 'applications') {
    return ['All', ...Array.from(new Set(listEntitlementRows().map((e) => e.applicationName))).sort()];
  }
  return ['All'];
}
