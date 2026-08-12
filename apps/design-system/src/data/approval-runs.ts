/**
 * Approval policy execution history — what actually happened each time a policy ran.
 *
 * A policy's flow says how a request *should* be decided. A run says how one was:
 * who acted at each level, how long they took, whether the SLA held, and — the part
 * that matters at audit — what access the requester ended up with.
 *
 * Seed data, deterministic by construction: every timestamp is a literal ISO string
 * measured against `AS_OF`, so a run that breached its SLA breached it on every load
 * and the list never reorders itself between renders.
 */
import { userIdentities } from './seed';

/** The model's "now". Relative labels ("2 days ago") are computed against this. */
export const RUNS_AS_OF = '2026-08-09T09:00:00.000Z';

/**
 * `completed` is the workflow outcome: a lifecycle workflow finishes, it is not
 * "approved". The rest are shared with approval runs — the two modules record
 * runs in the same shape so one history surface can render both.
 */
export type RunOutcome = 'approved' | 'rejected' | 'expired' | 'running' | 'failed' | 'completed';

export type StepDecision =
  | 'approved'
  | 'rejected'
  | 'auto-approved'
  | 'auto-rejected'
  | 'notified'
  | 'skipped'
  | 'pending'
  | 'escalated'
  /** Workflow steps: a filter matched (or did not), and entities were assigned. */
  | 'matched'
  | 'no-match'
  | 'assigned';

export interface RunStep {
  /** Matches a node id in the policy flow, so a step can be traced to the canvas. */
  nodeId: string;
  label: string;
  /** Who was asked — resolved at run time, not the approver *type*. */
  approver: string;
  decision: StepDecision;
  /** ISO, or null while the step has not completed. */
  at: string | null;
  /** How long the step took, already humanised — "4h 12m". */
  duration: string | null;
  /** The approver's own words, when they left any. */
  note?: string;
}

export type GrantResult = 'granted' | 'revoked' | 'failed' | 'pending';

export interface RunGrant {
  /** User Identity id (see `userIdentities`). */
  userId: string;
  /** What they got — an entitlement, a role, or an application. */
  target: string;
  targetKind: 'Entitlement' | 'Technical Role' | 'Business Role' | 'Application';
  application: string;
  result: GrantResult;
  /** Why a grant failed, or the bound on a time-boxed one. */
  detail?: string;
}

export interface ApprovalRun {
  id: string;
  policyId: string;
  /** Sequence number within the policy — what an operator quotes in a ticket. */
  reference: string;
  startedAt: string;
  completedAt: string | null;
  outcome: RunOutcome;
  /** Total wall-clock, humanised. Null while running. */
  duration: string | null;
  requesterId: string;
  /** Who the access was for — usually, but not always, the requester. */
  targetUserId: string;
  /** One line naming what was asked for. */
  request: string;
  trigger: 'Access request' | 'Birthright policy' | 'Role assignment' | 'Emergency access' | 'Lifecycle event';
  /** True when a level ran past its SLA — surfaced even on approved runs. */
  slaBreached: boolean;
  steps: RunStep[];
  grants: RunGrant[];
}

const nameOf = (id: string) => userIdentities.find((u) => u.id === id)?.name ?? id;

/* ------------------------------------------------------------------ *
 * Seed
 * ------------------------------------------------------------------ */

const RUNS: ApprovalRun[] = [
  // ---- ap-joiner-access ------------------------------------------------
  {
    id: 'run-ja-1042',
    policyId: 'ap-joiner-access',
    reference: 'RUN-1042',
    startedAt: '2026-08-09T07:14:00.000Z',
    completedAt: null,
    outcome: 'running',
    duration: null,
    requesterId: 'o-grace',
    targetUserId: 'o-grace',
    request: 'Okta Standard User · Workday Employee Self-Service',
    trigger: 'Access request',
    slaBreached: false,
    steps: [
      { nodeId: 'ja-notify', label: 'Request received', approver: 'System', decision: 'notified', at: '2026-08-09T07:14:06.000Z', duration: '6s' },
      { nodeId: 'ja-l1', label: 'Manager approval', approver: nameOf('o-henry'), decision: 'approved', at: '2026-08-09T08:02:00.000Z', duration: '48m', note: 'Standard new-joiner bundle.' },
      { nodeId: 'ja-l2', label: 'Application owner', approver: nameOf('o-marcus'), decision: 'pending', at: null, duration: null },
    ],
    grants: [
      { userId: 'o-grace', target: 'Standard User', targetKind: 'Entitlement', application: 'Okta', result: 'pending' },
      { userId: 'o-grace', target: 'Employee Self-Service', targetKind: 'Entitlement', application: 'Workday', result: 'pending' },
    ],
  },
  {
    id: 'run-ja-1039',
    policyId: 'ap-joiner-access',
    reference: 'RUN-1039',
    startedAt: '2026-08-07T09:30:00.000Z',
    completedAt: '2026-08-07T15:11:00.000Z',
    outcome: 'approved',
    duration: '5h 41m',
    requesterId: 'o-priya',
    targetUserId: 'o-sofia',
    request: 'GitHub Write · Jira Contributor',
    trigger: 'Access request',
    slaBreached: false,
    steps: [
      { nodeId: 'ja-notify', label: 'Request received', approver: 'System', decision: 'notified', at: '2026-08-07T09:30:04.000Z', duration: '4s' },
      { nodeId: 'ja-l1', label: 'Manager approval', approver: nameOf('o-priya'), decision: 'approved', at: '2026-08-07T10:06:00.000Z', duration: '36m', note: 'Joining the platform team on Monday.' },
      { nodeId: 'ja-l2', label: 'Application owner', approver: nameOf('o-frank'), decision: 'approved', at: '2026-08-07T15:11:00.000Z', duration: '5h 5m' },
    ],
    grants: [
      { userId: 'o-sofia', target: 'Write', targetKind: 'Entitlement', application: 'GitHub', result: 'granted' },
      { userId: 'o-sofia', target: 'Contributor', targetKind: 'Entitlement', application: 'Jira', result: 'granted' },
      { userId: 'o-sofia', target: 'Engineering Baseline', targetKind: 'Technical Role', application: 'GitHub', result: 'granted', detail: 'Inherited with the bundle' },
    ],
  },
  {
    id: 'run-ja-1031',
    policyId: 'ap-joiner-access',
    reference: 'RUN-1031',
    startedAt: '2026-08-04T11:02:00.000Z',
    completedAt: '2026-08-04T11:48:00.000Z',
    outcome: 'rejected',
    duration: '46m',
    requesterId: 'o-daniel',
    targetUserId: 'o-daniel',
    request: 'Okta Super Admin',
    trigger: 'Access request',
    slaBreached: false,
    steps: [
      { nodeId: 'ja-notify', label: 'Request received', approver: 'System', decision: 'notified', at: '2026-08-04T11:02:03.000Z', duration: '3s' },
      { nodeId: 'ja-l1', label: 'Manager approval', approver: nameOf('o-henry'), decision: 'rejected', at: '2026-08-04T11:48:00.000Z', duration: '46m', note: 'Tenant administration is not required for a sales role. Raise a ticket with IT instead.' },
    ],
    grants: [],
  },

  // ---- ap-privileged ---------------------------------------------------
  {
    id: 'run-pv-0288',
    policyId: 'ap-privileged',
    reference: 'RUN-0288',
    startedAt: '2026-08-08T13:20:00.000Z',
    completedAt: '2026-08-08T18:05:00.000Z',
    outcome: 'approved',
    duration: '4h 45m',
    requesterId: 'o-frank',
    targetUserId: 'o-frank',
    request: 'AWS PowerUserAccess — 30 days',
    trigger: 'Access request',
    slaBreached: false,
    steps: [
      { nodeId: 'pv-l1', label: 'Manager approval', approver: nameOf('o-priya'), decision: 'approved', at: '2026-08-08T14:01:00.000Z', duration: '41m' },
      { nodeId: 'pv-cond', label: 'Privileged?', approver: 'System', decision: 'approved', at: '2026-08-08T14:01:01.000Z', duration: '1s', note: 'Matched IF — routed to parallel approval.' },
      { nodeId: 'pv-par', label: 'Security + owner', approver: `${nameOf('o-catherine')}, ${nameOf('o-liam')}`, decision: 'approved', at: '2026-08-08T18:05:00.000Z', duration: '4h 4m', note: 'Both lanes approved. Time-boxed to 30 days.' },
    ],
    grants: [
      { userId: 'o-frank', target: 'PowerUserAccess', targetKind: 'Entitlement', application: 'AWS', result: 'granted', detail: 'Expires 7 Sep 2026' },
    ],
  },
  {
    id: 'run-pv-0284',
    policyId: 'ap-privileged',
    reference: 'RUN-0284',
    startedAt: '2026-08-05T08:00:00.000Z',
    completedAt: '2026-08-06T20:00:00.000Z',
    outcome: 'expired',
    duration: '1d 12h',
    requesterId: 'o-nathan',
    targetUserId: 'o-nathan',
    request: 'Snowflake ACCOUNTADMIN',
    trigger: 'Access request',
    slaBreached: true,
    steps: [
      { nodeId: 'pv-l1', label: 'Manager approval', approver: nameOf('o-priya'), decision: 'approved', at: '2026-08-05T09:12:00.000Z', duration: '1h 12m' },
      { nodeId: 'pv-cond', label: 'Privileged?', approver: 'System', decision: 'approved', at: '2026-08-05T09:12:01.000Z', duration: '1s', note: 'Matched IF — routed to parallel approval.' },
      { nodeId: 'pv-par', label: 'Security + owner', approver: `${nameOf('o-catherine')}, ${nameOf('o-nathan')}`, decision: 'auto-rejected', at: '2026-08-06T20:00:00.000Z', duration: '1d 10h', note: 'SLA of 1 day breached with one lane still open. Auto-rejected per policy.' },
    ],
    grants: [],
  },

  // ---- ap-finance-apps -------------------------------------------------
  {
    id: 'run-fa-0611',
    policyId: 'ap-finance-apps',
    reference: 'RUN-0611',
    startedAt: '2026-08-06T06:45:00.000Z',
    completedAt: '2026-08-08T11:30:00.000Z',
    outcome: 'approved',
    duration: '2d 4h',
    requesterId: 'o-bob',
    targetUserId: 'o-bob',
    request: 'SAP Journal Post · NetSuite AP Clerk',
    trigger: 'Access request',
    slaBreached: true,
    steps: [
      { nodeId: 'fa-l1', label: 'Manager approval', approver: nameOf('o-hana'), decision: 'approved', at: '2026-08-06T08:10:00.000Z', duration: '1h 25m' },
      { nodeId: 'fa-l2', label: 'Finance approvers', approver: nameOf('o-hana'), decision: 'escalated', at: '2026-08-07T10:00:00.000Z', duration: '1d 2h', note: 'No decision within SLA — escalated to the fallback approver.' },
      { nodeId: 'fa-l3', label: 'Compliance sign-off', approver: `${nameOf('o-olivia')}, ${nameOf('o-catherine')}`, decision: 'approved', at: '2026-08-08T11:30:00.000Z', duration: '1d 1h', note: 'Segregation checked against the Finance SoD policy — no conflict.' },
    ],
    grants: [
      { userId: 'o-bob', target: 'Journal Post', targetKind: 'Entitlement', application: 'SAP S/4HANA Finance', result: 'granted' },
      { userId: 'o-bob', target: 'AP Clerk', targetKind: 'Entitlement', application: 'NetSuite', result: 'granted' },
    ],
  },
  {
    id: 'run-fa-0604',
    policyId: 'ap-finance-apps',
    reference: 'RUN-0604',
    startedAt: '2026-08-03T14:00:00.000Z',
    completedAt: '2026-08-03T16:22:00.000Z',
    outcome: 'failed',
    duration: '2h 22m',
    requesterId: 'o-hana',
    targetUserId: 'o-olivia',
    request: 'SAP Payment Release',
    trigger: 'Role assignment',
    slaBreached: false,
    steps: [
      { nodeId: 'fa-l1', label: 'Manager approval', approver: nameOf('o-hana'), decision: 'approved', at: '2026-08-03T14:35:00.000Z', duration: '35m' },
      { nodeId: 'fa-l2', label: 'Finance approvers', approver: nameOf('o-bob'), decision: 'approved', at: '2026-08-03T16:20:00.000Z', duration: '1h 45m' },
      { nodeId: 'fa-l3', label: 'Compliance sign-off', approver: 'Application Owner — SAP S/4HANA Finance', decision: 'skipped', at: '2026-08-03T16:22:00.000Z', duration: '2m', note: 'No approver could be resolved: SAP S/4HANA Finance has no application owner.' },
    ],
    grants: [
      { userId: 'o-olivia', target: 'Payment Release', targetKind: 'Entitlement', application: 'SAP S/4HANA Finance', result: 'failed', detail: 'Provisioning never ran — the approval chain could not complete.' },
    ],
  },

  // ---- ap-saas-selfserve -----------------------------------------------
  {
    id: 'run-ss-2210',
    policyId: 'ap-saas-selfserve',
    reference: 'RUN-2210',
    startedAt: '2026-08-09T06:05:00.000Z',
    completedAt: '2026-08-09T06:05:02.000Z',
    outcome: 'approved',
    duration: '2s',
    requesterId: 'o-sofia',
    targetUserId: 'o-sofia',
    request: 'Jira Project Admin',
    trigger: 'Access request',
    slaBreached: false,
    steps: [
      { nodeId: 'ss-l1', label: 'Manager approval', approver: 'System', decision: 'auto-approved', at: '2026-08-09T06:05:02.000Z', duration: '2s', note: 'Low-risk SaaS — auto-approved by the policy fallback.' },
    ],
    grants: [{ userId: 'o-sofia', target: 'Project Admin', targetKind: 'Entitlement', application: 'Jira', result: 'granted' }],
  },
  {
    id: 'run-ss-2201',
    policyId: 'ap-saas-selfserve',
    reference: 'RUN-2201',
    startedAt: '2026-08-02T10:40:00.000Z',
    completedAt: '2026-08-02T10:40:03.000Z',
    outcome: 'approved',
    duration: '3s',
    requesterId: 'o-emily',
    targetUserId: 'o-emily',
    request: 'GitHub Write',
    trigger: 'Access request',
    slaBreached: false,
    steps: [
      { nodeId: 'ss-l1', label: 'Manager approval', approver: 'System', decision: 'auto-approved', at: '2026-08-02T10:40:03.000Z', duration: '3s' },
    ],
    grants: [{ userId: 'o-emily', target: 'Write', targetKind: 'Entitlement', application: 'GitHub', result: 'granted' }],
  },

  // ---- ap-emergency ----------------------------------------------------
  {
    id: 'run-em-0037',
    policyId: 'ap-emergency',
    reference: 'RUN-0037',
    startedAt: '2026-08-08T02:11:00.000Z',
    completedAt: '2026-08-08T02:19:00.000Z',
    outcome: 'approved',
    duration: '8m',
    requesterId: 'o-marcus',
    targetUserId: 'o-marcus',
    request: 'AWS AdministratorAccess — break-glass, P1 incident',
    trigger: 'Emergency access',
    slaBreached: false,
    steps: [
      { nodeId: 'em-l1', label: 'Security Governance', approver: nameOf('o-catherine'), decision: 'approved', at: '2026-08-08T02:19:00.000Z', duration: '8m', note: 'INC-4471 — payments outage. Approved for 4 hours.' },
      { nodeId: 'em-notify', label: 'Break-glass granted', approver: 'System', decision: 'notified', at: '2026-08-08T02:19:04.000Z', duration: '4s', note: 'Retrospective review opened.' },
    ],
    grants: [
      { userId: 'o-marcus', target: 'AdministratorAccess', targetKind: 'Entitlement', application: 'AWS', result: 'revoked', detail: 'Auto-revoked at 06:19 after the 4-hour window' },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * Read model
 * ------------------------------------------------------------------ */

/** Runs for one policy, newest first. */
export function listRuns(policyId: string): ApprovalRun[] {
  return RUNS.filter((r) => r.policyId === policyId).sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
}

export function getRun(runId: string): ApprovalRun | null {
  return RUNS.find((r) => r.id === runId) ?? null;
}

export interface RunStats {
  total: number;
  approved: number;
  rejected: number;
  running: number;
  /** Runs that breached an SLA at any level, whatever the outcome. */
  breached: number;
  /** Share of *completed* runs that were approved, as a whole percent. */
  approvalRate: number;
}

export function runStats(policyId: string): RunStats {
  const runs = listRuns(policyId);
  const completed = runs.filter((r) => r.outcome !== 'running');
  const approved = runs.filter((r) => r.outcome === 'approved').length;
  return {
    total: runs.length,
    approved,
    rejected: runs.filter((r) => r.outcome === 'rejected').length,
    running: runs.filter((r) => r.outcome === 'running').length,
    breached: runs.filter((r) => r.slaBreached).length,
    approvalRate: completed.length === 0 ? 0 : Math.round((approved / completed.length) * 100),
  };
}

/** Display name for a User Identity id. */
export const runUserName = nameOf;
