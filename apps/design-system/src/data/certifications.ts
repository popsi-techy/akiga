/**
 * Access Certification service — the admin read/write model for certification
 * runs and the templates they are created from.
 *
 * Hybrid persistence, matching the other policy-shaped modules: the seed primes
 * an empty store on first visit, thereafter localStorage is the source of truth.
 *
 * Vocabulary note: the industry calls these "campaigns". This product does not —
 * the word appears nowhere in the UI, in these types, or in the copy they feed.
 * "Access certification" is what the sidebar, the reviewer console and the audit
 * log already call the thing, and one object with two names is how a product
 * ends up with two mental models of it.
 */
import { catalogApps } from './seed';

const STORE_KEY = 'iga.certifications.v1';
/** Bump when the seed shape or content changes, so stale stores re-seed on load. */
const SEED_VERSION = 1;

// ---- types -------------------------------------------------------------

/**
 * Five states, and the four that matter are the four counted on the list.
 *
 * `readyToLaunch` is the one that needs a human: everything is configured and a
 * person has to say go. `scheduled` will start on its own.
 */
export type CertificationStatus =
  | 'draft'
  | 'readyToLaunch'
  | 'scheduled'
  | 'launched'
  | 'completed';

export type CertificationTypeId =
  | 'user-manager'
  | 'entitlement-owner'
  | 'application-owner'
  | 'role-owner'
  | 'orphan-account'
  | 'custom';

export type RecurrenceInterval = 'one-time' | 'weekly' | 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';
export type LaunchType = 'manual' | 'scheduled';

/**
 * What happens to access nobody kept.
 *
 * `remove` is the default for both cases on purpose: a certification exists to
 * take away access that can no longer be justified, and defaulting to "keep"
 * turns a control into a formality.
 */
export type OutcomeAction = 'remove' | 'keep' | 'suspend';

export interface ReviewerConfig {
  manager: boolean;
  entitlementOwners: boolean;
  governanceTeams: boolean;
  /** Which teams, when `governanceTeams` is on. */
  governanceTeamIds: string[];
}

export interface OutcomeConfig {
  rejection: OutcomeAction;
  /** What happens to access a reviewer never got to before the window closed. */
  noReview: OutcomeAction;
  /** Let a reviewer keep access on condition, rather than only keep or remove. */
  conditionalCertification: boolean;
  /** Let a reviewer decide many rows at once. */
  bulkAction: boolean;
}

export interface TimelineConfig {
  launchType: LaunchType;
  /** ISO instant, when `launchType` is 'scheduled'. */
  launchOn?: string;
  interval: RecurrenceInterval;
  /** How long reviewers get, in days. 0 = not chosen yet. */
  reviewDurationDays: number;
  /** ISO instant — derived for recurring runs, absent for one-time. */
  recurrenceEndOn?: string;
  allowReviewersToExtend: boolean;
}

export interface Certification {
  id: string;
  name: string;
  description: string;
  type: CertificationTypeId;
  status: CertificationStatus;
  createdOn: string;
  updatedOn: string;
  applicationIds: string[];
  userIds: string[];
  reviewers: ReviewerConfig;
  outcome: OutcomeConfig;
  timeline: TimelineConfig;
}

// ---- templates ---------------------------------------------------------

export interface CertificationTemplate {
  id: CertificationTypeId;
  name: string;
  description: string;
  tags: string[];
  /** Only Custom is built; the rest keep their place so the set is legible. */
  available: boolean;
}

export const CERTIFICATION_TEMPLATES: CertificationTemplate[] = [
  {
    id: 'custom',
    name: 'Custom Review',
    description: 'Choose the users, the reviewers and the rules yourself. Start here when no template fits.',
    tags: ['Any application', 'Any reviewer'],
    available: true,
  },
  {
    id: 'user-manager',
    name: 'User Manager Review',
    description: 'Each user’s manager confirms the access their people still need.',
    tags: ['User Manager'],
    available: false,
  },
  {
    id: 'entitlement-owner',
    name: 'Entitlement Owner Review',
    description: 'The owner of each entitlement decides who should keep holding it.',
    tags: ['Entitlement Owner'],
    available: false,
  },
  {
    id: 'application-owner',
    name: 'Application Owner Review',
    description: 'Application owners review every account and permission in their system.',
    tags: ['Application Owner'],
    available: false,
  },
  {
    id: 'role-owner',
    name: 'Role Owner Review',
    description: 'Role owners confirm who should stay assigned to the roles they own.',
    tags: ['Role Owner', 'Technical & business roles'],
    available: false,
  },
  {
    id: 'orphan-account',
    name: 'Orphan Account Review',
    description: 'Decide what happens to accounts with no active identity behind them.',
    tags: ['Orphan Accounts'],
    available: false,
  },
];

export const TYPE_LABEL: Record<CertificationTypeId, string> = {
  'user-manager': 'User Manager',
  'entitlement-owner': 'Entitlement Owner',
  'application-owner': 'Application Owner',
  'role-owner': 'Role Owner',
  'orphan-account': 'Orphan Account',
  custom: 'Custom',
};

export const INTERVAL_LABEL: Record<RecurrenceInterval, string> = {
  'one-time': 'One time',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  'half-yearly': 'Half-yearly',
  yearly: 'Yearly',
};

export const OUTCOME_LABEL: Record<OutcomeAction, string> = {
  remove: 'Remove the access',
  keep: 'Keep the access',
  suspend: 'Suspend the account',
};

export const STATUS_LABEL: Record<CertificationStatus, string> = {
  draft: 'Draft',
  readyToLaunch: 'Ready to Launch',
  scheduled: 'Scheduled',
  launched: 'Launched',
  completed: 'Completed',
};

// ---- defaults ----------------------------------------------------------

export function emptyCertification(): Omit<Certification, 'id' | 'createdOn' | 'updatedOn'> {
  return {
    name: '',
    description: '',
    type: 'custom',
    status: 'draft',
    applicationIds: [],
    userIds: [],
    reviewers: { manager: false, entitlementOwners: false, governanceTeams: false, governanceTeamIds: [] },
    outcome: { rejection: 'remove', noReview: 'remove', conditionalCertification: false, bulkAction: false },
    timeline: {
      launchType: 'manual',
      interval: 'one-time',
      reviewDurationDays: 0,
      allowReviewersToExtend: false,
    },
  };
}

// ---- store -------------------------------------------------------------

interface Store {
  version: number;
  certifications: Record<string, Certification>;
}

const hasWindow = () => typeof window !== 'undefined';
const nowIso = () => new Date().toISOString();

const app = (name: string) => catalogApps.find((a) => a.name === name)?.id ?? catalogApps[0].id;

function seeded(input: Partial<Certification> & Pick<Certification, 'id' | 'name' | 'status' | 'type'>): Certification {
  const base = emptyCertification();
  return {
    ...base,
    description: '',
    createdOn: '2026-08-01T09:00:00.000Z',
    updatedOn: '2026-08-01T09:00:00.000Z',
    ...input,
    reviewers: { ...base.reviewers, ...input.reviewers },
    outcome: { ...base.outcome, ...input.outcome },
    timeline: { ...base.timeline, ...input.timeline },
  };
}

function seedStore(): Store {
  const list: Certification[] = [
    seeded({
      id: 'cert-fin-q3',
      name: 'Finance access review — Q3',
      description: 'Quarterly review of SAP finance access held outside the finance department.',
      type: 'custom',
      status: 'launched',
      createdOn: '2026-07-10T11:43:00.000Z',
      updatedOn: '2026-08-10T11:43:00.000Z',
      applicationIds: [app('SAP S/4HANA Finance')],
      userIds: ['o-liam', 'o-marcus', 'o-priya'],
      reviewers: { manager: true, entitlementOwners: true, governanceTeams: false, governanceTeamIds: [] },
      timeline: { launchType: 'manual', interval: 'quarterly', reviewDurationDays: 14, recurrenceEndOn: '2026-08-31T23:59:00.000Z', allowReviewersToExtend: true },
    }),
    seeded({
      id: 'cert-priv-admin',
      name: 'Privileged administrator review',
      description: 'Every account holding administrative access across cloud and identity systems.',
      type: 'custom',
      status: 'readyToLaunch',
      createdOn: '2026-08-11T12:48:00.000Z',
      updatedOn: '2026-08-11T12:48:00.000Z',
      applicationIds: [app('AWS'), app('Okta')],
      userIds: ['o-liam', 'o-frank'],
      reviewers: { manager: false, entitlementOwners: true, governanceTeams: true, governanceTeamIds: ['gt-secops'] },
      outcome: { rejection: 'remove', noReview: 'remove', conditionalCertification: true, bulkAction: false },
      timeline: { launchType: 'manual', interval: 'one-time', reviewDurationDays: 7, allowReviewersToExtend: false },
    }),
    seeded({
      id: 'cert-hr-onboard',
      name: 'Workday joiner access check',
      description: 'Confirms the access granted to everyone who joined in the last quarter.',
      type: 'custom',
      status: 'scheduled',
      createdOn: '2026-08-09T10:15:00.000Z',
      updatedOn: '2026-08-12T09:02:00.000Z',
      applicationIds: [app('Workday')],
      userIds: ['o-priya'],
      reviewers: { manager: true, entitlementOwners: false, governanceTeams: false, governanceTeamIds: [] },
      timeline: { launchType: 'scheduled', launchOn: '2026-09-01T09:00:00.000Z', interval: 'monthly', reviewDurationDays: 10, recurrenceEndOn: '2026-12-31T23:59:00.000Z', allowReviewersToExtend: false },
    }),
    seeded({
      id: 'cert-sales-h1',
      name: 'Salesforce access review — H1',
      description: 'Half-yearly confirmation of CRM access for the revenue organisation.',
      type: 'custom',
      status: 'completed',
      createdOn: '2026-02-07T16:56:00.000Z',
      updatedOn: '2026-08-13T05:29:00.000Z',
      applicationIds: [app('Salesforce')],
      userIds: ['o-marcus', 'o-priya'],
      reviewers: { manager: true, entitlementOwners: true, governanceTeams: false, governanceTeamIds: [] },
      timeline: { launchType: 'manual', interval: 'half-yearly', reviewDurationDays: 21, recurrenceEndOn: '2026-08-13T05:29:00.000Z', allowReviewersToExtend: true },
    }),
    seeded({
      id: 'cert-github-draft',
      name: 'Engineering repository access',
      description: '',
      type: 'custom',
      status: 'draft',
      createdOn: '2026-08-12T14:43:00.000Z',
      updatedOn: '2026-08-12T14:43:00.000Z',
      applicationIds: [app('GitHub')],
      userIds: [],
    }),
  ];
  const certifications: Record<string, Certification> = {};
  for (const c of list) certifications[c.id] = c;
  return { version: SEED_VERSION, certifications };
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
    if (!parsed?.certifications || parsed.version !== SEED_VERSION) {
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

// ---- read --------------------------------------------------------------

/** Newest activity first — a returning admin cares about what moved. */
export function listCertifications(): Certification[] {
  return Object.values(readStore().certifications).sort((a, b) => b.updatedOn.localeCompare(a.updatedOn));
}

export function getCertification(id: string): Certification | null {
  return readStore().certifications[id] ?? null;
}

export interface CertificationCounts {
  readyToLaunch: number;
  scheduled: number;
  launched: number;
  completed: number;
}

/**
 * The four counts above the table.
 *
 * Drafts are deliberately not counted: a draft is work in progress, not a state
 * of the access estate, and a tile counting them would compete with the four
 * that tell you whether reviews are actually happening.
 */
export function certificationCounts(): CertificationCounts {
  const all = listCertifications();
  const n = (s: CertificationStatus) => all.filter((c) => c.status === s).length;
  return {
    readyToLaunch: n('readyToLaunch'),
    scheduled: n('scheduled'),
    launched: n('launched'),
    completed: n('completed'),
  };
}

// ---- write -------------------------------------------------------------

/**
 * Creates or updates. An absent — or empty — id mints a new one, so a wizard can
 * hold one working object from the first keystroke and adopt the id on first save.
 */
export function saveCertification(
  input: Omit<Certification, 'id' | 'createdOn' | 'updatedOn'> & { id?: string },
): string {
  const s = readStore();
  const now = nowIso();
  const id = input.id?.trim() ? input.id : `cert-${Math.random().toString(36).slice(2, 8)}`;
  const existing = s.certifications[id];
  s.certifications[id] = {
    ...(input as Certification),
    id,
    createdOn: existing?.createdOn ?? now,
    updatedOn: now,
  };
  writeStore(s);
  return id;
}

export function deleteCertification(id: string): void {
  const s = readStore();
  delete s.certifications[id];
  writeStore(s);
}

export function setCertificationStatus(id: string, status: CertificationStatus): void {
  const s = readStore();
  const c = s.certifications[id];
  if (!c) return;
  c.status = status;
  c.updatedOn = nowIso();
  writeStore(s);
}

// ---- readiness ---------------------------------------------------------

/**
 * What a certification still needs before it can be launched, in the reader's
 * words. One definition, shared by the wizard's Preview step and the list's
 * launch action — two copies of this rule would eventually disagree.
 */
export function certificationGaps(c: Certification): string[] {
  const gaps: string[] = [];
  if (!c.name.trim()) gaps.push('a name');
  if (c.applicationIds.length === 0) gaps.push('at least one application');
  if (c.userIds.length === 0) gaps.push('users to review');
  const { manager, entitlementOwners, governanceTeams } = c.reviewers;
  if (!manager && !entitlementOwners && !governanceTeams) gaps.push('at least one reviewer');
  if (c.timeline.reviewDurationDays === 0) gaps.push('a review duration');
  return gaps;
}

export const isLaunchable = (c: Certification) => certificationGaps(c).length === 0;
