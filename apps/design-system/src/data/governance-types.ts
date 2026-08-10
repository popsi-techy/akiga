/**
 * Governance Model — the type layer for the governance intelligence surface.
 *
 * The model is deliberately *uniform*: every governable thing — a department, an
 * application, a policy, a delegation, a person acting in a governance role — is
 * one `GovEntity` with the same shape, and everything that connects two of them is
 * one `GovRelationship` with an explicit, human-readable type. That uniformity is
 * what lets a single canvas, a single explorer table, a single details panel and a
 * single findings engine cover fourteen entity kinds without fourteen special cases.
 *
 * Layers (`GovLayer`) are the model's spine and the canvas's columns:
 *
 *   organization → roles → access → controls → chain → responsibility
 *
 * Relationships are authored so they always flow left-to-right along that spine
 * (an application is `owned-by` a person, never the reverse), which is what keeps
 * the map a readable layered graph instead of a hairball. Two relationship types
 * are intra-layer by design (`inherited-from`, `grants`) and the canvas routes them
 * as side loops.
 *
 * See `docs/product/04-domain/governance-model.md` and ADR-0010.
 */
import type { RiskTier } from '@/lib/risk';

/* ------------------------------------------------------------------ *
 * Entities
 * ------------------------------------------------------------------ */

/** The six governance layers, in the order they are read left-to-right. */
export type GovLayer = 'organization' | 'roles' | 'access' | 'controls' | 'chain' | 'responsibility';

/** The four domains the Explorer's scope rail groups entity kinds under. */
export type GovDomain = 'organization' | 'access' | 'policies' | 'governance';

export type GovEntityKind =
  // organization
  | 'department'
  | 'location'
  // roles
  | 'business-role'
  | 'technical-role'
  // access
  | 'application'
  | 'entitlement'
  // controls
  | 'birthright-policy'
  | 'approval-policy'
  | 'approval-workflow'
  | 'sod-policy'
  // chain
  | 'delegation'
  | 'escalation-rule'
  // responsibility
  | 'governance-role'
  | 'person';

export type GovStatus = 'active' | 'draft' | 'inactive' | 'expired';

/** A compact fact shown on a canvas node and in the details panel header. */
export interface GovMetric {
  label: string;
  value: string | number;
}

/**
 * One governable thing. Ownership is modelled as three distinct responsibilities
 * because conflating them is exactly the governance failure this surface exists to
 * expose: the person who owns an application is often not the person who should
 * certify access to it.
 */
export interface GovEntity {
  id: string;
  kind: GovEntityKind;
  name: string;
  /** One sentence, shown under the name in the details panel. */
  description: string;
  /** 0–100. Rendered only through `RiskScoreChip` / `RiskDot` — never re-mapped. */
  risk: number;
  status: GovStatus;
  /** Node body lines. The canvas shows at most two; the panel shows all. */
  metrics: GovMetric[];
  /** Organizational scope — empty means "not scoped to a department/location". */
  departmentIds: string[];
  locationIds: string[];
  /** Accountable for the thing itself (application owner, policy owner, role owner). */
  ownerIds: string[];
  /** Accountable for certifying access to it. */
  reviewOwnerIds: string[];
  /** Accountable for approving requests for it. */
  approvalOwnerIds: string[];
  /** Governance roles this entity is governed under. */
  governanceRoleIds: string[];
  updatedAt: string;
  updatedBy: string;
}

export const LAYER_OF: Record<GovEntityKind, GovLayer> = {
  department: 'organization',
  location: 'organization',
  'business-role': 'roles',
  'technical-role': 'roles',
  application: 'access',
  entitlement: 'access',
  'birthright-policy': 'controls',
  'approval-policy': 'controls',
  'approval-workflow': 'controls',
  'sod-policy': 'controls',
  delegation: 'chain',
  'escalation-rule': 'chain',
  'governance-role': 'responsibility',
  person: 'responsibility',
};

export const DOMAIN_OF: Record<GovEntityKind, GovDomain> = {
  department: 'organization',
  location: 'organization',
  'business-role': 'organization',
  'technical-role': 'organization',
  application: 'access',
  entitlement: 'access',
  'birthright-policy': 'policies',
  'approval-policy': 'policies',
  'approval-workflow': 'policies',
  'sod-policy': 'policies',
  delegation: 'governance',
  'escalation-rule': 'governance',
  'governance-role': 'governance',
  person: 'governance',
};

/** Singular / plural display names. The plural is what the scope rail shows. */
export const KIND_LABEL: Record<GovEntityKind, { one: string; many: string }> = {
  department: { one: 'Department', many: 'Departments' },
  location: { one: 'Location', many: 'Locations' },
  'business-role': { one: 'Business Role', many: 'Business Roles' },
  'technical-role': { one: 'Technical Role', many: 'Technical Roles' },
  application: { one: 'Application', many: 'Applications' },
  entitlement: { one: 'Entitlement', many: 'Entitlements' },
  'birthright-policy': { one: 'Birthright Policy', many: 'Birthright Policies' },
  'approval-policy': { one: 'Approval Policy', many: 'Approval Policies' },
  'approval-workflow': { one: 'Approval Workflow', many: 'Approval Workflows' },
  'sod-policy': { one: 'SoD Policy', many: 'SoD Policies' },
  delegation: { one: 'Delegation', many: 'Delegations' },
  'escalation-rule': { one: 'Escalation Rule', many: 'Escalation Rules' },
  'governance-role': { one: 'Governance Role', many: 'Governance Roles' },
  person: { one: 'Person', many: 'People' },
};

export const DOMAIN_LABEL: Record<GovDomain, string> = {
  organization: 'Organization',
  access: 'Access',
  policies: 'Policies',
  governance: 'Governance',
};

/** Scope-rail order — the reading order of the model, not alphabetical. */
export const DOMAIN_KINDS: Record<GovDomain, GovEntityKind[]> = {
  organization: ['department', 'location', 'business-role', 'technical-role'],
  access: ['application', 'entitlement'],
  policies: ['birthright-policy', 'approval-policy', 'approval-workflow', 'sod-policy'],
  governance: ['governance-role', 'person', 'delegation', 'escalation-rule'],
};

export const LAYER_LABEL: Record<GovLayer, string> = {
  organization: 'Organization',
  roles: 'Roles',
  access: 'Access',
  controls: 'Governance Controls',
  chain: 'Approval Chain',
  responsibility: 'Responsibility',
};

export const LAYER_ORDER: GovLayer[] = ['organization', 'roles', 'access', 'controls', 'chain', 'responsibility'];

/* ------------------------------------------------------------------ *
 * Relationships
 * ------------------------------------------------------------------ */

/**
 * Relationship types are a closed set on purpose. A line on the canvas must say
 * *why* the two things are connected — "Salesforce → governed by → Finance Access
 * Policy" — so a new kind of connection means a new named type here, reviewed, not
 * an untyped edge added at a call site.
 */
export type GovRelationType =
  | 'operates-in' //      Department  → Location
  | 'assigned-through' // Department/Person → Business Role, Role → Application
  | 'inherited-from' //   Business Role → Technical Role
  | 'grants' //           Role/Policy → Entitlement, Application → Entitlement
  | 'governed-by' //      Application/Entitlement → Approval or Birthright Policy
  | 'protected-by' //     Application/Role → SoD Policy
  | 'applies-to' //       Policy → Department / Location
  | 'enforced-by' //      Approval Policy → Approval Workflow
  | 'owned-by' //         anything → Person (accountable owner)
  | 'reviewed-by' //      Application/Entitlement → Person (access review owner)
  | 'approved-by' //      Approval Policy/Application → Person or Governance Role
  | 'delegated-to' //     Delegation → Person
  | 'escalates-to' //     Escalation Rule → Person or Governance Role
  | 'held-by'; //         Governance Role → Person

export interface GovRelationMeta {
  /** The verb rendered on the edge and in the relationship card. */
  label: string;
  /** What the relationship means, shown in the relationship card. */
  description: string;
}

export const RELATION_META: Record<GovRelationType, GovRelationMeta> = {
  'operates-in': {
    label: 'operates in',
    description: 'The organizational unit has people and access in this location.',
  },
  'assigned-through': {
    label: 'assigned through',
    description: 'Access reaches its holder by way of this role or assignment path.',
  },
  'inherited-from': {
    label: 'inherited from',
    description: 'The permissions on the source are inherited from the target, not granted directly.',
  },
  grants: {
    label: 'grants',
    description: 'The source confers this entitlement on whoever holds it.',
  },
  'governed-by': {
    label: 'governed by',
    description: 'Requests for this access are decided under the target policy.',
  },
  'protected-by': {
    label: 'protected by',
    description: 'A separation-of-duties control constrains what may be held alongside this.',
  },
  'applies-to': {
    label: 'applies to',
    description: 'The policy takes effect across this part of the organization.',
  },
  'enforced-by': {
    label: 'enforced by',
    description: 'The control is carried out at runtime by this workflow or governance role.',
  },
  'owned-by': {
    label: 'owned by',
    description: 'Accountable for the object itself — its configuration, its lifecycle, its risk.',
  },
  'reviewed-by': {
    label: 'reviewed by',
    description: 'Accountable for certifying who should keep this access at review time.',
  },
  'approved-by': {
    label: 'approved by',
    description: 'Decides requests for this access before it is provisioned.',
  },
  'delegated-to': {
    label: 'delegated to',
    description: 'Authority has been temporarily transferred to this person.',
  },
  'escalates-to': {
    label: 'escalates to',
    description: 'Where the decision moves when the previous level does not act in time.',
  },
  'held-by': {
    label: 'held by',
    description: 'The people who staff this governance role and carry its accountability.',
  },
};

export interface GovRelationship {
  id: string;
  source: string;
  target: string;
  type: GovRelationType;
  /** What part of the organization or access the relationship covers. */
  scope: string;
  /** Whether the relationship is currently in force. */
  effective: 'active' | 'pending' | 'inactive';
  /** Why this connection carries risk — shown in the relationship card when set. */
  riskNote?: string;
  updatedAt: string;
  /** Who is accountable for the relationship itself (usually the target's owner). */
  ownerId?: string;
}

/* ------------------------------------------------------------------ *
 * Findings — governance gaps
 * ------------------------------------------------------------------ */

export type GovFindingKind =
  | 'missing-owner'
  | 'missing-review-owner'
  | 'missing-policy-owner'
  | 'broken-approval-chain'
  | 'unmanaged-delegation'
  | 'expired-delegation'
  | 'escalation-gap'
  | 'sod-conflict'
  | 'orphaned-policy'
  | 'uncontrolled-application'
  | 'conflicting-ownership';

/**
 * A finding is never a bare label. Every one answers the five questions the risk
 * drill-down asks: what is wrong, why it matters, what is affected, who owns it,
 * and what should be done — so no part of the UI has to invent an explanation.
 */
export interface GovFinding {
  id: string;
  kind: GovFindingKind;
  severity: RiskTier;
  /** The entity the finding is attached to. */
  entityId: string;
  title: string;
  /** What is wrong. */
  what: string;
  /** Why it matters, in governance terms. */
  why: string;
  /** What is affected — users, departments, downstream access. */
  impact: GovMetric[];
  /** Who is accountable for fixing it, or null when that is the gap itself. */
  ownerId: string | null;
  /** The recommended action, phrased as an instruction. */
  action: string;
}

export const FINDING_LABEL: Record<GovFindingKind, string> = {
  'missing-owner': 'Missing owner',
  'missing-review-owner': 'Missing access review owner',
  'missing-policy-owner': 'Missing policy owner',
  'broken-approval-chain': 'Broken approval chain',
  'unmanaged-delegation': 'Unmanaged delegation',
  'expired-delegation': 'Expired delegation',
  'escalation-gap': 'Escalation gap',
  'sod-conflict': 'SoD conflict',
  'orphaned-policy': 'Orphaned policy',
  'uncontrolled-application': 'Uncontrolled application',
  'conflicting-ownership': 'Conflicting ownership',
};

/** The health-summary metrics, in display order. Each one filters the model. */
export type GovHealthMetricId =
  | 'coverage'
  | 'high-risk'
  | 'ownership-gaps'
  | 'policy-conflicts'
  | 'sod-violations'
  | 'approval-issues';

export interface GovHealthMetric {
  id: GovHealthMetricId;
  label: string;
  value: string;
  /** Finding kinds this metric drills into. Empty = not a findings filter. */
  kinds: GovFindingKind[];
  /** Set when the number is a problem count worth marking. */
  tone: 'neutral' | 'warning' | 'danger' | 'success';
}

/* ------------------------------------------------------------------ *
 * Approval chain
 * ------------------------------------------------------------------ */

export type GovApproverType = 'manager' | 'departmentHead' | 'applicationOwner' | 'governanceRole' | 'user';

export interface GovApprovalLevel {
  level: number;
  approverType: GovApproverType;
  /** Person or governance-role id. `null` means the approver cannot be resolved. */
  approverId: string | null;
  /** Shown when `approverId` is null, or as the level's role name. */
  approverLabel: string;
  /** Hours before the level breaches its SLA. */
  slaHours: number;
  fallbackApproverId: string | null;
  delegationId: string | null;
  escalationRuleId: string | null;
}

export interface GovApprovalHierarchy {
  id: string;
  /** The approval policy this chain belongs to. */
  policyId: string;
  name: string;
  levels: GovApprovalLevel[];
}

export interface GovDelegation {
  id: string;
  fromId: string;
  toId: string;
  scope: string;
  /** ISO date, or null when the delegation has no end — itself a finding. */
  validUntil: string | null;
  status: 'active' | 'expired';
}

export interface GovEscalationLevel {
  level: number;
  /** Person or governance-role id; null when the level has no assignee. */
  approverId: string | null;
  approverLabel: string;
  /** Hours of inaction before this level takes over. */
  afterHours: number;
}

export interface GovEscalationRule {
  id: string;
  name: string;
  levels: GovEscalationLevel[];
  /** Final disposition when the last level also fails to act. */
  terminalAction: 'auto-reject' | 'hold' | 'none';
}
