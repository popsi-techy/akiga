/**
 * The numbers behind the All Identities dashboard.
 *
 * Every figure is derived from the directory the rest of the product reads —
 * `listUserIdentities`, `listAppAccounts`, the SoD module — so a tile here and the
 * list it links to can never disagree. Nothing is invented, and nothing is
 * expressed as a fraction of a population it does not belong to.
 *
 * ## The rule this file exists to serve
 *
 * **Every number must be listable.** A dashboard tile answers "how many"; the
 * reader's next question is always "which ones". So each figure below travels with
 * the route that shows exactly those rows — a count with no destination is
 * decoration, and the reader ends up rebuilding the filter by hand somewhere else.
 */

import { listUserIdentities, listAppAccounts, accessExpired, type UserIdentityRow } from './directory';
import { sodReviewSeed } from './sod-seed';
import { riskTier } from '@/lib/risk';

/** Fixed "today", like every seeded module here. */
const TODAY = '2026-08-18';

export interface Segment {
  label: string;
  value: number;
  color: string;
  href?: string;
}

/**
 * The two colours the kind donut is drawn in — deliberately the same intents
 * `IdentityKindChip` uses, so the wedge and the pill for one population are the
 * same colour wherever the reader meets them.
 */
const KIND_FILL = {
  workforce: 'var(--ds-color-status-info-fill)',
  external: 'var(--ds-color-status-caution-fill)',
} as const;

const USERS = '/iga/directory/user-identities';
const EXTERNALS = '/iga/directory/external-identities';
const ACCOUNTS = '/iga/directory/app-accounts';

// ---- population --------------------------------------------------------

export interface Population {
  total: number;
  internal: number;
  external: number;
  active: number;
  inactive: number;
}

export function population(): Population {
  const all = listUserIdentities();
  return {
    total: all.length,
    internal: all.filter((i) => i.kind === 'internal').length,
    external: all.filter((i) => i.kind === 'external').length,
    active: all.filter((i) => i.status === 'active').length,
    inactive: all.filter((i) => i.status !== 'active').length,
  };
}

// ---- exceptions --------------------------------------------------------

/**
 * One thing that is wrong, in the reader's words.
 *
 * `tone` is the severity of the *finding*, not of the objects inside it, and it is
 * what orders the queue. `href` is required by the type: an exception you cannot
 * open is a statement the reader can do nothing about.
 */
export interface Exception {
  id: string;
  label: string;
  /** Why it matters, in one line. Never a restatement of the label. */
  detail: string;
  count: number;
  /**
   * What the count counts, singular and plural.
   *
   * A bare integer beside a finding invites the reader to assume it is always
   * identities. It is not — orphan accounts are accounts and SoD reviews are
   * reviews, drawn from a module with its own population. Naming the noun where
   * the number is printed is what stops "10" being silently read as "10 of your
   * 20 people".
   */
  unit: { one: string; many: string };
  tone: 'danger' | 'caution' | 'warning' | 'neutral';
  href: string;
  /** A few names, so the row is concrete before it is opened. */
  sample: string[];
}

/** The count with its noun, pluralised. */
export function unitLabel(e: Exception): string {
  return e.count === 1 ? e.unit.one : e.unit.many;
}

const SEVERITY_ORDER: Record<Exception['tone'], number> = {
  danger: 0,
  caution: 1,
  warning: 2,
  neutral: 3,
};

export function exceptions(): Exception[] {
  const all = listUserIdentities();
  const accounts = listAppAccounts();

  const orphans = accounts.filter((a) => a.orphan);
  const expiredExternals = all.filter((i) => accessExpired(i, TODAY));
  const withAccount = new Set(accounts.filter((a) => a.identityId).map((a) => a.identityId));
  const noAccount = all.filter((i) => i.status === 'active' && !withAccount.has(i.id));
  const highRisk = all.filter((i) => {
    const t = riskTier(i.riskScore);
    return t === 'critical' || t === 'high';
  });
  const inactiveWithAccess = all.filter(
    (i) => i.status !== 'active' && accounts.some((a) => a.identityId === i.id),
  );
  const openSod = sodReviewSeed.filter((r) => r.status !== 'completed');

  const out: Exception[] = [
    {
      id: 'expired-external',
      label: 'External access past its end date',
      detail: 'Still enabled after the date it was meant to stop. No HR event will close these.',
      count: expiredExternals.length,
      tone: 'danger',
      unit: { one: 'identity', many: 'identities' },
      href: EXTERNALS,
      sample: expiredExternals.map((i) => i.name),
    },
    {
      id: 'inactive-with-access',
      label: 'Inactive identities still holding accounts',
      detail: 'The person is switched off in the directory, but the access under them is not.',
      count: inactiveWithAccess.length,
      tone: 'danger',
      unit: { one: 'identity', many: 'identities' },
      href: ACCOUNTS,
      sample: inactiveWithAccess.map((i) => i.name),
    },
    {
      id: 'open-sod',
      // Counted as reviews, not identities: the SoD module keeps its own
      // population, and calling these "10 of your 20 identities" would be
      // arithmetic this directory cannot support. `unit` prints the noun beside
      // the number, so the distinction survives without a footnote.
      label: 'Open separation-of-duties reviews',
      detail: 'Toxic access combinations waiting on a reviewer decision.',
      count: openSod.length,
      tone: 'caution',
      unit: { one: 'review', many: 'reviews' },
      href: '/iga/reviewer/sod-resolution-v3',
      sample: openSod.map((r) => r.userName),
    },
    {
      id: 'high-risk',
      label: 'High and critical risk identities',
      detail: 'Scored on the same scale the rest of the product uses.',
      count: highRisk.length,
      tone: 'warning',
      unit: { one: 'identity', many: 'identities' },
      href: USERS,
      sample: highRisk.map((i) => i.name),
    },
    {
      id: 'no-account',
      label: 'Active identities with no account anywhere',
      detail: 'Either provisioning has not run, or the person no longer needs to be here.',
      count: noAccount.length,
      tone: 'neutral',
      unit: { one: 'identity', many: 'identities' },
      href: USERS,
      sample: noAccount.map((i) => i.name),
    },
  ];

  // Only what is actually wrong, worst first. A queue padded with zeroes teaches
  // the reader to skim past it.
  return out
    .filter((e) => e.count > 0)
    .sort((a, b) => SEVERITY_ORDER[a.tone] - SEVERITY_ORDER[b.tone] || b.count - a.count);
}

// ---- distribution ------------------------------------------------------

export function byKind(): Segment[] {
  const p = population();
  return [
    { label: 'Workforce', value: p.internal, color: KIND_FILL.workforce, href: USERS },
    { label: 'External', value: p.external, color: KIND_FILL.external, href: EXTERNALS },
  ];
}

/**
 * Orphan accounts — accounts in a connected system with nobody behind them.
 *
 * Promoted out of the exception queue into a card of their own. They were the one
 * finding in that list not about a person: every other row resolves to someone you
 * can talk to, where an orphan is an account whose owner is the open question.
 */
export function orphanAccounts(limit = 4): { id: string; accountName: string; applicationName: string }[] {
  return listAppAccounts()
    .filter((a) => a.orphan)
    .slice(0, limit)
    .map((a) => ({ id: a.id, accountName: a.accountName, applicationName: a.applicationName }));
}

/** How many there are in total, which is not always how many are shown. */
export function orphanAccountCount(): number {
  return listAppAccounts().filter((a) => a.orphan).length;
}

/**
 * The riskiest people, for the "who should I look at first" card.
 *
 * Four, not a top ten: this sits beside the population donut as the page's first
 * thing to act on, and a list long enough to scroll stops being a shortlist and
 * starts being a worse version of the list it links to.
 */
export function riskiestIdentities(limit = 4): UserIdentityRow[] {
  return [...listUserIdentities()].sort((a, b) => b.riskScore - a.riskScore).slice(0, limit);
}
