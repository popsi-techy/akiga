/**
 * Request Governance — admin operations store.
 *
 * This is the IT / Security console for in-flight access requests, not the
 * end-user inbox or the reviewer queue. Rows carry SLA, live stage, SoD, and
 * provisioning exceptions so an admin can monitor and intervene.
 */
import { requestGovernanceSeed } from './request-governance-seed';
import { formatDateTime } from '@/lib/datetime';
import type { FileAttachment } from '@ds/components';

export type ResourceType = 'application' | 'entitlement' | 'role';
export type LifecycleStageId = 'submission' | 'policy' | 'approval' | 'provisioning';
export type StageState = 'pending' | 'current' | 'done' | 'failed' | 'skipped';
export type SlaStatus = 'on_track' | 'at_risk' | 'breached' | 'closed';
export type RequestOrigin = 'end_user' | 'manager' | 'joiner' | 'api';
export type NudgeChannel = 'slack' | 'teams' | 'email';
export type TicketSystem = 'jira' | 'servicenow';
export type QuickOpsFilter = 'provisioning_failed' | 'sla_breached' | 'high_risk';

export interface GovernanceIdentity {
  id: string;
  name: string;
  email: string;
  title?: string;
}

export interface ApprovalHop {
  id: string;
  label: string;
  approver: GovernanceIdentity;
  state: StageState;
  decidedAt?: string;
  decision?: 'approved' | 'rejected' | 'pending';
  note?: string;
}

export interface LifecycleStage {
  id: LifecycleStageId;
  state: StageState;
  startedAt?: string;
  completedAt?: string;
  actor?: GovernanceIdentity;
  note?: string;
  hops?: ApprovalHop[];
}

export interface ProvisioningFailure {
  httpStatus: number;
  code: string;
  connector: 'SCIM' | 'Webhook';
  target: string;
  message: string;
  payload: string;
  occurredAt: string;
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
}

export interface GovernanceRequest {
  id: string;
  reference: string;
  resourceType: ResourceType;
  resourceName: string;
  resourceDetail?: string;
  appName?: string;
  appType?: string;
  requester: GovernanceIdentity;
  target: GovernanceIdentity;
  origin: RequestOrigin;
  riskScore: number;
  sodConflict: boolean;
  sodSummary?: string;
  submittedAt: string;
  slaDueAt: string;
  closedAt?: string;
  currentStage: LifecycleStageId;
  stages: LifecycleStage[];
  failure?: ProvisioningFailure;
  autoEscalate: boolean;
  ticketRef?: string;
  ticketSystem?: TicketSystem;
  proof?: FileAttachment[];
  audit: AuditEvent[];
}

export const GOVERNANCE_REVIEWERS: GovernanceIdentity[] = [
  { id: 'u-priya', name: 'Priya Shah', email: 'priya.shah@acme.com', title: 'Access Reviewer' },
  { id: 'u-david', name: 'David Chen', email: 'david.chen@acme.com', title: 'Application Owner' },
  { id: 'u-elena', name: 'Elena Vasquez', email: 'elena.vasquez@acme.com', title: 'Security Analyst' },
  { id: 'u-marcus', name: 'Marcus Webb', email: 'marcus.webb@acme.com', title: 'IT Operations' },
];

export const RESOURCE_TYPE_LABEL: Record<ResourceType, string> = {
  application: 'Application',
  entitlement: 'Entitlement',
  role: 'Technical Role',
};

export const STAGE_LABEL: Record<LifecycleStageId, string> = {
  submission: 'Submission',
  policy: 'Policy / SoD Check',
  approval: 'Approval',
  provisioning: 'Provisioning',
};

export const STAGE_SHORT: Record<LifecycleStageId, string> = {
  submission: 'Submit',
  policy: 'Policy',
  approval: 'Approve',
  provisioning: 'Provision',
};

export const LIFECYCLE_ORDER: LifecycleStageId[] = [
  'submission',
  'policy',
  'approval',
  'provisioning',
];

/** The noun printed in the list chip — shorter than `STAGE_LABEL`, not a verb. */
const STAGE_CHIP_NAME: Record<LifecycleStageId, string> = {
  submission: 'Submission',
  policy: 'Policy',
  approval: 'Approval',
  provisioning: 'Provisioning',
};

function approvalHopName(label: string): string {
  if (/approval$/i.test(label)) return label;
  if (label === 'Application owner') return 'Owner Approval';
  return `${label} Approval`;
}

/**
 * `Stage 2: Policy` — the lifecycle index plus the name a reader can act on.
 *
 * When approval is current and a hop is waiting, the hop is the name
 * (`Stage 3: Owner Approval`) because "Approval" alone does not say who.
 */
export function describeCurrentStage(row: GovernanceRequest): string {
  const n = LIFECYCLE_ORDER.indexOf(row.currentStage) + 1;
  const stage = row.stages.find((s) => s.id === row.currentStage);
  const hop = stage?.hops?.find((h) => h.state === 'current');
  const name = hop ? approvalHopName(hop.label) : STAGE_CHIP_NAME[row.currentStage];
  return `Stage ${n}: ${name}`;
}

export const ORIGIN_LABEL: Record<RequestOrigin, string> = {
  end_user: 'End-user portal',
  manager: 'Manager request',
  joiner: 'Joiner workflow',
  api: 'API',
};

const STORE_KEY = 'iga.requestGovernance.v1';
const SEED_VERSION = 1;

type Store = { version: number; requests: Record<string, GovernanceRequest> };

function seedStore(): Store {
  return {
    version: SEED_VERSION,
    requests: Object.fromEntries(requestGovernanceSeed.map((r) => [r.id, r])),
  };
}

function writeStore(store: Store): Store {
  if (typeof window !== 'undefined') localStorage.setItem(STORE_KEY, JSON.stringify(store));
  return store;
}

function readStore(): Store {
  if (typeof window === 'undefined') return seedStore();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return writeStore(seedStore());
    const parsed = JSON.parse(raw) as Store;
    if (!parsed?.requests || parsed.version !== SEED_VERSION) return writeStore(seedStore());
    return parsed;
  } catch {
    return writeStore(seedStore());
  }
}

function mutate(id: string, fn: (row: GovernanceRequest) => GovernanceRequest): GovernanceRequest | null {
  const store = readStore();
  const current = store.requests[id];
  if (!current) return null;
  const next = fn(structuredClone(current));
  store.requests[id] = next;
  writeStore(store);
  return next;
}

function stamp(actor: string, action: string, detail: string): AuditEvent {
  return {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    actor,
    action,
    detail,
  };
}

const ADMIN = 'Aman Kumar';

export function listGovernanceRequests(): GovernanceRequest[] {
  return Object.values(readStore().requests).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function getGovernanceRequest(id: string): GovernanceRequest | undefined {
  return readStore().requests[id];
}

export function slaStatusOf(row: GovernanceRequest, now = Date.now()): SlaStatus {
  if (row.closedAt) return 'closed';
  const due = new Date(row.slaDueAt).getTime();
  if (now > due) return 'breached';
  const hoursLeft = (due - now) / 36e5;
  if (hoursLeft <= 8) return 'at_risk';
  return 'on_track';
}

export function isProvisioningFailed(row: GovernanceRequest): boolean {
  return row.currentStage === 'provisioning' && Boolean(row.failure) && !row.closedAt;
}

export function isHighRisk(row: GovernanceRequest): boolean {
  return row.sodConflict || row.riskScore >= 50;
}

export function matchesQuickFilter(row: GovernanceRequest, filter: QuickOpsFilter | null): boolean {
  if (!filter) return true;
  if (filter === 'provisioning_failed') return isProvisioningFailed(row);
  if (filter === 'sla_breached') return slaStatusOf(row) === 'breached';
  return isHighRisk(row);
}

export function formatSlaClock(row: GovernanceRequest, now = Date.now()): string {
  if (row.closedAt) return 'Closed';
  const due = new Date(row.slaDueAt).getTime();
  const diff = Math.abs(due - now);
  const hours = Math.floor(diff / 36e5);
  const minutes = Math.floor((diff % 36e5) / 6e4);
  const clock = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  return due >= now ? `${clock} left` : `${clock} overdue`;
}


/**
 * When something happened on a request, in the house format.
 *
 * Was its own day-first 24-hour local-time build: "26 Aug 2026, 13:35" where the rest of
 * the product said "Aug 26, 2026 · 8:05 AM" for the same instant. Local was also wrong
 * rather than merely different — `getHours()` reads the host's zone on the server and the
 * reader's in the browser, which is the mismatch `lib/datetime` exists to prevent.
 */
export const formatGovDateTime = formatDateTime;

export function currentApproverOf(row: GovernanceRequest): GovernanceIdentity | undefined {
  const approval = row.stages.find((s) => s.id === 'approval');
  return approval?.hops?.find((h) => h.state === 'current')?.approver ?? approval?.hops?.find((h) => h.decision === 'pending')?.approver;
}

export function canInterveneApproval(row: GovernanceRequest): boolean {
  return !row.closedAt && row.currentStage === 'approval';
}

export function nudgeApprover(id: string, channel: NudgeChannel): GovernanceRequest | null {
  const labels: Record<NudgeChannel, string> = { slack: 'Slack', teams: 'Teams', email: 'Email' };
  return mutate(id, (row) => {
    const who = currentApproverOf(row);
    row.audit.unshift(
      stamp(ADMIN, 'Approver nudged', `${labels[channel]} sent to ${who?.name ?? 'the active approver'}.`),
    );
    return row;
  });
}

export function reassignApprover(
  id: string,
  reviewerId: string,
  reason: string,
): GovernanceRequest | null {
  const next = GOVERNANCE_REVIEWERS.find((r) => r.id === reviewerId);
  if (!next) return null;
  return mutate(id, (row) => {
    const previous = currentApproverOf(row);
    const approval = row.stages.find((s) => s.id === 'approval');
    const hop = approval?.hops?.find((h) => h.state === 'current' || h.decision === 'pending');
    if (hop) hop.approver = next;
    row.audit.unshift(
      stamp(
        ADMIN,
        'Approver reassigned',
        `${previous?.name ?? 'Previous reviewer'} → ${next.name}. ${reason.trim()}`,
      ),
    );
    return row;
  });
}

export function forceApprove(id: string, reason: string): GovernanceRequest | null {
  return mutate(id, (row) => {
    const now = new Date().toISOString();
    for (const stage of row.stages) {
      if (stage.id === 'provisioning') {
        stage.state = 'current';
        stage.startedAt = now;
      } else {
        stage.state = stage.state === 'failed' ? 'done' : 'done';
        stage.completedAt = stage.completedAt ?? now;
        if (stage.id === 'approval') {
          for (const hop of stage.hops ?? []) {
            if (hop.decision !== 'approved') {
              hop.decision = 'approved';
              hop.state = 'done';
              hop.decidedAt = now;
              hop.note = hop.note ?? `Admin override: ${reason.trim()}`;
            }
          }
        }
      }
    }
    row.currentStage = 'provisioning';
    row.audit.unshift(stamp(ADMIN, 'Admin override', `Force-approved. ${reason.trim()}`));
    return row;
  });
}

export function setAutoEscalate(id: string, enabled: boolean): GovernanceRequest | null {
  return mutate(id, (row) => {
    row.autoEscalate = enabled;
    row.audit.unshift(
      stamp(ADMIN, enabled ? 'Auto-alert on' : 'Auto-alert off', 'Reviewer and requester will receive human-readable status updates.'),
    );
    return row;
  });
}

export function retryProvisioning(id: string): GovernanceRequest | null {
  return mutate(id, (row) => {
    const now = new Date().toISOString();
    const stage = row.stages.find((s) => s.id === 'provisioning');
    if (stage) {
      stage.state = 'current';
      stage.startedAt = now;
      stage.note = 'Retry submitted to the connector.';
    }
    const previous = row.failure;
    row.failure = undefined;
    row.audit.unshift(
      stamp(
        ADMIN,
        'Provisioning retried',
        previous ? `Re-triggered ${previous.connector} after ${previous.code}.` : 'Re-triggered the connector.',
      ),
    );
    return row;
  });
}

export function convertToTicket(id: string, system: TicketSystem): GovernanceRequest | null {
  const prefix = system === 'jira' ? 'JIRA' : 'INC';
  const ref = `${prefix}-${1800 + Math.floor(Math.random() * 200)}`;
  return mutate(id, (row) => {
    row.ticketSystem = system;
    row.ticketRef = ref;
    row.audit.unshift(
      stamp(
        ADMIN,
        'Converted to ticket',
        `Opened ${system === 'jira' ? 'Jira' : 'ServiceNow'} ${ref} for the target IT app team.`,
      ),
    );
    return row;
  });
}

export function markManuallyCompleted(id: string, proof: FileAttachment[]): GovernanceRequest | null {
  return mutate(id, (row) => {
    const now = new Date().toISOString();
    row.proof = proof;
    row.closedAt = now;
    row.failure = undefined;
    for (const stage of row.stages) {
      if (stage.state !== 'done') {
        stage.state = 'done';
        stage.completedAt = now;
      }
    }
    row.currentStage = 'provisioning';
    row.audit.unshift(
      stamp(ADMIN, 'Marked complete', `Closed with ${proof.length} proof file${proof.length === 1 ? '' : 's'}.`),
    );
    return row;
  });
}

export function governanceMatches(row: GovernanceRequest, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    row.reference,
    row.resourceName,
    row.resourceDetail,
    row.appName,
    RESOURCE_TYPE_LABEL[row.resourceType],
    row.requester.name,
    row.requester.email,
    row.target.name,
    row.target.email,
    row.ticketRef,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}
