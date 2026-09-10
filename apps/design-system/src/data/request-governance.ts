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
  /** The justification the approver typed with the decision. */
  note?: string;
  /** Evidence filed with the decision — a sign-off, a ticket export, a screenshot. */
  attachments?: FileAttachment[];
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

/** One catalog thing inside a request — a cart can hold several. */
export interface GovernanceRequestItem {
  id: string;
  resourceType: ResourceType;
  resourceName: string;
  resourceDetail?: string;
  appName?: string;
  appType?: string;
  riskScore?: number;
  sodConflict?: boolean;
  sodSummary?: string;
  currentStage?: LifecycleStageId;
  stages?: LifecycleStage[];
  failure?: ProvisioningFailure;
  /** When omitted, the request SLA applies to this line. */
  slaDueAt?: string;
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
  /** Cart of resources. When omitted, the top-level resource fields are the only item. */
  items?: GovernanceRequestItem[];
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
const SEED_VERSION = 4;

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

function legacyItem(row: GovernanceRequest): GovernanceRequestItem {
  return {
    id: `${row.id}-item`,
    resourceType: row.resourceType,
    resourceName: row.resourceName,
    resourceDetail: row.resourceDetail,
    appName: row.appName,
    appType: row.appType,
    riskScore: row.riskScore,
    sodConflict: row.sodConflict,
    sodSummary: row.sodSummary,
    currentStage: row.currentStage,
    stages: row.stages,
    failure: row.failure,
    slaDueAt: row.slaDueAt,
  };
}

/** Every resource on the request — the cart, or the single legacy resource. */
export function requestItems(row: GovernanceRequest): GovernanceRequestItem[] {
  if (row.items && row.items.length > 0) return row.items;
  return [legacyItem(row)];
}

/**
 * The request's stage list, re-stated for a cart line that is at a different stage.
 *
 * A re-stated stage keeps its identity and its new state and **nothing else**. Everything
 * recorded on the request's copy — the note, the actor, the timestamps, the approval hops
 * — was recorded for the state that stage was in on the request, and for a line that is
 * somewhere else it is not merely missing but wrong: carrying the policy stage's
 * "evaluation in progress" onto a line that has already cleared policy prints "Cleared"
 * over a sentence saying it is still running, and carrying decided hops onto a line that
 * has not reached approval shows decisions nobody made.
 *
 * The cost is a bare stage — the canvas says nothing is recorded — which is the honest
 * reading until the seed gives each cart line its own stage records.
 */
function stagesAlignedTo(row: GovernanceRequest, current: LifecycleStageId): LifecycleStage[] {
  const idx = LIFECYCLE_ORDER.indexOf(current);
  return row.stages.map((s) => {
    const i = LIFECYCLE_ORDER.indexOf(s.id);
    const state: StageState = i < idx ? 'done' : i === idx ? 'current' : 'pending';
    return state === s.state ? s : { id: s.id, state };
  });
}

/** Read the request as if this cart line were the only resource — drawer and stage copy. */
export function viewForItem(row: GovernanceRequest, item: GovernanceRequestItem): GovernanceRequest {
  const currentStage = item.currentStage ?? row.currentStage;
  const sodConflict = item.sodConflict ?? row.sodConflict;
  return {
    ...row,
    resourceType: item.resourceType,
    resourceName: item.resourceName,
    resourceDetail: item.resourceDetail,
    appName: item.appName,
    appType: item.appType,
    riskScore: item.riskScore ?? row.riskScore,
    sodConflict,
    sodSummary: sodConflict ? item.sodSummary ?? row.sodSummary : undefined,
    slaDueAt: item.slaDueAt ?? row.slaDueAt,
    currentStage,
    stages: item.stages ?? (item.currentStage ? stagesAlignedTo(row, currentStage) : row.stages),
    failure: item.failure ?? (item.currentStage && item.currentStage !== row.currentStage ? undefined : row.failure),
  };
}

export function getRequestItem(row: GovernanceRequest, itemId: string): GovernanceRequestItem | undefined {
  return requestItems(row).find((i) => i.id === itemId);
}

function itemIsComplete(row: GovernanceRequest, item: GovernanceRequestItem): boolean {
  if (row.closedAt) return true;
  const view = viewForItem(row, item);
  return view.stages.find((s) => s.id === 'provisioning')?.state === 'done';
}

/** How many cart lines are still open — the list “All status” column. */
export function cartStatusOf(row: GovernanceRequest): { pending: number; total: number } {
  const items = requestItems(row);
  return { pending: items.filter((i) => !itemIsComplete(row, i)).length, total: items.length };
}

/** Label and chip intent for the cart — list column and detail header. */
export function cartStatusMeta(row: GovernanceRequest): {
  label: string;
  intent: 'success' | 'warning';
} {
  const { pending } = cartStatusOf(row);
  if (pending === 0) return { label: 'All completed', intent: 'success' };
  return { label: pending === 1 ? '1 pending' : `${pending} pending`, intent: 'warning' };
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
 * Where one cart line has got to.
 *
 * The rail card, the flow canvas and the stage panel all read this rather than each
 * recomputing "which stage, how far along, how long is left" from the stage array — three
 * answers to one question is how a card ends up disagreeing with the canvas beside it.
 */
export interface ItemFlowProgress {
  /** The request read as if this line were the only resource. */
  view: GovernanceRequest;
  stages: LifecycleStage[];
  /** 1-based position of the stage in play; `null` once the flow has finished. */
  currentStep: number | null;
  doneCount: number;
  total: number;
  complete: boolean;
  failed: boolean;
  slaStatus: SlaStatus;
  slaClock: string;
}

export function itemFlowProgress(
  row: GovernanceRequest,
  item: GovernanceRequestItem,
  now = Date.now(),
): ItemFlowProgress {
  const view = viewForItem(row, item);
  const stages = view.stages;
  // A skipped stage counts as passed: the flow moved on, and a progress bar that stalls on
  // a stage nothing will ever happen at reads as stuck rather than as finished early.
  const doneCount = stages.filter((s) => s.state === 'done' || s.state === 'skipped').length;
  const idx = stages.findIndex((s) => s.state === 'current' || s.state === 'failed');
  return {
    view,
    stages,
    currentStep: idx < 0 ? null : idx + 1,
    doneCount,
    total: stages.length,
    complete: idx < 0 && doneCount === stages.length,
    failed: stages.some((s) => s.state === 'failed'),
    slaStatus: slaStatusOf(view, now),
    slaClock: formatSlaClock(view, now),
  };
}

/**
 * How long something has been open — `45m`, `18h`, `2d 4h`.
 *
 * Coarse on purpose: a stage that opened yesterday is "1d 6h open", not "30h 12m open".
 * The minute matters on an SLA clock, where the number is a deadline; it is noise on an
 * age, where the number is context.
 */
export function formatElapsed(iso?: string, now = Date.now()): string {
  if (!iso) return '';
  const started = new Date(iso).getTime();
  if (Number.isNaN(started)) return '';
  const diff = Math.max(0, now - started);
  const minutes = Math.floor(diff / 6e4);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

/** What share of the SLA window has already been spent, 0–100. */
export function slaSpentPercent(row: GovernanceRequest, now = Date.now()): number {
  const start = new Date(row.submittedAt).getTime();
  const due = new Date(row.slaDueAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(due) || due <= start) return 100;
  return Math.max(0, Math.min(100, ((now - start) / (due - start)) * 100));
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

/** Every approval level configured on this request, decided or not. */
export function approvalLevels(row: GovernanceRequest): ApprovalHop[] {
  return row.stages.find((s) => s.id === 'approval')?.hops ?? [];
}

/**
 * The approval levels a reader may be shown.
 *
 * Every level that has already decided, plus the one deciding now — and nothing after it.
 * A later level is not a fact yet: an approval chain branches on what the level before it
 * decided (a rejection ends the flow, an SoD conflict inserts a security review, a
 * delegation swaps the approver), so drawing the rest of the ladder would be drawing a
 * route nobody has taken and may never take. The whole chain is only knowable in
 * retrospect, which is exactly when {@link approvalFlowComplete} returns true.
 */
export function visibleApprovalLevels(row: GovernanceRequest): ApprovalHop[] {
  const stage = row.stages.find((s) => s.id === 'approval');
  // Nothing has been asked of anyone yet — the request is still in submission or policy.
  if (!stage || stage.state === 'pending') return [];

  const out: ApprovalHop[] = [];
  for (const hop of stage.hops ?? []) {
    out.push(hop);
    if (hop.decision === 'rejected') break;
    if (hop.decision !== 'approved') break;
  }
  return out;
}

/** True once every level has decided — the only time the whole chain is on the page. */
export function approvalFlowComplete(row: GovernanceRequest): boolean {
  const stage = row.stages.find((s) => s.id === 'approval');
  if (!stage || stage.state !== 'done') return false;
  return (stage.hops ?? []).every((h) => h.decision === 'approved' || h.decision === 'rejected');
}

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
    ...requestItems(row).flatMap((i) => [i.resourceName, i.resourceDetail, i.appName, RESOURCE_TYPE_LABEL[i.resourceType]]),
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
