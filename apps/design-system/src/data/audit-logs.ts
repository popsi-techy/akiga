/**
 * Audit log — what happened, who did it, and when.
 *
 * One flat event stream per category. Access requests are the only category with
 * data today; the rest are declared in `AUDIT_CATEGORIES` so the landing page can
 * state what an auditor will eventually be able to reach, which is itself useful
 * information.
 *
 * Deterministic: a fixed clock and a seeded generator, so the server and client
 * render the same rows and a screenshot taken today still matches tomorrow.
 */

export interface AuditCategory {
  id: string;
  title: string;
  description: string;
  route?: string;
  tag?: string;
}

export const AUDIT_CATEGORIES: AuditCategory[] = [
  {
    id: 'access-requests',
    title: 'Access Requests',
    description: 'Requests submitted, cancelled and completed, and every approval or rejection on the items inside them.',
    route: '/iga/audit/access-requests',
    tag: 'Access Requests',
  },
  {
    id: 'applications',
    title: 'Applications',
    description: 'Onboarding, authorization, connection tests, ownership changes and deletions.',
    tag: 'Applications',
  },
  {
    id: 'request-config',
    title: 'Access Request Settings',
    description: 'Changes to approval policies and to the tenant-wide request settings they inherit from.',
    tag: 'Access Requests',
  },
  {
    id: 'campaigns',
    title: 'Certification Campaigns',
    description: 'Campaign launches, closures, and the reviewer activity inside them.',
    tag: 'Certification',
  },
  {
    id: 'entitlements',
    title: 'Entitlements',
    description: 'Risk score changes, and every grant or revocation of an entitlement.',
    tag: 'Entitlements',
  },
  {
    id: 'reviewer-actions',
    title: 'Reviewer Decisions',
    description: 'Certify, revoke and delegate decisions, with the justification given for each.',
    tag: 'Certification',
  },
  {
    id: 'users',
    title: 'Users & Admins',
    description: 'Sign-ins, role changes and permission edits made by people using IGA itself.',
    tag: 'Administration',
  },
];

export const AUDIT_TASKS = [
  'Submit Access Request',
  'Submit Access Item',
  'Approve Access Item',
  'Reject Access Item',
  'Complete Access Request',
  'Cancel Access Request',
] as const;
export type AuditTask = (typeof AUDIT_TASKS)[number];

export type AuditOutcome = 'success' | 'failed';

export type AuditDecision = 'APPROVED' | 'REJECTED' | 'PENDING' | 'NOT_APPLICABLE';

/**
 * The item as it stood when the event was recorded.
 *
 * A snapshot, not a lookup: an audit trail has to say what was true at the time,
 * because the entitlement may have been re-scored or retired since.
 */
/** The capacity an action was taken in, as recorded on the event. */
export type ActorType = 'ADMIN' | 'END_USER' | 'SYSTEM';

export const ACTOR_TYPE_LABEL: Record<ActorType, string> = {
  ADMIN: 'Administrator',
  END_USER: 'End user',
  SYSTEM: 'System',
};

export interface AuditSnapshot {
  requestable: boolean;
  riskScore: number;
  entitlementType: 'PERMISSION' | 'ROLE' | 'GROUP';
  status: 'ACTIVE' | 'INACTIVE';
}

export interface AuditEntry {
  id: string;
  /** The platform's own id for the event — what support will ask for. */
  eventId: string;
  at: string; // ISO
  task: AuditTask;
  /** One sentence naming the action, its object and who took it. */
  description: string;
  /** An email for a person, or `system` when the platform acted on its own. */
  actor: string;
  actorId: string;
  /**
   * What the actor was acting as, not who they are.
   *
   * The same person can appear as an ADMIN on one entry and an END USER on the
   * next — asking for their own access rather than administering someone else's.
   * An auditor reading a row needs the capacity it was done in, which is why this
   * is recorded with the event rather than looked up from the identity.
   */
  actorType: ActorType;
  outcome: AuditOutcome;
  /** A request is a bundle; an item is one entitlement inside it. */
  targetKind: 'request' | 'item';
  target: string;
  targetId: string;
  /** What the target was, in words, as recorded with the event. */
  targetDescription: string;
  /** How many items the request carried. Only meaningful for a request target. */
  itemCount: number;
  /** The request an item belongs to — the thread that ties the rows together. */
  requestId: string;
  requestUuid: string;
  application: string;
  decision: AuditDecision;
  /** `WORKFLOW` when a policy decided it, otherwise the person who did. */
  decidedBy: string;
  approvalPolicy: string;
  justification: string;
  /** Where the call came from. `—` for platform actions. */
  source: string;
  snapshot: AuditSnapshot;
}

/** Fixed clock, so history never shifts under a reload. */
const NOW = Date.parse('2026-08-14T14:25:00.000Z');
const TOTAL = 121;

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ACTORS = [
  'emily.davis@acme.com',
  'bob.smith@acme.com',
  'priya.sharma@acme.com',
  'henry.taylor@acme.com',
  'hana.kim@acme.com',
];

const ITEMS = [
  { name: 'Workspace Member', application: 'Google Workspace', description: 'Standard mailbox, calendar and drive access.' },
  { name: 'Workspace Admin', application: 'Google Workspace', description: 'Manage users, groups and org-wide settings.' },
  { name: 'Sales User', application: 'Salesforce', description: 'Access leads, opportunities and accounts.' },
  { name: 'System Administrator', application: 'Salesforce', description: 'Manage org configuration, users and data.' },
  { name: 'Read-only Admin', application: 'Okta', description: 'View-only access to the admin console.' },
  { name: 'Write Access', application: 'GitHub', description: 'Push to repositories and open pull requests.' },
  { name: 'Journal Post', application: 'SAP S/4HANA Finance', description: 'Post journal entries to the general ledger.' },
  { name: 'Power User', application: 'AWS', description: 'Full access except identity and billing.' },
];

const JUSTIFICATIONS = [
  'Joining the sales team this quarter.',
  'Covering for a colleague on leave.',
  'Required for the Q3 audit.',
  'Project onboarding — approved by manager.',
  'Access no longer needed after transfer.',
];

/** Built once. The list is a fixed record, not a live feed. */
const entries: AuditEntry[] = (() => {
  const next = rng(0x5ec0de);
  const pick = <T,>(list: readonly T[]) => list[Math.floor(next() * list.length)];
  const between = (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1));

  const hex = (n: number) =>
    Array.from({ length: n }, () => Math.floor(next() * 16).toString(16)).join('');
  /** Shaped like the ids the platform really emits, so the field looks true. */
  const uuid = () => `${hex(8)}-${hex(4)}-${hex(4)}-${hex(4)}-${hex(12)}`;

  const out: AuditEntry[] = [];
  let at = NOW;

  for (let i = 0; i < TOTAL; i += 1) {
    const task = pick(AUDIT_TASKS);
    // A request-level task names the request; an item-level task names the
    // entitlement. Mixing the two in one column is what the header admits to.
    const isRequestLevel = task.endsWith('Access Request');
    const item = pick(ITEMS);
    const requestId = `ENT-${String(between(69, 121)).padStart(6, '0')}`;
    // Completion and rejection are decided by the platform once approvals land,
    // so those rows are the ones with no person behind them.
    const systemDriven = task === 'Complete Access Request' || task === 'Reject Access Item';

    const actor = systemDriven ? 'system' : pick(ACTORS);
    // Submitting is the one task a person does for themselves; everything else
    // in this log is somebody administering another person's access.
    const actorType: ActorType = systemDriven
      ? 'SYSTEM'
      : task.startsWith('Submit') || task.startsWith('Cancel')
        ? 'END_USER'
        : 'ADMIN';
    const target = isRequestLevel ? requestId : item.name;
    const itemCount = between(1, 5);
    const decision: AuditDecision = task.startsWith('Approve')
      ? 'APPROVED'
      : task.startsWith('Reject')
        ? 'REJECTED'
        : task.startsWith('Submit')
          ? 'PENDING'
          : 'NOT_APPLICABLE';

    out.push({
      id: `audit-${i}`,
      eventId: uuid(),
      at: new Date(at).toISOString(),
      task,
      // Reads as a sentence so the row can be quoted into a ticket as-is.
      description: `${task} ‘${target}’${isRequestLevel ? '' : ` of request ‘${requestId}’`} by ${actor === 'system' ? 'system' : actor}`,
      actor,
      actorId: uuid(),
      actorType,
      outcome: next() < 0.06 ? 'failed' : 'success',
      targetKind: isRequestLevel ? 'request' : 'item',
      target,
      targetId: uuid(),
      targetDescription: isRequestLevel
        ? `Access request carrying ${itemCount} ${itemCount === 1 ? 'item' : 'items'}.`
        : item.description,
      itemCount,
      requestId,
      requestUuid: uuid(),
      application: item.application,
      decision,
      decidedBy: systemDriven ? 'WORKFLOW' : actor,
      approvalPolicy: `ap_policy_0${between(1, 3)}_${1786440757419 + i}`,
      justification: pick(JUSTIFICATIONS),
      source: systemDriven ? '—' : `10.4.${between(1, 40)}.${between(2, 250)}`,
      snapshot: {
        requestable: next() < 0.85,
        riskScore: between(1, 92),
        entitlementType: pick(['PERMISSION', 'ROLE', 'GROUP'] as const),
        status: next() < 0.9 ? 'ACTIVE' : 'INACTIVE',
      },
    });

    at -= between(3, 240) * 60 * 1000;
  }
  return out;
})();

export function listAuditEntries(): AuditEntry[] {
  return entries;
}

/** True when an entry answers a free-text search of actor, task or target. */
export function auditMatches(e: AuditEntry, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    e.actor.toLowerCase().includes(q) ||
    e.task.toLowerCase().includes(q) ||
    e.target.toLowerCase().includes(q) ||
    e.requestId.toLowerCase().includes(q)
  );
}
