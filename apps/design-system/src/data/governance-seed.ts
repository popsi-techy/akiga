/**
 * Governance Model seed — the governance-only facts that do not live anywhere else.
 *
 * Everything the Directory already owns (applications, entitlements, roles,
 * governance groups, people) is read from `seed.ts` and is NOT restated here.
 * This file adds the layer above it: organizational structure, the policies and
 * workflows that govern access, and the responsibility chain — ownership, approval
 * hierarchies, delegations, escalations.
 *
 * Deterministic by construction: no `Date.now()`, no `Math.random()`. "Now" is the
 * fixed `AS_OF` date below, so an expired delegation stays expired on every load and
 * the seeded governance findings never drift.
 *
 * Several gaps are **deliberate** and drive the findings engine. They are marked
 * `GAP:` at the point they occur — do not "fix" them by filling in an owner.
 */
import type { GovApprovalHierarchy, GovDelegation, GovEscalationRule, GovStatus } from './governance-types';

/** The model's "today". Delegation expiry and staleness are measured against it. */
export const AS_OF = '2026-08-09';

/* ------------------------------------------------------------------ *
 * Organizational structure
 * ------------------------------------------------------------------ */

export interface SeedLocation {
  id: string;
  name: string;
  /** City / site, shown as the node's second line. */
  site: string;
  region: string;
  headcount: number;
  /** Data-residency or regulatory note that affects governance in this location. */
  note: string;
}

export const govLocations: SeedLocation[] = [
  { id: 'loc-in', name: 'India', site: 'Pune', region: 'APAC', headcount: 820, note: 'Largest delivery site; heavy contractor population.' },
  { id: 'loc-sg', name: 'Singapore', site: 'Singapore', region: 'APAC', headcount: 214, note: 'APAC engineering and regional sales hub.' },
  { id: 'loc-de', name: 'Germany', site: 'Frankfurt', region: 'EMEA', headcount: 176, note: 'EU data residency applies to finance records.' },
  { id: 'loc-us', name: 'United States', site: 'Austin', region: 'AMER', headcount: 604, note: 'SOX-relevant entity; finance controls in scope.' },
  { id: 'loc-uk', name: 'United Kingdom', site: 'London', region: 'EMEA', headcount: 188, note: 'Regional sales and compliance function.' },
  { id: 'loc-jp', name: 'Japan', site: 'Tokyo', region: 'APAC', headcount: 138, note: 'Support-only site; no privileged infrastructure access.' },
];

export interface SeedDepartment {
  id: string;
  name: string;
  description: string;
  headcount: number;
  /** The department head — accountable for access decisions in this unit. */
  headId: string;
  locationIds: string[];
  risk: number;
}

export const govDepartments: SeedDepartment[] = [
  { id: 'dep-finance', name: 'Finance', description: 'Accounting, treasury, procurement, and financial reporting.', headcount: 186, headId: 'o-hana', locationIds: ['loc-in', 'loc-de', 'loc-us'], risk: 64 },
  { id: 'dep-engineering', name: 'Engineering', description: 'Product engineering, platform, and infrastructure.', headcount: 412, headId: 'o-priya', locationIds: ['loc-in', 'loc-sg', 'loc-us'], risk: 58 },
  { id: 'dep-it', name: 'IT', description: 'Corporate IT, identity operations, and service management.', headcount: 148, headId: 'o-marcus', locationIds: ['loc-in', 'loc-us'], risk: 61 },
  { id: 'dep-security', name: 'Security', description: 'Security operations, governance, and incident response.', headcount: 64, headId: 'o-catherine', locationIds: ['loc-us', 'loc-uk'], risk: 55 },
  { id: 'dep-sales', name: 'Sales', description: 'Direct sales, partnerships, and revenue operations.', headcount: 240, headId: 'o-henry', locationIds: ['loc-us', 'loc-uk', 'loc-sg'], risk: 34 },
  { id: 'dep-people', name: 'People', description: 'HR operations, talent, and workforce records.', headcount: 58, headId: 'o-emily', locationIds: ['loc-in', 'loc-us'], risk: 27 },
  { id: 'dep-compliance', name: 'Compliance', description: 'Regulatory compliance, audit, and control testing.', headcount: 34, headId: 'o-olivia', locationIds: ['loc-de', 'loc-uk'], risk: 30 },
  { id: 'dep-data', name: 'Data', description: 'Data platform, analytics engineering, and reporting.', headcount: 96, headId: 'o-nathan', locationIds: ['loc-in', 'loc-sg'], risk: 49 },
  { id: 'dep-support', name: 'Customer Support', description: 'Customer service, escalations, and technical support.', headcount: 204, headId: 'o-grace', locationIds: ['loc-in', 'loc-jp'], risk: 22 },
  { id: 'dep-product', name: 'Product', description: 'Product management, design, and research.', headcount: 72, headId: 'o-sofia', locationIds: ['loc-us', 'loc-sg'], risk: 18 },
];

/** `userIdentities[].department` (free text) → department id. */
export const DEPARTMENT_BY_NAME: Record<string, string> = {
  Finance: 'dep-finance',
  Engineering: 'dep-engineering',
  IT: 'dep-it',
  Security: 'dep-security',
  Sales: 'dep-sales',
  People: 'dep-people',
  Compliance: 'dep-compliance',
  Data: 'dep-data',
  'Customer Support': 'dep-support',
  Product: 'dep-product',
};

/** Where each person sits. Assigned, not derived — a person has one home site. */
export const PERSON_LOCATION: Record<string, string> = {
  'o-liam': 'loc-us',
  'o-marcus': 'loc-in',
  'o-frank': 'loc-in',
  'o-priya': 'loc-in',
  'o-bob': 'loc-us',
  'o-nathan': 'loc-sg',
  'o-catherine': 'loc-uk',
  'o-hana': 'loc-de',
  'o-henry': 'loc-us',
  'o-grace': 'loc-jp',
  'o-emily': 'loc-us',
  'o-olivia': 'loc-de',
  'o-sofia': 'loc-sg',
  'o-daniel': 'loc-uk',
};

/* ------------------------------------------------------------------ *
 * Governance scope of the access catalog
 * ------------------------------------------------------------------ */

export interface AppGovernance {
  departmentIds: string[];
  locationIds: string[];
  /** Governance risk of the application, not the peak risk of its entitlements. */
  risk: number;
  /** Accountable for certifying access. Empty = the access-review ownership gap. */
  reviewOwnerIds: string[];
  approvalOwnerIds: string[];
  governanceRoleIds: string[];
  /** People with an account in the app — used for impact statements. */
  userCount: number;
}

export const applicationGovernance: Record<string, AppGovernance> = {
  // GAP: no owner (seed.ts) and no review owner — SAP is the seeded ownership gap.
  'app-sap': { departmentIds: ['dep-finance', 'dep-compliance'], locationIds: ['loc-in', 'loc-de', 'loc-us'], risk: 74, reviewOwnerIds: [], approvalOwnerIds: ['o-hana'], governanceRoleIds: ['gr-security-governance', 'gr-compliance-auditor'], userCount: 124 },
  'app-salesforce': { departmentIds: ['dep-sales', 'dep-finance', 'dep-support'], locationIds: ['loc-us', 'loc-uk', 'loc-sg', 'loc-in'], risk: 46, reviewOwnerIds: ['o-olivia'], approvalOwnerIds: ['o-henry'], governanceRoleIds: ['gr-app-owner'], userCount: 318 },
  'app-workday': { departmentIds: ['dep-people', 'dep-finance'], locationIds: ['loc-in', 'loc-us', 'loc-uk'], risk: 22, reviewOwnerIds: ['o-olivia'], approvalOwnerIds: ['o-emily'], governanceRoleIds: ['gr-app-owner', 'gr-compliance-auditor'], userCount: 2140 },
  'app-okta': { departmentIds: ['dep-it', 'dep-security'], locationIds: ['loc-in', 'loc-sg', 'loc-de', 'loc-us', 'loc-uk', 'loc-jp'], risk: 68, reviewOwnerIds: ['o-catherine'], approvalOwnerIds: ['o-marcus'], governanceRoleIds: ['gr-security-governance'], userCount: 2140 },
  'app-github': { departmentIds: ['dep-engineering', 'dep-product'], locationIds: ['loc-in', 'loc-sg', 'loc-us'], risk: 41, reviewOwnerIds: ['o-catherine'], approvalOwnerIds: ['o-priya'], governanceRoleIds: ['gr-app-owner'], userCount: 386 },
  'app-aws': { departmentIds: ['dep-engineering', 'dep-it', 'dep-data'], locationIds: ['loc-in', 'loc-sg', 'loc-us'], risk: 78, reviewOwnerIds: ['o-catherine'], approvalOwnerIds: ['o-marcus'], governanceRoleIds: ['gr-security-governance'], userCount: 142 },
  // GAP: the application owner is also its access review owner — self-review.
  // GAP: no birthright and no approval policy references it — uncontrolled.
  'app-servicenow': { departmentIds: ['dep-it', 'dep-support'], locationIds: ['loc-in', 'loc-us', 'loc-jp'], risk: 52, reviewOwnerIds: ['o-henry'], approvalOwnerIds: ['o-henry'], governanceRoleIds: ['gr-app-owner'], userCount: 268 },
  // GAP: no review owner.
  'app-snowflake': { departmentIds: ['dep-data', 'dep-finance'], locationIds: ['loc-in', 'loc-sg', 'loc-us'], risk: 71, reviewOwnerIds: [], approvalOwnerIds: ['o-nathan'], governanceRoleIds: ['gr-security-governance'], userCount: 88 },
  'app-netsuite': { departmentIds: ['dep-finance'], locationIds: ['loc-de', 'loc-us'], risk: 38, reviewOwnerIds: ['o-olivia'], approvalOwnerIds: ['o-hana'], governanceRoleIds: ['gr-app-owner', 'gr-compliance-auditor'], userCount: 64 },
  // GAP: no review owner.
  'app-jira': { departmentIds: ['dep-engineering', 'dep-product', 'dep-support'], locationIds: ['loc-in', 'loc-sg', 'loc-us', 'loc-jp'], risk: 19, reviewOwnerIds: [], approvalOwnerIds: ['o-sofia'], governanceRoleIds: ['gr-app-owner'], userCount: 704 },
};

/** Organizational scope of each role. Roles are how access reaches the org chart. */
export const roleScope: Record<string, { departmentIds: string[]; locationIds: string[]; userCount: number }> = {
  'br-finance': { departmentIds: ['dep-finance'], locationIds: ['loc-in', 'loc-de', 'loc-us'], userCount: 184 },
  'br-controller': { departmentIds: ['dep-finance'], locationIds: ['loc-de', 'loc-us'], userCount: 12 },
  'br-sales-rep': { departmentIds: ['dep-sales'], locationIds: ['loc-us', 'loc-uk', 'loc-sg'], userCount: 226 },
  'br-support': { departmentIds: ['dep-support'], locationIds: ['loc-in', 'loc-jp'], userCount: 198 },
  'br-hr-generalist': { departmentIds: ['dep-people'], locationIds: ['loc-in', 'loc-us'], userCount: 44 },
  'br-security-analyst': { departmentIds: ['dep-security'], locationIds: ['loc-us', 'loc-uk'], userCount: 28 },
  'br-cloud-engineer': { departmentIds: ['dep-engineering'], locationIds: ['loc-in', 'loc-sg', 'loc-us'], userCount: 96 },
  'br-service-desk': { departmentIds: ['dep-it', 'dep-support'], locationIds: ['loc-in', 'loc-jp'], userCount: 74 },
  'tr-eng-baseline': { departmentIds: ['dep-engineering'], locationIds: ['loc-in', 'loc-sg', 'loc-us'], userCount: 388 },
  'tr-devops': { departmentIds: ['dep-engineering', 'dep-it'], locationIds: ['loc-in', 'loc-sg', 'loc-us'], userCount: 62 },
  'tr-data': { departmentIds: ['dep-data'], locationIds: ['loc-in', 'loc-sg'], userCount: 84 },
  'tr-sap-fin': { departmentIds: ['dep-finance'], locationIds: ['loc-in', 'loc-de', 'loc-us'], userCount: 46 },
  'tr-workday-hr': { departmentIds: ['dep-people'], locationIds: ['loc-in', 'loc-us'], userCount: 18 },
  'tr-sf-admin': { departmentIds: ['dep-sales', 'dep-it'], locationIds: ['loc-us'], userCount: 9 },
  'tr-itsm': { departmentIds: ['dep-it', 'dep-support'], locationIds: ['loc-in', 'loc-jp'], userCount: 132 },
  'tr-analytics': { departmentIds: ['dep-data'], locationIds: ['loc-in', 'loc-sg'], userCount: 41 },
};

/* ------------------------------------------------------------------ *
 * Governance controls
 * ------------------------------------------------------------------ */

export interface SeedBirthrightPolicy {
  id: string;
  name: string;
  description: string;
  status: GovStatus;
  /** Empty = the policy-ownership gap. */
  ownerIds: string[];
  /** Empty department + location = organization-wide. */
  departmentIds: string[];
  locationIds: string[];
  grantsEntitlementIds: string[];
  risk: number;
  usersCovered: number;
  updatedAt: string;
  updatedBy: string;
}

export const govBirthrightPolicies: SeedBirthrightPolicy[] = [
  { id: 'bp-all-employees', name: 'All Employees — Baseline Access', description: 'Day-one access every worker receives on joining, regardless of department.', status: 'active', ownerIds: ['o-emily'], departmentIds: [], locationIds: [], grantsEntitlementIds: ['ent-okta-user', 'ent-wday-ess'], risk: 16, usersCovered: 2140, updatedAt: '2026-05-18', updatedBy: 'o-emily' },
  { id: 'bp-engineering', name: 'Engineering Joiner Birthright', description: 'Source control and work tracking granted automatically to engineering joiners.', status: 'active', ownerIds: ['o-priya'], departmentIds: ['dep-engineering'], locationIds: ['loc-in', 'loc-sg', 'loc-us'], grantsEntitlementIds: ['ent-gh-write', 'ent-jira-contrib'], risk: 34, usersCovered: 412, updatedAt: '2026-06-02', updatedBy: 'o-priya' },
  { id: 'bp-finance', name: 'Finance Department Birthright', description: 'Read-only finance reporting granted on assignment to a finance cost centre.', status: 'active', ownerIds: ['o-hana'], departmentIds: ['dep-finance'], locationIds: ['loc-in', 'loc-de', 'loc-us'], grantsEntitlementIds: ['ent-sap-report', 'ent-ns-viewer'], risk: 48, usersCovered: 186, updatedAt: '2026-04-27', updatedBy: 'o-hana' },
  { id: 'bp-sales', name: 'Sales Onboarding Birthright', description: 'CRM access provisioned when a seller is assigned to a territory.', status: 'active', ownerIds: ['o-henry'], departmentIds: ['dep-sales'], locationIds: ['loc-us', 'loc-uk', 'loc-sg'], grantsEntitlementIds: ['ent-sf-sales'], risk: 29, usersCovered: 240, updatedAt: '2026-03-11', updatedBy: 'o-henry' },
  // GAP: no policy owner — nobody is accountable for a rule that provisions 96 contractors.
  { id: 'bp-contractor-in', name: 'Contractor Baseline — India', description: 'Minimum access for contractors onboarded through the Pune delivery centre.', status: 'active', ownerIds: [], departmentIds: [], locationIds: ['loc-in'], grantsEntitlementIds: ['ent-okta-user', 'ent-jira-contrib'], risk: 57, usersCovered: 96, updatedAt: '2025-11-30', updatedBy: 'o-marcus' },
  // GAP: attached to no department, location, or entitlement — an orphaned policy.
  { id: 'bp-exec', name: 'Executive Access Birthright', description: 'Drafted for the executive population; never attached to a scope or an entitlement.', status: 'draft', ownerIds: ['o-olivia'], departmentIds: [], locationIds: [], grantsEntitlementIds: [], risk: 42, usersCovered: 0, updatedAt: '2026-01-19', updatedBy: 'o-olivia' },
];

export interface ApprovalPolicyGovernance {
  ownerIds: string[];
  /** Access this policy decides requests for. */
  applicationIds: string[];
  workflowId: string;
  hierarchyId: string;
  risk: number;
  requestsPerQuarter: number;
  updatedBy: string;
}

/**
 * Governance metadata for the approval policies. Names and status come from
 * `approvalPolicySeed` in `seed.ts` — keyed by the same ids so there is one source
 * of truth for what a policy *is*, and this table only says how it is governed.
 */
export const approvalPolicyGovernance: Record<string, ApprovalPolicyGovernance> = {
  'ap-joiner-access': { ownerIds: ['o-emily'], applicationIds: ['app-okta', 'app-workday'], workflowId: 'wf-access-request', hierarchyId: 'ah-joiner', risk: 24, requestsPerQuarter: 1284, updatedBy: 'o-emily' },
  'ap-privileged': { ownerIds: ['o-catherine'], applicationIds: ['app-aws', 'app-okta', 'app-snowflake'], workflowId: 'wf-privileged-grant', hierarchyId: 'ah-privileged', risk: 76, requestsPerQuarter: 214, updatedBy: 'o-catherine' },
  'ap-finance-apps': { ownerIds: ['o-hana'], applicationIds: ['app-sap', 'app-netsuite'], workflowId: 'wf-access-request', hierarchyId: 'ah-finance', risk: 68, requestsPerQuarter: 342, updatedBy: 'o-hana' },
  'ap-contractor': { ownerIds: ['o-henry'], applicationIds: ['app-jira'], workflowId: 'wf-contractor-onboarding', hierarchyId: 'ah-contractor', risk: 51, requestsPerQuarter: 88, updatedBy: 'o-henry' },
  'ap-saas-selfserve': { ownerIds: ['o-sofia'], applicationIds: ['app-jira', 'app-github'], workflowId: 'wf-access-request', hierarchyId: 'ah-selfserve', risk: 18, requestsPerQuarter: 906, updatedBy: 'o-sofia' },
  'ap-emergency': { ownerIds: ['o-marcus'], applicationIds: ['app-aws', 'app-okta', 'app-sap'], workflowId: 'wf-breakglass', hierarchyId: 'ah-emergency', risk: 82, requestsPerQuarter: 37, updatedBy: 'o-marcus' },
};

export interface SeedApprovalWorkflow {
  id: string;
  name: string;
  description: string;
  status: GovStatus;
  ownerIds: string[];
  steps: number;
  runsPerQuarter: number;
  risk: number;
  updatedAt: string;
  updatedBy: string;
}

export const govApprovalWorkflows: SeedApprovalWorkflow[] = [
  { id: 'wf-access-request', name: 'Access Request Fulfilment', description: 'Routes an approved request through provisioning and confirms the grant.', status: 'active', ownerIds: ['o-marcus'], steps: 6, runsPerQuarter: 3420, risk: 22, updatedAt: '2026-06-21', updatedBy: 'o-marcus' },
  { id: 'wf-privileged-grant', name: 'Privileged Access Grant', description: 'Time-bounds and records every privileged grant, with mandatory security review.', status: 'active', ownerIds: ['o-catherine'], steps: 9, runsPerQuarter: 214, risk: 64, updatedAt: '2026-07-04', updatedBy: 'o-catherine' },
  { id: 'wf-contractor-onboarding', name: 'Contractor Onboarding', description: 'Provisions time-boxed contractor access with a mandatory sponsor.', status: 'draft', ownerIds: ['o-henry'], steps: 7, runsPerQuarter: 0, risk: 44, updatedAt: '2026-05-09', updatedBy: 'o-henry' },
  { id: 'wf-breakglass', name: 'Emergency Break-Glass', description: 'Grants emergency access immediately and opens a retrospective review.', status: 'active', ownerIds: ['o-marcus'], steps: 4, runsPerQuarter: 37, risk: 79, updatedAt: '2026-06-02', updatedBy: 'o-marcus' },
  { id: 'wf-leaver-revoke', name: 'Leaver Access Revocation', description: 'Revokes every account and entitlement when an identity is terminated.', status: 'active', ownerIds: ['o-emily'], steps: 8, runsPerQuarter: 268, risk: 36, updatedAt: '2026-07-15', updatedBy: 'o-emily' },
];

export interface SodPolicyGovernance {
  ownerIds: string[];
  governanceRoleIds: string[];
  applicationIds: string[];
  businessRoleIds: string[];
  technicalRoleIds: string[];
  departmentIds: string[];
  locationIds: string[];
  risk: number;
  openViolations: number;
  usersAffected: number;
  updatedAt: string;
}

/**
 * Governance metadata for the SoD policies. Name, severity and description stay in
 * `sod-seed.ts`; this table maps each policy onto the canonical Directory
 * applications and roles it constrains.
 */
export const sodPolicyGovernance: Record<string, SodPolicyGovernance> = {
  'pol-fin': { ownerIds: ['o-olivia'], governanceRoleIds: ['gr-security-governance', 'gr-compliance-auditor'], applicationIds: ['app-sap', 'app-netsuite'], businessRoleIds: ['br-finance', 'br-controller'], technicalRoleIds: ['tr-sap-fin'], departmentIds: ['dep-finance', 'dep-compliance'], locationIds: ['loc-in', 'loc-de', 'loc-us'], risk: 88, openViolations: 12, usersAffected: 27, updatedAt: '2026-07-28' },
  'pol-acc': { ownerIds: ['o-catherine'], governanceRoleIds: ['gr-security-governance'], applicationIds: ['app-okta'], businessRoleIds: ['br-security-analyst'], technicalRoleIds: ['tr-devops'], departmentIds: ['dep-it', 'dep-security'], locationIds: ['loc-in', 'loc-us'], risk: 66, openViolations: 5, usersAffected: 14, updatedAt: '2026-06-30' },
  'pol-priv': { ownerIds: ['o-catherine'], governanceRoleIds: ['gr-security-governance'], applicationIds: ['app-aws', 'app-okta', 'app-snowflake'], businessRoleIds: ['br-cloud-engineer'], technicalRoleIds: ['tr-devops', 'tr-analytics'], departmentIds: ['dep-engineering', 'dep-it', 'dep-data'], locationIds: ['loc-in', 'loc-sg', 'loc-us'], risk: 72, openViolations: 8, usersAffected: 19, updatedAt: '2026-07-12' },
  'pol-data': { ownerIds: ['o-nathan'], governanceRoleIds: ['gr-compliance-auditor'], applicationIds: ['app-snowflake', 'app-salesforce'], businessRoleIds: ['br-finance'], technicalRoleIds: ['tr-data', 'tr-analytics'], departmentIds: ['dep-data', 'dep-sales'], locationIds: ['loc-in', 'loc-sg'], risk: 44, openViolations: 3, usersAffected: 9, updatedAt: '2026-05-22' },
};

/* ------------------------------------------------------------------ *
 * Governance responsibility
 * ------------------------------------------------------------------ */

export interface SeedGovernanceRole {
  id: string;
  name: string;
  description: string;
  /** The Governance Group that staffs this role (see `governanceGroups` in seed.ts). */
  governanceGroupId: string;
  /** What holders of the role are accountable for. */
  responsibilities: string[];
  risk: number;
}

export const govGovernanceRoles: SeedGovernanceRole[] = [
  { id: 'gr-app-owner', name: 'Application Owner', description: 'Accountable for an application: its configuration, its access model, and its risk.', governanceGroupId: 'gg-app-owners', responsibilities: ['Approve access requests', 'Maintain the entitlement catalog', 'Attest to application risk'], risk: 42 },
  { id: 'gr-review-owner', name: 'Access Review Owner', description: 'Accountable for certifying who should keep access at each review cycle.', governanceGroupId: 'gg-compliance', responsibilities: ['Run access certifications', 'Decide revocations', 'Sign off review evidence'], risk: 38 },
  { id: 'gr-policy-owner', name: 'Policy Owner', description: 'Accountable for a governance policy staying correct and in force.', governanceGroupId: 'gg-compliance', responsibilities: ['Maintain policy rules', 'Approve exceptions', 'Review policy effectiveness'], risk: 34 },
  { id: 'gr-approval-owner', name: 'Approval Owner', description: 'Accountable for the approval route a request travels and the people on it.', governanceGroupId: 'gg-finance', responsibilities: ['Maintain approval hierarchies', 'Keep approvers current', 'Resolve stalled approvals'], risk: 46 },
  { id: 'gr-security-governance', name: 'Security Governance', description: 'Final authority on privileged access and separation-of-duties enforcement.', governanceGroupId: 'gg-secops', responsibilities: ['Approve privileged access', 'Enforce SoD policy', 'Own break-glass procedure'], risk: 71 },
  { id: 'gr-compliance-auditor', name: 'Compliance Auditor', description: 'Independent assurance that governance controls operate as documented.', governanceGroupId: 'gg-compliance', responsibilities: ['Test control operation', 'Evidence regulatory audits', 'Report control failures'], risk: 28 },
];

/**
 * Approval hierarchies — one per approval policy. These are what "who approves
 * requests?" resolves to, and where a broken chain becomes visible: a level whose
 * `approverId` is `null` cannot be routed to.
 */
export const govApprovalHierarchies: GovApprovalHierarchy[] = [
  {
    id: 'ah-joiner',
    policyId: 'ap-joiner-access',
    name: 'Joiner Access — 2 levels',
    levels: [
      { level: 1, approverType: 'manager', approverId: 'o-priya', approverLabel: 'Line Manager', slaHours: 24, fallbackApproverId: 'o-emily', delegationId: null, escalationRuleId: 'esc-standard' },
      { level: 2, approverType: 'applicationOwner', approverId: 'o-henry', approverLabel: 'Application Owner', slaHours: 48, fallbackApproverId: 'o-marcus', delegationId: 'del-1', escalationRuleId: 'esc-standard' },
    ],
  },
  {
    id: 'ah-privileged',
    policyId: 'ap-privileged',
    name: 'Privileged Access — 4 levels',
    levels: [
      { level: 1, approverType: 'manager', approverId: 'o-priya', approverLabel: 'Line Manager', slaHours: 12, fallbackApproverId: 'o-frank', delegationId: null, escalationRuleId: 'esc-privileged' },
      { level: 2, approverType: 'departmentHead', approverId: 'o-marcus', approverLabel: 'Department Head', slaHours: 24, fallbackApproverId: 'o-henry', delegationId: 'del-2', escalationRuleId: 'esc-privileged' },
      { level: 3, approverType: 'applicationOwner', approverId: 'o-liam', approverLabel: 'Application Owner', slaHours: 24, fallbackApproverId: 'o-marcus', delegationId: null, escalationRuleId: 'esc-privileged' },
      { level: 4, approverType: 'governanceRole', approverId: 'gr-security-governance', approverLabel: 'Security Governance', slaHours: 48, fallbackApproverId: 'o-catherine', delegationId: null, escalationRuleId: 'esc-privileged' },
    ],
  },
  {
    id: 'ah-finance',
    policyId: 'ap-finance-apps',
    name: 'Finance Applications — 4 levels',
    levels: [
      { level: 1, approverType: 'manager', approverId: 'o-hana', approverLabel: 'Line Manager', slaHours: 24, fallbackApproverId: 'o-bob', delegationId: null, escalationRuleId: 'esc-finance' },
      { level: 2, approverType: 'governanceRole', approverId: 'gr-approval-owner', approverLabel: 'Finance Approver', slaHours: 24, fallbackApproverId: 'o-bob', delegationId: 'del-3', escalationRuleId: 'esc-finance' },
      // GAP: SAP has no application owner, so level 3 cannot be routed to.
      { level: 3, approverType: 'applicationOwner', approverId: null, approverLabel: 'Application Owner — SAP S/4HANA Finance', slaHours: 48, fallbackApproverId: null, delegationId: null, escalationRuleId: 'esc-finance' },
      { level: 4, approverType: 'governanceRole', approverId: 'gr-compliance-auditor', approverLabel: 'Compliance Auditor', slaHours: 72, fallbackApproverId: 'o-olivia', delegationId: null, escalationRuleId: 'esc-finance' },
    ],
  },
  {
    id: 'ah-contractor',
    policyId: 'ap-contractor',
    name: 'Contractor Onboarding — 2 levels',
    levels: [
      { level: 1, approverType: 'manager', approverId: 'o-henry', approverLabel: 'Sponsoring Manager', slaHours: 48, fallbackApproverId: 'o-sofia', delegationId: null, escalationRuleId: null },
      // GAP: no escalation rule on either level — a stalled request waits forever.
      { level: 2, approverType: 'user', approverId: 'o-sofia', approverLabel: 'Delivery Sponsor', slaHours: 48, fallbackApproverId: null, delegationId: null, escalationRuleId: null },
    ],
  },
  {
    id: 'ah-selfserve',
    policyId: 'ap-saas-selfserve',
    name: 'SaaS Self-Service — 1 level',
    levels: [
      { level: 1, approverType: 'manager', approverId: 'o-sofia', approverLabel: 'Line Manager', slaHours: 24, fallbackApproverId: 'o-priya', delegationId: null, escalationRuleId: 'esc-standard' },
    ],
  },
  {
    id: 'ah-emergency',
    policyId: 'ap-emergency',
    name: 'Emergency Break-Glass — 1 level',
    levels: [
      { level: 1, approverType: 'governanceRole', approverId: 'gr-security-governance', approverLabel: 'Security Governance', slaHours: 4, fallbackApproverId: 'o-catherine', delegationId: null, escalationRuleId: 'esc-emergency' },
    ],
  },
];

export const govDelegations: GovDelegation[] = [
  { id: 'del-1', fromId: 'o-henry', toId: 'o-grace', scope: 'Salesforce access requests', validUntil: '2026-08-20', status: 'active' },
  // GAP: no end date — delegated authority that never returns to its owner.
  { id: 'del-2', fromId: 'o-marcus', toId: 'o-catherine', scope: 'Privileged access approvals', validUntil: null, status: 'active' },
  // GAP: lapsed before AS_OF, but still referenced by the finance approval chain.
  { id: 'del-3', fromId: 'o-hana', toId: 'o-bob', scope: 'Finance application approvals', validUntil: '2026-07-14', status: 'expired' },
  { id: 'del-4', fromId: 'o-priya', toId: 'o-frank', scope: 'GitHub organization approvals', validUntil: '2026-09-30', status: 'active' },
  { id: 'del-5', fromId: 'o-emily', toId: 'o-olivia', scope: 'Workday HR approvals', validUntil: '2026-12-31', status: 'active' },
];

export const govEscalationRules: GovEscalationRule[] = [
  {
    id: 'esc-standard',
    name: 'Standard Escalation',
    terminalAction: 'hold',
    levels: [
      { level: 1, approverId: 'o-priya', approverLabel: 'Line Manager', afterHours: 24 },
      { level: 2, approverId: 'o-henry', approverLabel: 'Application Owner', afterHours: 48 },
      { level: 3, approverId: 'gr-security-governance', approverLabel: 'Security Governance', afterHours: 72 },
    ],
  },
  {
    id: 'esc-privileged',
    name: 'Privileged Escalation',
    terminalAction: 'auto-reject',
    levels: [
      { level: 1, approverId: 'o-marcus', approverLabel: 'Application Owner', afterHours: 12 },
      { level: 2, approverId: 'gr-security-governance', approverLabel: 'Security Governance', afterHours: 24 },
    ],
  },
  {
    id: 'esc-finance',
    name: 'Finance Escalation',
    terminalAction: 'none',
    levels: [
      { level: 1, approverId: 'o-hana', approverLabel: 'Finance Approver', afterHours: 24 },
      // GAP: level 2 has no assignee and the rule has no terminal action.
      { level: 2, approverId: null, approverLabel: 'Department Head — unassigned', afterHours: 48 },
    ],
  },
  {
    id: 'esc-emergency',
    name: 'Break-Glass Escalation',
    terminalAction: 'auto-reject',
    levels: [{ level: 1, approverId: 'gr-security-governance', approverLabel: 'Security Governance', afterHours: 4 }],
  },
  {
    id: 'esc-review',
    name: 'Review Escalation',
    terminalAction: 'hold',
    levels: [
      { level: 1, approverId: 'o-olivia', approverLabel: 'Access Review Owner', afterHours: 72 },
      { level: 2, approverId: 'gr-compliance-auditor', approverLabel: 'Compliance Auditor', afterHours: 120 },
    ],
  },
];
