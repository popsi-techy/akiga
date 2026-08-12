/**
 * Workflow execution history — seed only, no store.
 *
 * A workflow run records the same facts as an approval run (when it started,
 * what it touched, step-by-step outcomes, what was provisioned), so it reuses
 * `ApprovalRun` rather than cloning the shape. The differences are vocabulary,
 * already carried by the shared enums: the outcome is `completed` rather than
 * `approved`, the trigger is a `Lifecycle event`, and steps `match` and `assign`
 * instead of approving.
 *
 * The `approver` field names whichever actor performed the step — for a workflow
 * that is usually the system, and occasionally an approval policy the workflow
 * delegated to.
 *
 * Timestamps are fixed and relative to `RUNS_AS_OF`, so a run reads identically
 * on every load — no wall-clock drift between server and client.
 */
import { RUNS_AS_OF, type ApprovalRun, type RunStats } from './approval-runs';

export { RUNS_AS_OF };

/**
 * Runs are keyed by workflow id. There is no workflow seed (an empty list is
 * valid), so these attach to whatever ids exist; a workflow with no runs simply
 * shows the empty state.
 */
const WORKFLOW_RUNS: ApprovalRun[] = [
  {
    id: 'wfrun-3081',
    policyId: 'wf-joiner-onboarding',
    reference: 'WF-3081',
    startedAt: '2026-08-09T06:02:00.000Z',
    completedAt: null,
    outcome: 'running',
    duration: null,
    requesterId: 'o-nathan',
    targetUserId: 'o-nathan',
    request: 'Joiner · Nathan Green · Data',
    trigger: 'Lifecycle event',
    slaBreached: false,
    steps: [
      { nodeId: 'n1', label: 'User Filter', approver: 'System', decision: 'matched', at: '2026-08-09T06:02:00.000Z', duration: '2s', note: 'Department = Data' },
      { nodeId: 'n2', label: 'Conditional Branch', approver: 'System', decision: 'matched', at: '2026-08-09T06:02:04.000Z', duration: '1s', note: 'Job Title = Data Engineer' },
      { nodeId: 'n3', label: 'Assign Entities', approver: 'System', decision: 'pending', at: null, duration: null, note: 'Waiting on the attached approval policy' },
    ],
    grants: [
      { userId: 'o-nathan', target: 'Snowflake Read', targetKind: 'Entitlement', application: 'Snowflake', result: 'pending', detail: 'Awaiting approval' },
    ],
  },
  {
    id: 'wfrun-3074',
    policyId: 'wf-joiner-onboarding',
    reference: 'WF-3074',
    startedAt: '2026-08-07T08:15:00.000Z',
    completedAt: '2026-08-07T08:19:00.000Z',
    outcome: 'completed',
    duration: '4m',
    requesterId: 'o-bob',
    targetUserId: 'o-bob',
    request: 'Joiner · Bob Smith · Finance',
    trigger: 'Lifecycle event',
    slaBreached: false,
    steps: [
      { nodeId: 'n1', label: 'User Filter', approver: 'System', decision: 'matched', at: '2026-08-07T08:15:00.000Z', duration: '1s', note: 'Department = Finance' },
      { nodeId: 'n2', label: 'Conditional Branch', approver: 'System', decision: 'no-match', at: '2026-08-07T08:15:02.000Z', duration: '1s', note: 'Fell through to ELSE' },
      { nodeId: 'n4', label: 'Assign Entities', approver: 'System', decision: 'assigned', at: '2026-08-07T08:17:00.000Z', duration: '2m', note: 'Baseline finance access' },
      { nodeId: 'n5', label: 'Notification', approver: 'System', decision: 'notified', at: '2026-08-07T08:19:00.000Z', duration: '3s', note: 'Welcome email sent' },
    ],
    grants: [
      { userId: 'o-bob', target: 'NetSuite Read', targetKind: 'Entitlement', application: 'NetSuite', result: 'granted' },
      { userId: 'o-bob', target: 'Finance Analyst', targetKind: 'Business Role', application: 'Workday', result: 'granted' },
    ],
  },
  {
    id: 'wfrun-3060',
    policyId: 'wf-joiner-onboarding',
    reference: 'WF-3060',
    startedAt: '2026-08-04T11:40:00.000Z',
    completedAt: '2026-08-04T11:46:00.000Z',
    outcome: 'failed',
    duration: '6m',
    requesterId: 'o-frank',
    targetUserId: 'o-frank',
    request: 'Joiner · Frank Wilson · Engineering',
    trigger: 'Lifecycle event',
    slaBreached: false,
    steps: [
      { nodeId: 'n1', label: 'User Filter', approver: 'System', decision: 'matched', at: '2026-08-04T11:40:00.000Z', duration: '1s', note: 'Department = Engineering' },
      { nodeId: 'n3', label: 'Assign Entities', approver: 'System', decision: 'skipped', at: '2026-08-04T11:46:00.000Z', duration: '6m', note: 'Connector unreachable — GitHub' },
    ],
    grants: [
      { userId: 'o-frank', target: 'GitHub Write', targetKind: 'Entitlement', application: 'GitHub', result: 'failed', detail: 'Connector timed out after 3 retries' },
    ],
  },
];

export function listWorkflowRuns(workflowId: string): ApprovalRun[] {
  return WORKFLOW_RUNS.filter((r) => r.policyId === workflowId).sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
}

/** Same shape as approval stats; `approved` counts completed runs for a workflow. */
export function workflowRunStats(workflowId: string): RunStats {
  const runs = listWorkflowRuns(workflowId);
  const finished = runs.filter((r) => r.outcome !== 'running');
  const completed = runs.filter((r) => r.outcome === 'completed').length;
  return {
    total: runs.length,
    approved: completed,
    rejected: runs.filter((r) => r.outcome === 'failed').length,
    running: runs.filter((r) => r.outcome === 'running').length,
    breached: runs.filter((r) => r.slaBreached).length,
    approvalRate: finished.length === 0 ? 0 : Math.round((completed / finished.length) * 100),
  };
}
