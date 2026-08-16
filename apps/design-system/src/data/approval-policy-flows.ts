/**
 * Authored approval flows for the seeded policies.
 *
 * The policy seed in `seed.ts` carries only metadata (name, description, status) —
 * a policy with an empty `root` has no flow to preview, review, or run history for.
 * These are the flows those six policies actually describe.
 *
 * **Ids are literal and stable, never generated.** `nid()` uses `Date.now()` and
 * `Math.random()`, which is right inside a builder handler and wrong here: these
 * trees are read during SSR as well as on the client, and regenerated ids would
 * both mismatch on hydration and churn React keys on every read (`getApprovalPolicy`
 * re-runs `migrateRoot` each time without persisting).
 *
 * Nodes are authored complete — approver set, SLA non-zero, conditions filled —
 * so `isNodeComplete` passes and an active policy does not read as a broken draft.
 */
import type {
  ApprovalLevelConfig,
  ConditionGroup,
  NotificationConfig,
  ParallelConfig,
  PolicyBranch,
  PolicyNode,
} from './automation-types';
import { BUILTIN_TEMPLATES } from './notification-templates';

/* ------------------------------------------------------------------ *
 * Deterministic factories
 * ------------------------------------------------------------------ */

/** The Approved / Rejected pair every approval-style node fans out into. */
function outcomes(prefix: string): PolicyBranch[] {
  return [
    { id: `${prefix}-ok`, label: 'Approved', seq: [], kind: 'outcome', locked: true, sealed: false },
    { id: `${prefix}-no`, label: 'Rejected', seq: [], kind: 'outcome', locked: true, sealed: false },
  ];
}

function level(
  id: string,
  name: string,
  config: ApprovalLevelConfig,
  branchSeq: Partial<Record<'Approved' | 'Rejected', PolicyNode[]>> = {},
): PolicyNode {
  const branches = outcomes(id).map((b) => ({ ...b, seq: branchSeq[b.label as 'Approved' | 'Rejected'] ?? [] }));
  return { id, type: 'approvalLevel', name, config: config as unknown as Record<string, unknown>, branches };
}

function notify(id: string, name: string, subject: string, body: string): PolicyNode {
  const config: NotificationConfig = {
    email: { enabled: true, template: { name, subject, body } },
    slack: { enabled: false, template: { name: '', body: '' } },
  };
  return { id, type: 'notification', name, config: config as unknown as Record<string, unknown> };
}

/** "Requester department = Finance" and friends. Literal right-hand values. */
function rule(id: string, attribute: string, value: string): ConditionGroup {
  return {
    kind: 'group',
    id: `${id}-grp`,
    combinator: 'AND',
    children: [{ kind: 'rule', id: `${id}-r1`, attribute, operator: 'equals', value }],
  };
}

function conditional(
  id: string,
  name: string,
  ifLabel: string,
  condition: ConditionGroup,
  ifSeq: PolicyNode[],
  elseSeq: PolicyNode[],
): PolicyNode {
  return {
    id,
    type: 'conditionalBranch',
    name,
    branches: [
      { id: `${id}-if`, label: ifLabel, seq: ifSeq, kind: 'if', condition },
      { id: `${id}-else`, label: 'ELSE', seq: elseSeq, kind: 'else', locked: true },
    ],
  };
}

function parallel(id: string, name: string, config: ParallelConfig): PolicyNode {
  return {
    id,
    type: 'parallelBranch',
    name,
    config: config as unknown as Record<string, unknown>,
    // First tier = the approver lanes (derived from config.lanes on load).
    branches: config.lanes.map((l) => ({ id: l.id, label: l.name, seq: [], kind: 'parallelLane' as const, sealed: true })),
    outcomeBranches: outcomes(`${id}-out`),
  };
}

const exitNode = (id: string, name: string): PolicyNode => ({ id, type: 'exit', name });

const sla = (days: number, hours = 0, afterExpiry: ApprovalLevelConfig['sla']['afterExpiry'] = 'autoReject') => ({
  days,
  hours,
  minutes: 0,
  afterExpiry,
});

const REQUEST_TEMPLATE = BUILTIN_TEMPLATES[0];

/* ------------------------------------------------------------------ *
 * The flows
 * ------------------------------------------------------------------ */

/**
 * Keyed by the policy ids in `approvalPolicySeed`. A policy absent from this map
 * simply keeps an empty flow.
 */
export const approvalPolicyFlows: Record<string, PolicyNode[]> = {
  // Two straightforward levels: the requester's manager, then whoever owns the app.
  'ap-joiner-access': [
    notify(
      'ja-notify',
      'Request received',
      'Your access request is being reviewed',
      '<p>Hi {{requester.firstName}},</p><p>Your request for {{request.items}} has been received and is with your manager for approval.</p>',
    ),
    level('ja-l1', 'Manager approval', {
      approverType: 'requesterManager',
      sla: sla(1),
      fallback: { enabled: true, action: 'fallbackApprover', approverEmail: 'people-ops@acme.com' },
    }),
    level('ja-l2', 'Application owner', {
      approverType: 'applicationOwner',
      completionRule: 'anyOne',
      sla: sla(2),
      fallback: { enabled: false },
    }),
  ],

  // High-risk access forks: privileged entitlements need security and the app
  // owner in parallel; everything else takes the ordinary owner path.
  'ap-privileged': [
    level('pv-l1', 'Manager approval', {
      approverType: 'requesterManager',
      sla: sla(0, 12),
      fallback: { enabled: false },
    }),
    conditional(
      'pv-cond',
      'Privileged?',
      'IF',
      rule('pv-cond', 'targetUser.jobRole', 'Engineer'),
      [
        parallel('pv-par', 'Security + owner', {
          lanes: [
            { id: 'pv-par-l1', name: 'Security Governance', approver: { approverType: 'governanceTeam', governanceTeamId: 'gt-secops' } },
            { id: 'pv-par-l2', name: 'Application Owner', approver: { approverType: 'applicationOwner', completionRule: 'anyOne' } },
          ],
          overallRule: 'all',
          requiredApprovals: 2,
          sla: sla(1),
          // Between-tier Fallback chip exercises FlowCanvas SVG merge → stem → fan-out.
          fallback: { enabled: true, action: 'fallbackApprover', approverEmail: 'secops-fallback@acme.com' },
        }),
      ],
      [
        level('pv-else', 'Application owner', {
          approverType: 'applicationOwner',
          completionRule: 'anyOne',
          sla: sla(2),
          fallback: { enabled: false },
        }),
      ],
    ),
  ],

  // Finance systems are SOX-relevant: manager, finance approvers, then a
  // compliance check that ends the flow when it rejects.
  'ap-finance-apps': [
    level('fa-l1', 'Manager approval', {
      approverType: 'requesterManager',
      sla: sla(1),
      fallback: { enabled: false },
    }),
    level('fa-l2', 'Finance approvers', {
      approverType: 'governanceTeam',
      governanceTeamId: 'gt-finance',
      completionRule: 'anyOne',
      sla: sla(1),
      fallback: { enabled: true, action: 'fallbackApprover', approverEmail: 'finance-controls@acme.com' },
    }),
    level(
      'fa-l3',
      'Compliance sign-off',
      {
        approverType: 'governanceTeam',
        governanceTeamId: 'gt-compliance',
        completionRule: 'all',
        sla: sla(3),
        fallback: { enabled: false },
      },
      { Rejected: [exitNode('fa-exit', 'Close request')] },
    ),
  ],

  // Draft: a sponsor signs off, then the request notifies IT to provision.
  'ap-contractor': [
    level('co-l1', 'Sponsoring manager', {
      approverType: 'requesterManager',
      sla: sla(2),
      fallback: { enabled: false },
    }),
    notify(
      'co-notify',
      'Provision contractor access',
      'Contractor access approved — action required',
      '<p>{{requester.displayName}} has approved contractor access for {{request.targetUser}}.</p><p>Provision the listed access and confirm in ServiceNow.</p>',
    ),
  ],

  // Low-risk SaaS: one manager approval and nothing else.
  'ap-saas-selfserve': [
    level('ss-l1', 'Manager approval', {
      approverType: 'requesterManager',
      sla: sla(1, 0, 'autoApprove'),
      fallback: { enabled: true, action: 'autoApprove' },
    }),
  ],

  // Break-glass: security approves fast, and a retrospective review is opened
  // whichever way the decision goes.
  'ap-emergency': [
    level(
      'em-l1',
      'Security Governance',
      {
        approverType: 'governanceTeam',
        governanceTeamId: 'gt-secops',
        completionRule: 'anyOne',
        sla: sla(0, 4),
        fallback: { enabled: true, action: 'notify' },
      },
      {
        Approved: [
          notify(
            'em-notify',
            'Break-glass granted',
            'Emergency access granted — retrospective review opened',
            '<p>Emergency access was granted to {{request.targetUser}}. A retrospective review has been opened and must be closed within 5 working days.</p>',
          ),
        ],
      },
    ),
  ],
};

/** The template the seeded notification bodies are modelled on. */
export const SEEDED_NOTIFICATION_TEMPLATE = REQUEST_TEMPLATE;
