/**
 * Automation domain types (Approval Policies first; Workflows follow in Phase 2).
 * The builder tree (`root`) is modelled loosely here and refined into a proper
 * discriminated union as node configs land in M3–M5. The list only needs the
 * envelope (name, status, timestamps).
 */
export type PolicyStatus = 'draft' | 'active';

export type PolicyNodeType =
  | 'approvalLevel'
  | 'notification'
  | 'parallelBranch'
  | 'conditionalBranch'
  | 'skip'
  | 'exit';

// ---- node configuration (M4+) ----------------------------------------
export type ApproverType =
  | 'targetUserOwner'
  | 'requesterManager'
  | 'applicationOwner'
  | 'entitlementOwner'
  | 'roleOwner'
  | 'resourceOwner'
  | 'user'
  | 'governanceTeam'
  | 'approverOwner';

/** Display label for every approver type — the single source of truth for the
    approver dropdown, canvas node summaries, and parallel-lane labels.
    Object key order = dropdown order. */
export const APPROVER_TYPE_LABEL: Record<ApproverType, string> = {
  targetUserOwner: 'Target User Manager',
  requesterManager: 'Requester Manager',
  applicationOwner: 'Application Owner',
  entitlementOwner: 'Entitlement Owner',
  roleOwner: 'Role Owner',
  resourceOwner: 'Resource Owner',
  user: 'Predefined User',
  governanceTeam: 'Governance Team',
  approverOwner: "Last Approver's Manager",
};

/** Approver types that can resolve to more than one person and so need a
    completion rule (All / Any one / Majority). Manager types are single —
    no completion rule. */
export const MULTI_APPROVER_TYPES: ApproverType[] = [
  'applicationOwner',
  'entitlementOwner',
  'roleOwner',
  'resourceOwner',
  'governanceTeam',
];

export type CompletionRule = 'all' | 'anyOne' | 'majority';

export interface SlaConfig {
  days: number;
  hours: number;
  minutes: number;
  /** 'createBranch' adds an "SLA Breached" outcome lane. */
  afterExpiry: 'autoApprove' | 'autoReject' | 'createBranch';
}

/** What happens when the primary approver can't be resolved (e.g. no owner found). */
export type FallbackAction = 'autoApprove' | 'autoReject' | 'notify' | 'fallbackApprover';
/** What happens if the manually-entered fallback approver's SLA is breached.
    Drives the "Fallback SLA Breached" outcome lane (Auto Approve / Auto Reject /
    or Create branch). The fallback person is shown between the Approval Level
    card and the outcome fan-out. */
export type FallbackApproverResolution = 'autoApprove' | 'autoReject' | 'createBranch';

export interface FallbackConfig {
  enabled: boolean;
  action?: FallbackAction;
  /** 'notify' targets — independently selectable (both may be on at once). */
  notifyAdmin?: boolean;
  notifyCustomEmail?: boolean;
  notifyEmail?: string;
  /** 'fallbackApprover' target — a manually typed email (no picker). */
  approverEmail?: string;
  approverResolution?: FallbackApproverResolution;
}

export interface ApprovalLevelConfig {
  approverType?: ApproverType;
  governanceTeamId?: string;
  userId?: string;
  /** Only meaningful for owner / governanceTeam. */
  completionRule?: CompletionRule;
  sla: SlaConfig;
  fallback: FallbackConfig;
}

// ---- notification config (M4b) ----------------------------------------
export interface NotifTemplate {
  /** Present for saved custom templates. */
  id?: string;
  name: string;
  subject?: string; // email only
  body: string; // may contain simple HTML
}
export interface NotificationChannelConfig {
  enabled: boolean;
  template: NotifTemplate;
}
export interface NotificationConfig {
  email: NotificationChannelConfig;
  slack: NotificationChannelConfig;
}

// ---- conditions (Conditional Branch; reused by Workflow filters) ------
export type ConditionOperator = 'equals' | 'notEquals' | 'contains' | 'notContains' | 'is' | 'isNot';
/** Canonical operator → compact symbol, for summaries (e.g. "Department = Engineering").
    Containment uses the superset pair (⊃ / ⊅): "left ⊃ right" reads "left contains right". */
export const OPERATOR_SYMBOL: Record<ConditionOperator, string> = {
  equals: '=',
  notEquals: '≠',
  contains: '⊃',
  notContains: '⊅',
  is: '=',
  isNot: '≠',
};
export interface ConditionRule {
  kind: 'rule';
  id: string;
  attribute?: string;
  /** Unset until the user picks an operator (placeholder in the builder). */
  operator?: ConditionOperator;
  value?: string;
}
export interface ConditionGroup {
  kind: 'group';
  id: string;
  combinator: 'AND' | 'OR';
  children: ConditionNode[];
}
export type ConditionNode = ConditionRule | ConditionGroup;

// ---- parallel lane approver + config ---------------------------------
export interface LaneApprover {
  approverType?: ApproverType;
  governanceTeamId?: string;
  userId?: string;
  completionRule?: CompletionRule;
}
export interface ParallelLane {
  id: string;
  name: string;
  approver: LaneApprover;
}
export interface ParallelConfig {
  lanes: ParallelLane[];
  overallRule: 'all' | 'anyOne' | 'majority' | 'threshold';
  /** Required count for the threshold rule; clamped to [1, lanes.length]. */
  requiredApprovals: number;
  sla: SlaConfig;
  /** Same fallback model as Approval Level — when a parallel approver can't be resolved. */
  fallback: FallbackConfig;
}

/** A lane inside a branching node; holds its own nested sequence. */
export interface PolicyBranch {
  id: string;
  label: string;
  seq: PolicyNode[];
  /** Semantic role of the lane. */
  kind?: 'if' | 'elseif' | 'else' | 'outcome' | 'parallelLane';
  /** IF / ELSE IF condition. */
  condition?: ConditionGroup;
  /** Label not renamable / lane not removable (ELSE, Approved/Rejected). */
  locked?: boolean;
  /** Sealed lanes (parallel approver slots) accept no inserted components. */
  sealed?: boolean;
}

/**
 * Builder node. Per-type configuration (approver, SLA, channels, conditions…) is
 * added in M4–M5; M3 models structure + branches. Branching nodes carry `branches`.
 */
export interface PolicyNode {
  id: string;
  type: PolicyNodeType;
  /** Optional custom display name (falls back to the node type's title). */
  name?: string;
  /** Present on branching nodes (conditional/parallel). */
  branches?: PolicyBranch[];
  /** Second-tier fan-out after `branches` merge (parallel branch → Approved/Rejected). */
  outcomeBranches?: PolicyBranch[];
  /** Type-specific config, filled in later milestones. */
  config?: Record<string, unknown>;
}

export interface ApprovalPolicy {
  id: string;
  policyName: string;
  description: string;
  status: PolicyStatus;
  /** Ordered sequence of nodes between the Policy card and End. */
  root: PolicyNode[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** Row projection for the list table. */
export interface ApprovalPolicyRow {
  id: string;
  policyName: string;
  description: string;
  status: PolicyStatus;
  createdAt: string;
  updatedAt: string;
}

// =====================================================================
// Workflows submodule
// =====================================================================
export type WorkflowStatus = 'draft' | 'active';
export type WorkflowEventType = 'joiner' | 'mover' | 'leaver';
/**
 * The verbs a lifecycle workflow is made of.
 *
 * The first nine were enough to *shape* a workflow — filter, branch, wait, assign,
 * notify. The rest were added with the template library, because a joiner template
 * that says "create the EntraID account, set the UPN, assign the licence" cannot be
 * expressed as three Assign Entities blocks without lying about what happens: an
 * entitlement grant and an account creation are different operations against
 * different systems, and a leaver workflow that "assigns" a disabled account is
 * nonsense.
 *
 * Each one is a verb an IGA connector actually performs, which is why they are
 * separate types rather than modes of one "action" block: the canvas has to say
 * what a step does at a glance, and "Action" says nothing.
 */
export type WorkflowBlockType =
  | 'userFilter'
  | 'assignEntities'
  | 'notification'
  | 'multisplitBranch'
  | 'wfConditionalBranch'
  | 'delay'
  | 'waitForUser'
  | 'skip'
  | 'exit'
  // ---- lifecycle operations (template library) ----
  /** Create or re-enable an account in a target system. */
  | 'provisionAccount'
  /** Write identity attributes, with transformation (UPN, mail domain, title). */
  | 'setAttributes'
  /** Assign, downgrade or reclaim a licence. */
  | 'manageLicense'
  /** Remove access — the mirror of Assign Entities. */
  | 'revokeAccess'
  /** Disable, re-enable, convert or delete an account; revoke sessions and MFA. */
  | 'accountAction'
  /** Hand a departing person's mailbox and files to someone who remains. */
  | 'delegateAccess'
  /** Start an access certification over what the identity currently holds. */
  | 'triggerReview';

export interface WorkflowBranch {
  id: string;
  label: string;
  seq: WorkflowNode[];
  /** if/elseif/else for conditional; split/else for multisplit. */
  kind?: 'if' | 'elseif' | 'else' | 'split' | 'elseSplit';
  condition?: ConditionGroup;
  /** Multisplit per-lane matching values, keyed by attribute id. */
  matchValues?: Record<string, string[]>;
  locked?: boolean;
}
export interface WorkflowNode {
  id: string;
  type: WorkflowBlockType;
  /** Optional custom display name (falls back to the block type's title). */
  name?: string;
  branches?: WorkflowBranch[];
  config?: Record<string, unknown>;
}
export interface WorkflowEvent {
  type: WorkflowEventType;
  label: string;
  description: string;
}
export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  event: WorkflowEvent | null;
  root: WorkflowNode[];
  createdAt: string;
  updatedAt: string;
}
export interface WorkflowRow {
  id: string;
  name: string;
  eventType: WorkflowEventType | null;
  status: WorkflowStatus;
  createdAt: string;
  updatedAt: string;
}

// ---- block configs ----------------------------------------------------
export interface EntitySelection {
  id: string;
  name: string;
  appName?: string;
}
export interface AssignEntitiesConfig {
  entitlements: EntitySelection[];
  technicalRoles: EntitySelection[];
  businessRoles: EntitySelection[];
  /**
   * Birthright policies to apply wholesale — granting the bundle rather than
   * re-listing its contents here. Optional so workflows saved before this
   * existed still load.
   */
  birthrightPolicies?: EntitySelection[];
  approvalPolicyId?: string;
  approvalPolicyName?: string;
  criteria?: ConditionGroup;
}
export interface UserFilterConfig {
  condition: ConditionGroup;
}
export interface MultisplitConfig {
  splitAttributes: string[];
}
/** Delay (Flow Control) — pauses the workflow for a fixed duration. */
export interface DelayConfig {
  days: number;
  hours: number;
  minutes: number;
}

/** Wait for user (Flow Control) — poll IAM connections until the identity appears. */
export interface WaitForUserConfig {
  days: number;
  hours: number;
  minutes: number;
  maxRetries: number;
  unlimitedRetries: boolean;
  /** Application ids from the directory catalog (IAM connection stand-ins). */
  connectionIds: string[];
}

// ---- lifecycle operation configs (template library) -------------------

/**
 * A target system, named rather than picked from the connector registry.
 *
 * Templates ship with plausible targets ("Microsoft Entra ID", "Office 365") that
 * an administrator maps to their own connections when they use one. Storing the
 * name keeps a template readable in the preview before any connection exists,
 * which is the point — a preview that says "select a connection" three times has
 * not previewed anything.
 */
export interface TargetSystem {
  id: string;
  name: string;
}

export interface ProvisionAccountConfig {
  targets: TargetSystem[];
  /** Create a new account, or re-enable one that already exists (rehire, re-enrol). */
  mode: 'create' | 'reactivate';
  /** Keep the previous username, mail and employee id where the record survives. */
  preserveIdentifiers?: boolean;
  /** Mailbox, drive and collaboration membership provisioned alongside the account. */
  services?: string[];
}

/** One attribute written on the identity, optionally derived from another. */
export interface AttributeRule {
  attribute: string;
  /** A literal, or an expression over source attributes. */
  value: string;
  /** Shown as "conditional" on the canvas; the condition itself is authored later. */
  conditional?: boolean;
}
export interface SetAttributesConfig {
  rules: AttributeRule[];
}

export interface ManageLicenseConfig {
  action: 'assign' | 'downgrade' | 'reclaim';
  /** Licence bundle names, e.g. "Microsoft 365 E3". */
  licenses: string[];
  /** Assign only where an attribute or role calls for it. */
  conditional?: boolean;
}

export interface RevokeAccessConfig {
  /** Everything, or only what the previous role granted. */
  scope: 'all' | 'roleBased' | 'selected';
  entitlements?: EntitySelection[];
  technicalRoles?: EntitySelection[];
  /** Systems the removal reaches. */
  targets?: TargetSystem[];
}

export type AccountActionKind =
  | 'disableSignIn'
  | 'revokeSessions'
  | 'blockMfa'
  | 'convertMailbox'
  | 'reEnable'
  | 'archiveData'
  | 'deleteAccount';

export interface AccountActionConfig {
  actions: AccountActionKind[];
  /** Retention before a destructive action runs, in days. */
  retentionDays?: number;
}

export interface DelegateAccessConfig {
  /** Who inherits — resolved at run time rather than named here. */
  delegateTo: 'manager' | 'successor' | 'namedUser';
  delegateName?: string;
  /** Mailbox, OneDrive, or both. */
  assets: string[];
}

export interface TriggerReviewConfig {
  /** What the reviewer is asked to confirm still belongs. */
  scope: 'previousRole' | 'allAccess';
  reviewer: 'newManager' | 'previousManager' | 'applicationOwner';
  dueInDays: number;
}
