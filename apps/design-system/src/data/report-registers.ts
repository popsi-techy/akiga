/**
 * The rows behind each operational register, derived from the domain rather than seeded.
 *
 * A register is not a dataset of its own — it is a question asked of the identities,
 * accounts, entitlements, campaigns and requests the product already holds. Seeding rows
 * here would have produced a catalogue that agrees with nothing else on the platform: an
 * Access Assignment Register listing grants no account has, next to a Directory that never
 * heard of them. Deriving them means a register is always true, and a register nobody can
 * derive yet says so instead of inventing an answer.
 *
 * Every derivation reads live state. That is the honest limitation of a period report over
 * a store with no event history, and the evidence header says it in those words rather than
 * letting an assessor assume the rows were reconstructed as at the reporting date.
 */

import { getAppAccountDetail, listAppAccounts } from '@/data/directory';
import { listCertifications } from '@/data/certifications';
import { formatDate, formatDateTime } from '@/lib/datetime';
import { OPERATIONAL_REPORTS, type ReportState } from '@/data/reports';

export interface RegisterColumn {
  id: string;
  header: string;
  width?: string | number;
  align?: 'left' | 'right';
  /** Renders as a state chip rather than as text. */
  state?: boolean;
}

export type RegisterRow = { id: string } & Record<string, string | number | ReportState>;

export interface RegisterData {
  columns: RegisterColumn[];
  rows: RegisterRow[];
  /** Why there are no rows, when a register cannot be derived at all. */
  unavailable?: string;
}

const riskBand = (risk: number) => (risk >= 70 ? 'High' : risk >= 40 ? 'Medium' : 'Low');

/* --------------------------------------------------------- derivations */

function accessAssignments(): RegisterData {
  const rows: RegisterRow[] = [];
  for (const account of listAppAccounts()) {
    const detail = getAppAccountDetail(account.id);
    for (const e of detail?.entitlements ?? []) {
      rows.push({
        id: `${account.id}:${e.id}`,
        email: account.email,
        account: account.accountName,
        identity: account.identityName ?? '—',
        application: account.applicationName,
        entitlement: e.name,
        risk: riskBand(e.risk),
        status: account.orphan ? 'Orphaned' : 'Active',
      });
    }
  }
  return {
    columns: [
      { id: 'identity', header: 'Identity', width: '16%' },
      { id: 'email', header: 'Email', width: '18%' },
      { id: 'account', header: 'Account', width: '14%' },
      { id: 'application', header: 'Application', width: '16%' },
      { id: 'entitlement', header: 'Entitlement', width: '18%' },
      { id: 'risk', header: 'Risk', width: '9%' },
      { id: 'status', header: 'Status', width: '9%' },
    ],
    rows,
  };
}

function certificationCampaigns(): RegisterData {
  const STATE: Record<string, ReportState> = {
    launched: 'launched',
    completed: 'completed',
    scheduled: 'launched',
    readyToLaunch: 'neverRun',
    draft: 'neverRun',
  };
  return {
    columns: [
      { id: 'name', header: 'Campaign', width: '30%' },
      { id: 'type', header: 'Reviewer', width: '20%' },
      { id: 'applications', header: 'Applications', width: '14%', align: 'right' },
      { id: 'created', header: 'Created', width: '18%' },
      { id: 'state', header: 'Status', width: '18%', state: true },
    ],
    rows: listCertifications().map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
      applications: c.applicationIds.length,
      created: formatDateTime(c.createdOn),
      state: STATE[c.status] ?? 'neverRun',
    })),
  };
}

/**
 * Only the registers that have a view behind them.
 *
 * The other ten are catalogued on the hub with a Coming soon tag and no link, so nothing
 * reaches this map looking for them. Writing their derivations early would have produced
 * ten untested queries nobody can see — and a register whose rows have never been read by
 * anyone is not built, it is only typed.
 */
const BUILDERS: Record<string, () => RegisterData> = {
  'access-assignment-register': accessAssignments,
  'access-certification': certificationCampaigns,
};

/** A register's columns and rows, or an honest statement that it is not built yet. */
export function buildRegister(id: string): RegisterData {
  const builder = BUILDERS[id];
  if (builder) return builder();
  return {
    columns: [],
    rows: [],
    unavailable: 'This register is catalogued but not yet built.',
  };
}

/* ----------------------------------------------------- evidence header */

export interface EvidenceRow {
  parameter: string;
  value: string;
}

/**
 * The provenance block an assessor reads before the rows.
 *
 * It exists to stop a reader assuming more than the data supports. Two lines do the real
 * work: *Kind of records* says these are current records, not a reconstruction as at the
 * requested date, and *Sealed* says this screen is an unsealed render rather than a filed
 * artefact. Everything else is the who, what and when that makes the table quotable.
 */
export function evidenceHeader({
  registerId,
  periodFrom,
  periodTo,
  timezone,
  rowsShown,
  rowsTotal,
}: {
  registerId: string;
  periodFrom: string;
  periodTo: string;
  timezone: string;
  rowsShown: number;
  rowsTotal: number;
}): EvidenceRow[] {
  const register = OPERATIONAL_REPORTS.find((r) => r.id === registerId);
  const renderedAt = '2026-09-16T11:52:48.000Z';
  return [
    { parameter: 'Report', value: register?.name ?? 'Register' },
    { parameter: 'Definition version', value: '1.0.0' },
    { parameter: 'Period', value: `${formatDate(periodFrom)} – ${formatDate(periodTo)} (${timezone})` },
    { parameter: 'As-of requested', value: `${formatDate(periodTo)} (${timezone})` },
    { parameter: 'As-of effective', value: `${formatDateTime(renderedAt)} (${timezone})` },
    { parameter: 'Evidence source', value: 'Current records read in place of the requested date — see scope limitations' },
    { parameter: 'Kind of records', value: 'Current records' },
    { parameter: 'Source data currency', value: 'All sources read live at generation, current to the effective as-of date above' },
    { parameter: 'Rows shown', value: rowsTotal === 0 ? 'None' : `1–${rowsShown} of ${rowsTotal}` },
    { parameter: 'Rendered at', value: `${formatDateTime(renderedAt)} (${timezone})` },
    { parameter: 'Sealed', value: 'No — this is an unsealed on-screen render, not a filed artefact' },
  ];
}
