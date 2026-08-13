/**
 * Seed data — the prototype's single, deterministic source of runtime data.
 *
 * Per the Product Knowledge Base sample-data strategy: one coherent fictional
 * organisation, deterministic (no Date.now()/Math.random() at module scope), and
 * sized to exercise real UI. Screens never read this directly — they go through
 * the service functions (e.g. `data/dashboard.ts`), which mirror the future
 * repository/API layer so a real backend can be swapped in without UI changes.
 */

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type Tone = 'brand' | 'info' | 'success' | 'warning' | 'danger' | 'neutral';

/** Org-wide counts surfaced as dashboard KPIs. */
export const orgStats = {
  applications: 234,
  identities: 3413,
  entitlements: 34123,
  orphanAccounts: 32,
};

export interface SeedIdentity {
  id: string;
  name: string;
  title: string;
  app: string;
  riskLevel: RiskLevel;
  riskScore: number;
}

export const identities: SeedIdentity[] = [
  { id: 'u-scott', name: 'Scott William', title: 'SDE 1', app: 'WordPress', riskLevel: 'critical', riskScore: 94 },
  { id: 'u-jessica', name: 'Jessica Liu', title: 'UX Designer', app: 'Figma', riskLevel: 'critical', riskScore: 88 },
  { id: 'u-mohammed', name: 'Mohammed Ali', title: 'Product Manager', app: 'Trello', riskLevel: 'critical', riskScore: 81 },
  { id: 'u-ananya', name: 'Ananya Patel', title: 'Data Scientist', app: 'Python', riskLevel: 'high', riskScore: 68 },
  { id: 'u-bob', name: 'Bob Smith', title: 'Finance Analyst', app: 'NetSuite', riskLevel: 'high', riskScore: 63 },
  { id: 'u-grace', name: 'Grace Lee', title: 'Support Lead', app: 'Zendesk', riskLevel: 'medium', riskScore: 41 },
  { id: 'u-emily', name: 'Emily Davis', title: 'HR Manager', app: 'Workday', riskLevel: 'medium', riskScore: 35 },
  { id: 'u-daniel', name: 'Daniel White', title: 'Sales Rep', app: 'Salesforce', riskLevel: 'low', riskScore: 18 },
];

export type CertDue = { tone: Extract<Tone, 'danger' | 'warning'>; label: string } | { date: string };
export interface SeedCertCampaign {
  id: string;
  name: string;
  scope: string;
  due: CertDue;
}

export const certificationCampaigns: SeedCertCampaign[] = [
  { id: 'c-fin', name: 'Quarterly Finance Review', scope: 'Financial data', due: { tone: 'danger', label: 'Expiring in 4 hrs' } },
  { id: 'c-eng', name: 'Yearly Engineering Review', scope: 'Engineering access', due: { tone: 'warning', label: 'Expiring tomorrow' } },
  { id: 'c-design', name: 'Quarterly Design Review', scope: 'Design team access', due: { date: '24 Oct 2026' } },
  { id: 'c-legal', name: 'Legal Review', scope: 'Legal team access', due: { date: '24 Oct 2026' } },
];

/** Access-certification status breakdown (donut). */
export const certificationStatus = { completed: 1180, inProgress: 520, readyToLaunch: 460, others: 240 };

/** SoD policy state breakdown (donut). */
export const sodPolicyStatus = { active: 86, draft: 20, violations: 12 };

export interface SeedSodPolicy {
  id: string;
  name: string;
  area: string;
  count: number;
}

export const highRiskSodPolicies: SeedSodPolicy[] = [
  { id: 's-grafana', name: 'Grafana Write + Delete', area: 'Observability access', count: 23 },
  { id: 's-bitbucket', name: 'BitBucket Write + Delete', area: 'Source control', count: 19 },
  { id: 's-aws', name: 'AWS Admin + Billing', area: 'Cloud infrastructure', count: 14 },
];

/** The current user's pending work — drives dashboard + nav badges. */
export const myWork = { approvals: 7, reviews: 12, requests: 3, reviewRequests: 6 };

/* ------------------------------------------------------------------ *
 * Emergency Access module
 * ------------------------------------------------------------------ */
export type EAStatus = 'draft' | 'active';

export interface SeedEmergencyAccess {
  id: string;
  name: string;
  initial: string;
  description: string;
  status: EAStatus;
  riskLevel?: RiskLevel;
  riskScore?: number;
  activeUsers?: number;
  maxDurationHrs: number;
  maxConcurrent: number;
  maxRequestsPerDay: number;
  cooldownHrs: number;
  createdOn: string;
  updatedOn: string;
}

export const emergencyAccessList: SeedEmergencyAccess[] = [
  { id: 'ea-bitbucket-prod', name: 'Bitbucket Production Env', initial: 'B', description: 'Break-glass access to the Bitbucket production environment.', status: 'draft', maxDurationHrs: 24, maxConcurrent: 24, maxRequestsPerDay: 5, cooldownHrs: 2, createdOn: 'April 20, 2026', updatedOn: 'April 20, 2026' },
  { id: 'ea-github-staging', name: 'GitHub Staging Env', initial: 'G', description: 'Emergency access to GitHub staging.', status: 'active', riskLevel: 'critical', riskScore: 94, activeUsers: 48, maxDurationHrs: 24, maxConcurrent: 24, maxRequestsPerDay: 5, cooldownHrs: 2, createdOn: 'April 18, 2026', updatedOn: 'April 20, 2026' },
  { id: 'ea-docker-local', name: 'Docker Localhost Setup', initial: 'D', description: 'Local Docker break-glass configuration.', status: 'draft', maxDurationHrs: 12, maxConcurrent: 10, maxRequestsPerDay: 3, cooldownHrs: 1, createdOn: 'April 19, 2026', updatedOn: 'April 19, 2026' },
  { id: 'ea-azure-dev', name: 'Azure Dev Environment', initial: 'A', description: 'Emergency access to the Azure development subscription.', status: 'active', riskLevel: 'critical', riskScore: 91, activeUsers: 60, maxDurationHrs: 24, maxConcurrent: 24, maxRequestsPerDay: 5, cooldownHrs: 2, createdOn: 'April 15, 2026', updatedOn: 'April 20, 2026' },
  { id: 'ea-gitlab-test', name: 'GitLab Testing Env', initial: 'G', description: 'Break-glass access to GitLab testing.', status: 'active', riskLevel: 'high', riskScore: 74, activeUsers: 36, maxDurationHrs: 24, maxConcurrent: 20, maxRequestsPerDay: 5, cooldownHrs: 2, createdOn: 'April 14, 2026', updatedOn: 'April 20, 2026' },
  { id: 'ea-aws-qa', name: 'AWS QA Environment', initial: 'A', description: 'Emergency access to the AWS QA account.', status: 'active', riskLevel: 'high', riskScore: 66, activeUsers: 24, maxDurationHrs: 24, maxConcurrent: 20, maxRequestsPerDay: 5, cooldownHrs: 2, createdOn: 'April 12, 2026', updatedOn: 'April 20, 2026' },
  { id: 'ea-salesforce', name: 'Emergency Access Salesforce', initial: 'A', description: 'Emergency access for salesforce', status: 'active', riskLevel: 'critical', riskScore: 94, activeUsers: 24, maxDurationHrs: 24, maxConcurrent: 24, maxRequestsPerDay: 5, cooldownHrs: 2, createdOn: 'April 20, 2026', updatedOn: 'April 20, 2026' },
  { id: 'ea-bitbucket-prod-2', name: 'Bitbucket Production Env', initial: 'B', description: 'Secondary break-glass access to Bitbucket production.', status: 'active', riskLevel: 'medium', riskScore: 48, activeUsers: 12, maxDurationHrs: 24, maxConcurrent: 24, maxRequestsPerDay: 5, cooldownHrs: 2, createdOn: 'April 10, 2026', updatedOn: 'April 20, 2026' },
];

/** Sessions shown on an emergency-access detail (reference seed identities). */
export interface SeedEASession {
  identityId: string;
  ongoing: boolean;
  when: string;
}
export const emergencySessions: SeedEASession[] = [
  { identityId: 'u-scott', ongoing: true, when: 'Ongoing · Ends in 4 hrs' },
  { identityId: 'u-jessica', ongoing: false, when: 'Ended Aug 16, 2026 12:09 PM' },
  { identityId: 'u-mohammed', ongoing: false, when: 'Ended Aug 16, 2026 12:09 PM' },
  { identityId: 'u-ananya', ongoing: false, when: 'Ended Aug 16, 2026 12:09 PM' },
];
export const emergencySessionsTotal = 24;

/* ------------------------------------------------------------------ *
 * Directory — canonical domain entities (User Identity is the primary
 * representation of a person; App Accounts link identities to applications).
 * ------------------------------------------------------------------ */
export type IdentityStatus = 'active' | 'inactive' | 'leaver-pending' | 'terminated';

export interface SeedUserIdentity {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  department: string;
  status: IdentityStatus;
  riskLevel: RiskLevel;
  riskScore: number;
}

/** The canonical people directory. Owners/reviewers everywhere reference these. */
export const userIdentities: SeedUserIdentity[] = [
  { id: 'o-liam', name: 'Liam Turner', email: 'liam.turner@acme.com', jobTitle: 'Cloud Architect', department: 'Engineering', status: 'active', riskLevel: 'critical', riskScore: 82 },
  { id: 'o-marcus', name: 'Marcus Lee', email: 'marcus.lee@acme.com', jobTitle: 'IT Administrator', department: 'IT', status: 'active', riskLevel: 'critical', riskScore: 77 },
  { id: 'o-frank', name: 'Frank Wilson', email: 'frank.wilson@acme.com', jobTitle: 'DevOps Engineer', department: 'Engineering', status: 'active', riskLevel: 'high', riskScore: 71 },
  { id: 'o-priya', name: 'Priya Sharma', email: 'priya.sharma@acme.com', jobTitle: 'Engineering Manager', department: 'Engineering', status: 'active', riskLevel: 'high', riskScore: 66 },
  { id: 'o-bob', name: 'Bob Smith', email: 'bob.smith@acme.com', jobTitle: 'Finance Analyst', department: 'Finance', status: 'active', riskLevel: 'high', riskScore: 63 },
  { id: 'o-nathan', name: 'Nathan Green', email: 'nathan.green@acme.com', jobTitle: 'Data Engineer', department: 'Data', status: 'active', riskLevel: 'high', riskScore: 58 },
  { id: 'o-catherine', name: 'Catherine Brown', email: 'catherine.brown@acme.com', jobTitle: 'Security Analyst', department: 'Security', status: 'active', riskLevel: 'high', riskScore: 55 },
  { id: 'o-hana', name: 'Hana Kim', email: 'hana.kim@acme.com', jobTitle: 'Finance Manager', department: 'Finance', status: 'active', riskLevel: 'medium', riskScore: 49 },
  { id: 'o-henry', name: 'Henry Taylor', email: 'henry.taylor@acme.com', jobTitle: 'Application Owner', department: 'IT', status: 'active', riskLevel: 'medium', riskScore: 44 },
  { id: 'o-grace', name: 'Grace Lee', email: 'grace.lee@acme.com', jobTitle: 'Support Lead', department: 'Customer Support', status: 'active', riskLevel: 'medium', riskScore: 41 },
  { id: 'o-emily', name: 'Emily Davis', email: 'emily.davis@acme.com', jobTitle: 'HR Manager', department: 'People', status: 'active', riskLevel: 'medium', riskScore: 35 },
  { id: 'o-olivia', name: 'Olivia Martin', email: 'olivia.martin@acme.com', jobTitle: 'Compliance Officer', department: 'Compliance', status: 'active', riskLevel: 'medium', riskScore: 29 },
  { id: 'o-sofia', name: 'Sofia Rossi', email: 'sofia.rossi@acme.com', jobTitle: 'Product Manager', department: 'Product', status: 'active', riskLevel: 'low', riskScore: 24 },
  { id: 'o-daniel', name: 'Daniel White', email: 'daniel.white@acme.com', jobTitle: 'Sales Representative', department: 'Sales', status: 'active', riskLevel: 'low', riskScore: 18 },
];

/** Owners assignable to an emergency access — a projection of User Identities. */
export interface SeedEAOwner {
  id: string;
  name: string;
  email: string;
}
const toOwner = (u: SeedUserIdentity): SeedEAOwner => ({ id: u.id, name: u.name, email: u.email });
export const emergencyOwners: SeedEAOwner[] = userIdentities.slice(0, 8).map(toOwner);
export const emergencyGovernanceGroupsCount = 4;

/**
 * Approval Policy seed — used only to prime an empty localStorage store on first
 * visit (the service owns persistence). A handful of mixed Active/Draft rows.
 * Builder trees start empty; users author them in the builder (M3+).
 */
export const approvalPolicySeed: import('./automation-types').ApprovalPolicy[] = [
  { id: 'ap-joiner-access', policyName: 'Joiner Access Approval', description: 'Standard approval for new-joiner access requests.', status: 'active', root: [], createdAt: '2026-02-11T09:00:00.000Z', updatedAt: '2026-06-30T14:20:00.000Z' },
  { id: 'ap-privileged', policyName: 'Privileged Access Review', description: 'Multi-level approval for privileged entitlements.', status: 'active', root: [], createdAt: '2026-03-04T10:30:00.000Z', updatedAt: '2026-06-18T11:05:00.000Z' },
  { id: 'ap-finance-apps', policyName: 'Finance Applications', description: 'Approval routing for finance-system access.', status: 'active', root: [], createdAt: '2026-01-22T08:15:00.000Z', updatedAt: '2026-05-27T16:40:00.000Z' },
  { id: 'ap-contractor', policyName: 'Contractor Onboarding', description: 'Time-boxed approval flow for contractors.', status: 'draft', root: [], createdAt: '2026-05-09T13:00:00.000Z', updatedAt: '2026-05-09T13:00:00.000Z' },
  { id: 'ap-saas-selfserve', policyName: 'SaaS Self-Service', description: 'Lightweight approval for low-risk SaaS apps.', status: 'draft', root: [], createdAt: '2026-06-12T09:45:00.000Z', updatedAt: '2026-06-15T10:10:00.000Z' },
  { id: 'ap-emergency', policyName: 'Emergency Break-Glass', description: 'Expedited single-approver path for emergencies.', status: 'active', root: [], createdAt: '2026-04-01T07:20:00.000Z', updatedAt: '2026-06-02T09:00:00.000Z' },
];

/** Application + entitlement catalog — selectable in Assign Entities and the Directory.
    `ownerIds` reference User Identities (see `userIdentities`). */
/**
 * How each application is *connected*, as opposed to what it contains.
 *
 * Kept beside `catalogApps` rather than inside it: the catalog entry is about
 * access (entitlements, owners) and these are integration facts — how we found
 * the app, whether we are cleared to manage it, and whether we push changes back.
 * They also change on a different cadence, from the connector rather than from
 * governance.
 */
export type AppDiscoverySource = 'IAM' | 'Direct';
export type AppAuthorizationStatus = 'authorized' | 'pending';
export type AppExternalProvisioning = 'enabled' | 'disabled';
export type AppProvisioningType = 'manual' | 'auto';

export interface AppProfile {
  /**
   * The connector the instance was created from — Salesforce, Okta, AWS.
   *
   * Not a category (CRM, ERP): when the add-application flow lands, the user
   * picks a type from the application-type catalog and then types the *name* this
   * instance carries through IGA. Two Salesforce tenants therefore share one
   * type and differ by name. Every seeded app is currently named after its own
   * connector, so today the two columns read alike.
   */
  appType: string;
  discoverySource: AppDiscoverySource;
  authorizationStatus: AppAuthorizationStatus;
  externalProvisioning: AppExternalProvisioning;
  provisioningType: AppProvisioningType;
}

export const appProfiles: Record<string, AppProfile> = {
  'app-okta': { appType: 'Okta', discoverySource: 'Direct', authorizationStatus: 'authorized', externalProvisioning: 'enabled', provisioningType: 'auto' },
  'app-salesforce': { appType: 'Salesforce', discoverySource: 'IAM', authorizationStatus: 'authorized', externalProvisioning: 'enabled', provisioningType: 'auto' },
  'app-github': { appType: 'GitHub', discoverySource: 'IAM', authorizationStatus: 'authorized', externalProvisioning: 'enabled', provisioningType: 'manual' },
  'app-aws': { appType: 'AWS', discoverySource: 'Direct', authorizationStatus: 'authorized', externalProvisioning: 'enabled', provisioningType: 'auto' },
  'app-sap': { appType: 'SAP', discoverySource: 'Direct', authorizationStatus: 'pending', externalProvisioning: 'disabled', provisioningType: 'manual' },
  'app-workday': { appType: 'Workday', discoverySource: 'IAM', authorizationStatus: 'authorized', externalProvisioning: 'enabled', provisioningType: 'auto' },
  'app-servicenow': { appType: 'ServiceNow', discoverySource: 'IAM', authorizationStatus: 'authorized', externalProvisioning: 'disabled', provisioningType: 'manual' },
  'app-snowflake': { appType: 'Snowflake', discoverySource: 'Direct', authorizationStatus: 'pending', externalProvisioning: 'disabled', provisioningType: 'manual' },
  'app-netsuite': { appType: 'NetSuite', discoverySource: 'IAM', authorizationStatus: 'authorized', externalProvisioning: 'enabled', provisioningType: 'auto' },
  'app-jira': { appType: 'Jira', discoverySource: 'IAM', authorizationStatus: 'authorized', externalProvisioning: 'enabled', provisioningType: 'manual' },
};

/** Falls back rather than throwing, so a newly-seeded app still lists. */
export const appProfileFor = (id: string): AppProfile =>
  appProfiles[id] ?? { appType: 'Unknown', discoverySource: 'Direct', authorizationStatus: 'pending', externalProvisioning: 'disabled', provisioningType: 'manual' };

export const catalogApps: { id: string; name: string; description: string; ownerIds: string[]; entitlements: { id: string; name: string; description: string; risk: number; ownerIds: string[] }[] }[] = [
  { id: 'app-okta', name: 'Okta', description: 'Workforce identity & single sign-on.', ownerIds: ['o-marcus', 'o-henry'], entitlements: [
    { id: 'ent-okta-admin', name: 'Super Admin', description: 'Full tenant administration and user management.', risk: 88, ownerIds: ['o-marcus'] },
    { id: 'ent-okta-ro', name: 'Read-only Admin', description: 'View-only access to admin console.', risk: 32, ownerIds: ['o-henry'] },
    { id: 'ent-okta-user', name: 'Standard User', description: 'Standard sign-in access for end users.', risk: 8, ownerIds: ['o-henry'] },
    // Demo fixture: the entitlement whose App Accounts tab compares three ways
    // of revealing an account's details. Held by a deliberate spread — orphan,
    // no email, long name — so each variation is judged against awkward rows
    // rather than tidy ones.
    { id: 'ent-testent', name: 'testent', description: 'Test entitlement used to compare account-detail interactions.', risk: 45, ownerIds: ['o-henry'] },
  ] },
  { id: 'app-salesforce', name: 'Salesforce', description: 'CRM for sales, service, and marketing teams.', ownerIds: ['o-bob', 'o-henry'], entitlements: [
    { id: 'ent-sf-admin', name: 'System Administrator', description: 'Manage org configuration, users, and data.', risk: 84, ownerIds: ['o-bob'] },
    { id: 'ent-sf-sales', name: 'Sales User', description: 'Access leads, opportunities, and accounts.', risk: 40, ownerIds: ['o-bob'] },
    { id: 'ent-sf-service', name: 'Service Cloud User', description: 'Handle cases and service console.', risk: 38, ownerIds: ['o-henry'] },
  ] },
  { id: 'app-github', name: 'GitHub', description: 'Source control and CI for engineering.', ownerIds: ['o-priya', 'o-frank'], entitlements: [
    { id: 'ent-gh-org-admin', name: 'Org Admin', description: 'Owner of the organization and its repos.', risk: 80, ownerIds: ['o-priya'] },
    { id: 'ent-gh-maintain', name: 'Maintain', description: 'Manage a repository without admin rights.', risk: 52, ownerIds: ['o-frank'] },
    { id: 'ent-gh-write', name: 'Write', description: 'Push to repositories and open PRs.', risk: 45, ownerIds: ['o-frank'] },
  ] },
  { id: 'app-aws', name: 'AWS', description: 'Cloud infrastructure and services.', ownerIds: ['o-liam', 'o-marcus'], entitlements: [
    { id: 'ent-aws-admin', name: 'AdministratorAccess', description: 'Full access to all AWS services.', risk: 95, ownerIds: ['o-marcus'] },
    { id: 'ent-aws-power', name: 'PowerUserAccess', description: 'Full access except IAM management.', risk: 68, ownerIds: ['o-liam'] },
    { id: 'ent-aws-ro', name: 'ReadOnlyAccess', description: 'View-only across AWS resources.', risk: 22, ownerIds: ['o-nathan'] },
  ] },
  // `ownerIds: []` below is deliberate, not an oversight: SAP is the seeded
  // ownership gap the Governance Model reports as a finding.
  { id: 'app-sap', name: 'SAP S/4HANA Finance', description: 'Core finance, accounting, and procurement system.', ownerIds: [], entitlements: [
    { id: 'ent-sap-pay', name: 'Payment Release', description: 'Release outgoing vendor payments.', risk: 85, ownerIds: [] },
    { id: 'ent-sap-journal', name: 'Journal Post', description: 'Post journal entries to the general ledger.', risk: 68, ownerIds: ['o-hana'] },
    { id: 'ent-sap-vendor', name: 'Vendor Maintain', description: 'Create and edit vendor master data.', risk: 60, ownerIds: ['o-hana'] },
    { id: 'ent-sap-report', name: 'Finance Reporting', description: 'Read-only access to finance reports.', risk: 18, ownerIds: ['o-hana'] },
  ] },
  { id: 'app-workday', name: 'Workday', description: 'Core HR, payroll, and workforce records.', ownerIds: ['o-emily'], entitlements: [
    { id: 'ent-wday-admin', name: 'HR Administrator', description: 'Administer worker records and organizational structure.', risk: 76, ownerIds: ['o-emily'] },
    { id: 'ent-wday-comp', name: 'Compensation Analyst', description: 'View and model compensation data.', risk: 58, ownerIds: ['o-emily'] },
    { id: 'ent-wday-ess', name: 'Employee Self-Service', description: 'View and update your own worker profile.', risk: 6, ownerIds: ['o-emily'] },
  ] },
  { id: 'app-servicenow', name: 'ServiceNow', description: 'IT service management, change, and request fulfilment.', ownerIds: ['o-henry'], entitlements: [
    { id: 'ent-snow-admin', name: 'Platform Admin', description: 'Full administration of the ServiceNow instance.', risk: 82, ownerIds: ['o-henry'] },
    { id: 'ent-snow-change', name: 'Change Approver', description: 'Approve normal and emergency change requests.', risk: 54, ownerIds: ['o-grace'] },
    { id: 'ent-snow-fulfiller', name: 'Fulfiller', description: 'Work and resolve assigned service tickets.', risk: 28, ownerIds: ['o-grace'] },
  ] },
  { id: 'app-snowflake', name: 'Snowflake', description: 'Cloud data warehouse for analytics workloads.', ownerIds: ['o-nathan'], entitlements: [
    { id: 'ent-flake-acct', name: 'ACCOUNTADMIN', description: 'Highest-privilege role in the Snowflake account.', risk: 92, ownerIds: ['o-nathan'] },
    { id: 'ent-flake-sys', name: 'SYSADMIN', description: 'Create and manage warehouses, databases, and schemas.', risk: 70, ownerIds: ['o-nathan'] },
    { id: 'ent-flake-read', name: 'Analyst Read', description: 'Query curated analytics datasets.', risk: 24, ownerIds: ['o-nathan'] },
  ] },
  { id: 'app-netsuite', name: 'NetSuite', description: 'Billing, revenue, and subsidiary accounting.', ownerIds: ['o-hana'], entitlements: [
    { id: 'ent-ns-controller', name: 'Controller', description: 'Close periods and post adjusting entries.', risk: 74, ownerIds: ['o-hana'] },
    { id: 'ent-ns-ap', name: 'AP Clerk', description: 'Enter supplier bills and payment runs.', risk: 46, ownerIds: ['o-hana'] },
    { id: 'ent-ns-viewer', name: 'Financial Viewer', description: 'Read-only access to financial records.', risk: 14, ownerIds: ['o-hana'] },
  ] },
  { id: 'app-jira', name: 'Jira', description: 'Work tracking for product and engineering teams.', ownerIds: ['o-sofia'], entitlements: [
    { id: 'ent-jira-admin', name: 'Site Admin', description: 'Administer the Jira site, users, and permissions.', risk: 64, ownerIds: ['o-sofia'] },
    { id: 'ent-jira-project', name: 'Project Admin', description: 'Configure workflows and boards for a project.', risk: 38, ownerIds: ['o-sofia'] },
    { id: 'ent-jira-contrib', name: 'Contributor', description: 'Create, comment on, and transition issues.', risk: 12, ownerIds: ['o-sofia'] },
  ] },
];

export const technicalRoles: { id: string; name: string; description: string; risk: number; entitlementIds: string[]; memberIds: string[]; ownerIds: string[] }[] = [
  { id: 'tr-eng-baseline', name: 'Engineering Baseline', description: 'Standard tooling for engineers', risk: 25, entitlementIds: ['ent-gh-write', 'ent-okta-user'], memberIds: ['o-frank', 'o-sofia', 'o-priya'], ownerIds: ['o-priya'] },
  { id: 'tr-devops', name: 'DevOps Access', description: 'CI/CD and infrastructure access', risk: 74, entitlementIds: ['ent-aws-power', 'ent-gh-maintain', 'ent-aws-admin'], memberIds: ['o-frank', 'o-liam', 'o-marcus'], ownerIds: ['o-liam'] },
  { id: 'tr-data', name: 'Data Platform', description: 'Warehouse and BI access', risk: 56, entitlementIds: ['ent-aws-ro', 'ent-sf-service'], memberIds: ['o-nathan', 'o-bob'], ownerIds: ['o-nathan'] },
  { id: 'tr-sap-fin', name: 'SAP Finance Operations', description: 'Ledger posting and payment release in SAP', risk: 78, entitlementIds: ['ent-sap-journal', 'ent-sap-pay', 'ent-sap-vendor'], memberIds: ['o-bob', 'o-hana'], ownerIds: ['o-hana'] },
  { id: 'tr-workday-hr', name: 'Workday HR Administration', description: 'Worker records and organizational structure', risk: 66, entitlementIds: ['ent-wday-admin', 'ent-wday-comp'], memberIds: ['o-emily'], ownerIds: ['o-emily'] },
  { id: 'tr-sf-admin', name: 'Salesforce Administration', description: 'Org configuration and user management', risk: 70, entitlementIds: ['ent-sf-admin'], memberIds: ['o-bob'], ownerIds: ['o-henry'] },
  { id: 'tr-itsm', name: 'ITSM Operations', description: 'Change approval and request fulfilment', risk: 44, entitlementIds: ['ent-snow-change', 'ent-snow-fulfiller'], memberIds: ['o-grace', 'o-henry'], ownerIds: ['o-henry'] },
  { id: 'tr-analytics', name: 'Analytics Platform', description: 'Warehouse administration and curated datasets', risk: 52, entitlementIds: ['ent-flake-sys', 'ent-flake-read'], memberIds: ['o-nathan'], ownerIds: ['o-nathan'] },
];
export const businessRoles: { id: string; name: string; description: string; risk: number; technicalRoleIds: string[]; entitlementIds: string[]; memberIds: string[]; ownerIds: string[] }[] = [
  { id: 'br-sales-rep', name: 'Sales Representative', description: 'Apps for the sales org', risk: 30, technicalRoleIds: ['tr-eng-baseline'], entitlementIds: ['ent-sf-sales'], memberIds: ['o-daniel', 'o-bob', 'o-hana'], ownerIds: ['o-henry'] },
  { id: 'br-support', name: 'Support Agent', description: 'Customer support toolset', risk: 28, technicalRoleIds: ['tr-data'], entitlementIds: ['ent-sf-service'], memberIds: ['o-grace'], ownerIds: ['o-henry'] },
  { id: 'br-finance', name: 'Finance Analyst', description: 'Finance systems bundle', risk: 62, technicalRoleIds: ['tr-data', 'tr-sap-fin'], entitlementIds: ['ent-aws-ro', 'ent-sf-sales', 'ent-sap-report'], memberIds: ['o-bob', 'o-hana'], ownerIds: ['o-bob'] },
  // `ownerIds: []` is deliberate — the seeded business-role ownership gap.
  { id: 'br-controller', name: 'Financial Controller', description: 'Period close, payment release, and statutory reporting', risk: 80, technicalRoleIds: ['tr-sap-fin'], entitlementIds: ['ent-ns-controller'], memberIds: ['o-hana'], ownerIds: [] },
  { id: 'br-hr-generalist', name: 'HR Generalist', description: 'Worker lifecycle and people operations', risk: 34, technicalRoleIds: ['tr-workday-hr'], entitlementIds: ['ent-wday-ess'], memberIds: ['o-emily'], ownerIds: ['o-emily'] },
  { id: 'br-security-analyst', name: 'Security Analyst', description: 'Threat monitoring and access investigation', risk: 68, technicalRoleIds: ['tr-devops'], entitlementIds: ['ent-okta-ro'], memberIds: ['o-catherine'], ownerIds: ['o-catherine'] },
  { id: 'br-cloud-engineer', name: 'Cloud Engineer', description: 'Infrastructure build and operations', risk: 72, technicalRoleIds: ['tr-devops', 'tr-eng-baseline'], entitlementIds: ['ent-aws-power'], memberIds: ['o-liam', 'o-frank'], ownerIds: ['o-liam'] },
  { id: 'br-service-desk', name: 'IT Service Desk', description: 'First-line support and request fulfilment', risk: 30, technicalRoleIds: ['tr-itsm'], entitlementIds: ['ent-snow-fulfiller'], memberIds: ['o-grace'], ownerIds: ['o-henry'] },
];

/** Governance groups — reviewers/owners that govern access. `members` = reviewer count. */
export const governanceGroups: { id: string; name: string; description: string; members: number; reviewerIds: string[]; ownedApplicationIds: string[]; ownedEntitlementIds: string[]; ownedTechnicalRoleIds: string[]; ownedBusinessRoleIds: string[] }[] = [
  { id: 'gg-secops', name: 'Security Operations', description: 'Owns privileged access and reviews security-sensitive entitlements.', members: 2, reviewerIds: ['o-catherine', 'o-marcus'], ownedApplicationIds: ['app-okta'], ownedEntitlementIds: ['ent-okta-admin', 'ent-aws-admin', 'ent-flake-acct'], ownedTechnicalRoleIds: ['tr-devops'], ownedBusinessRoleIds: ['br-security-analyst'] },
  { id: 'gg-it-admins', name: 'IT Administrators', description: 'Owns infrastructure applications and administrator access.', members: 2, reviewerIds: ['o-marcus', 'o-henry'], ownedApplicationIds: ['app-aws', 'app-servicenow'], ownedEntitlementIds: ['ent-aws-power', 'ent-snow-admin'], ownedTechnicalRoleIds: ['tr-devops', 'tr-itsm'], ownedBusinessRoleIds: ['br-service-desk'] },
  { id: 'gg-compliance', name: 'Compliance Team', description: 'Reviews access for regulatory compliance.', members: 2, reviewerIds: ['o-olivia', 'o-catherine'], ownedApplicationIds: [], ownedEntitlementIds: ['ent-sf-admin'], ownedTechnicalRoleIds: [], ownedBusinessRoleIds: ['br-finance', 'br-controller'] },
  { id: 'gg-app-owners', name: 'Application Owners', description: 'Owns business applications and their role bundles.', members: 3, reviewerIds: ['o-henry', 'o-priya', 'o-bob'], ownedApplicationIds: ['app-salesforce', 'app-github', 'app-jira'], ownedEntitlementIds: [], ownedTechnicalRoleIds: ['tr-eng-baseline', 'tr-sf-admin'], ownedBusinessRoleIds: ['br-sales-rep', 'br-support'] },
  { id: 'gg-finance', name: 'Finance Approvers', description: 'Approves and owns finance-system access.', members: 2, reviewerIds: ['o-bob', 'o-hana'], ownedApplicationIds: ['app-netsuite'], ownedEntitlementIds: ['ent-sf-sales', 'ent-sap-pay'], ownedTechnicalRoleIds: ['tr-sap-fin'], ownedBusinessRoleIds: ['br-finance'] },
];

/** App Accounts — a User Identity's login within an application (identityId null = orphan). */
export interface SeedAppAccount {
  id: string;
  accountName: string;
  email: string;
  applicationId: string;
  identityId: string | null;
  entitlementIds: string[];
}
export const appAccounts: SeedAppAccount[] = [
  { id: 'aa-marcus-okta', accountName: 'marcus.lee', email: 'marcus.lee@acme.com', applicationId: 'app-okta', identityId: 'o-marcus', entitlementIds: ['ent-okta-admin'] },
  { id: 'aa-marcus-aws', accountName: 'mlee', email: 'marcus.lee@acme.com', applicationId: 'app-aws', identityId: 'o-marcus', entitlementIds: ['ent-aws-admin'] },
  { id: 'aa-liam-aws', accountName: 'lturner', email: 'liam.turner@acme.com', applicationId: 'app-aws', identityId: 'o-liam', entitlementIds: ['ent-aws-power', 'ent-aws-admin'] },
  { id: 'aa-liam-github', accountName: 'liam-t', email: 'liam.turner@acme.com', applicationId: 'app-github', identityId: 'o-liam', entitlementIds: ['ent-gh-org-admin'] },
  { id: 'aa-priya-github', accountName: 'priya-s', email: 'priya.sharma@acme.com', applicationId: 'app-github', identityId: 'o-priya', entitlementIds: ['ent-gh-maintain'] },
  { id: 'aa-priya-aws', accountName: 'psharma', email: 'priya.sharma@acme.com', applicationId: 'app-aws', identityId: 'o-priya', entitlementIds: ['ent-aws-power'] },
  { id: 'aa-frank-github', accountName: 'frank-w', email: 'frank.wilson@acme.com', applicationId: 'app-github', identityId: 'o-frank', entitlementIds: ['ent-gh-write'] },
  { id: 'aa-nathan-aws', accountName: 'ngreen', email: 'nathan.green@acme.com', applicationId: 'app-aws', identityId: 'o-nathan', entitlementIds: ['ent-aws-ro'] },
  { id: 'aa-nathan-sf', accountName: 'nathan.green@acme.com', email: 'nathan.green@acme.com', applicationId: 'app-salesforce', identityId: 'o-nathan', entitlementIds: ['ent-sf-service'] },
  { id: 'aa-bob-sf', accountName: 'bob.smith@acme.com', email: 'bob.smith@acme.com', applicationId: 'app-salesforce', identityId: 'o-bob', entitlementIds: ['ent-sf-sales'] },
  { id: 'aa-bob-aws', accountName: 'bsmith', email: 'bob.smith@acme.com', applicationId: 'app-aws', identityId: 'o-bob', entitlementIds: ['ent-aws-ro'] },
  { id: 'aa-daniel-sf', accountName: 'daniel.white@acme.com', email: 'daniel.white@acme.com', applicationId: 'app-salesforce', identityId: 'o-daniel', entitlementIds: ['ent-sf-sales'] },
  { id: 'aa-grace-sf', accountName: 'grace.lee@acme.com', email: 'grace.lee@acme.com', applicationId: 'app-salesforce', identityId: 'o-grace', entitlementIds: ['ent-sf-service'] },
  { id: 'aa-emily-okta', accountName: 'emily.davis', email: 'emily.davis@acme.com', applicationId: 'app-okta', identityId: 'o-emily', entitlementIds: ['ent-okta-user', 'ent-testent'] },
  { id: 'aa-catherine-okta', accountName: 'catherine.brown', email: 'catherine.brown@acme.com', applicationId: 'app-okta', identityId: 'o-catherine', entitlementIds: ['ent-okta-ro', 'ent-testent'] },
  { id: 'aa-catherine-aws', accountName: 'cbrown', email: 'catherine.brown@acme.com', applicationId: 'app-aws', identityId: 'o-catherine', entitlementIds: ['ent-aws-ro'] },
  { id: 'aa-henry-okta', accountName: 'henry.taylor', email: 'henry.taylor@acme.com', applicationId: 'app-okta', identityId: 'o-henry', entitlementIds: ['ent-okta-ro', 'ent-testent'] },
  // Awkward rows for the demo: no owning identity, and no email.
  { id: 'aa-orphan-okta', accountName: 'svc-okta-provisioning', email: '', applicationId: 'app-okta', identityId: null, entitlementIds: ['ent-testent'] },
  { id: 'aa-sofia-github', accountName: 'sofia-r', email: 'sofia.rossi@acme.com', applicationId: 'app-github', identityId: 'o-sofia', entitlementIds: ['ent-gh-write'] },
  { id: 'aa-hana-sf', accountName: 'hana.kim@acme.com', email: 'hana.kim@acme.com', applicationId: 'app-salesforce', identityId: 'o-hana', entitlementIds: ['ent-sf-sales'] },
  { id: 'aa-orphan-sf', accountName: 'svc-integration', email: 'integration@acme.com', applicationId: 'app-salesforce', identityId: null, entitlementIds: ['ent-sf-service'] },
  { id: 'aa-orphan-aws', accountName: 'legacy-admin', email: '', applicationId: 'app-aws', identityId: null, entitlementIds: ['ent-aws-power'] },
  { id: 'aa-hana-sap', accountName: 'HKIM', email: 'hana.kim@acme.com', applicationId: 'app-sap', identityId: 'o-hana', entitlementIds: ['ent-sap-journal', 'ent-sap-pay'] },
  { id: 'aa-bob-sap', accountName: 'BSMITH', email: 'bob.smith@acme.com', applicationId: 'app-sap', identityId: 'o-bob', entitlementIds: ['ent-sap-journal', 'ent-sap-vendor'] },
  { id: 'aa-olivia-sap', accountName: 'OMARTIN', email: 'olivia.martin@acme.com', applicationId: 'app-sap', identityId: 'o-olivia', entitlementIds: ['ent-sap-report'] },
  { id: 'aa-orphan-sap', accountName: 'BATCH_POST', email: '', applicationId: 'app-sap', identityId: null, entitlementIds: ['ent-sap-journal'] },
  { id: 'aa-emily-workday', accountName: 'emily.davis', email: 'emily.davis@acme.com', applicationId: 'app-workday', identityId: 'o-emily', entitlementIds: ['ent-wday-admin', 'ent-wday-comp'] },
  { id: 'aa-priya-workday', accountName: 'priya.sharma', email: 'priya.sharma@acme.com', applicationId: 'app-workday', identityId: 'o-priya', entitlementIds: ['ent-wday-ess'] },
  { id: 'aa-daniel-workday', accountName: 'daniel.white', email: 'daniel.white@acme.com', applicationId: 'app-workday', identityId: 'o-daniel', entitlementIds: ['ent-wday-ess'] },
  { id: 'aa-henry-snow', accountName: 'henry.taylor', email: 'henry.taylor@acme.com', applicationId: 'app-servicenow', identityId: 'o-henry', entitlementIds: ['ent-snow-admin'] },
  { id: 'aa-grace-snow', accountName: 'grace.lee', email: 'grace.lee@acme.com', applicationId: 'app-servicenow', identityId: 'o-grace', entitlementIds: ['ent-snow-change', 'ent-snow-fulfiller'] },
  { id: 'aa-marcus-snow', accountName: 'marcus.lee', email: 'marcus.lee@acme.com', applicationId: 'app-servicenow', identityId: 'o-marcus', entitlementIds: ['ent-snow-fulfiller'] },
  { id: 'aa-nathan-flake', accountName: 'NGREEN', email: 'nathan.green@acme.com', applicationId: 'app-snowflake', identityId: 'o-nathan', entitlementIds: ['ent-flake-acct', 'ent-flake-sys'] },
  { id: 'aa-bob-flake', accountName: 'BSMITH', email: 'bob.smith@acme.com', applicationId: 'app-snowflake', identityId: 'o-bob', entitlementIds: ['ent-flake-read'] },
  { id: 'aa-hana-netsuite', accountName: 'hana.kim', email: 'hana.kim@acme.com', applicationId: 'app-netsuite', identityId: 'o-hana', entitlementIds: ['ent-ns-controller'] },
  { id: 'aa-bob-netsuite', accountName: 'bob.smith', email: 'bob.smith@acme.com', applicationId: 'app-netsuite', identityId: 'o-bob', entitlementIds: ['ent-ns-ap'] },
  { id: 'aa-sofia-jira', accountName: 'sofia.rossi', email: 'sofia.rossi@acme.com', applicationId: 'app-jira', identityId: 'o-sofia', entitlementIds: ['ent-jira-admin'] },
  { id: 'aa-frank-jira', accountName: 'frank.wilson', email: 'frank.wilson@acme.com', applicationId: 'app-jira', identityId: 'o-frank', entitlementIds: ['ent-jira-project'] },
  { id: 'aa-priya-jira', accountName: 'priya.sharma', email: 'priya.sharma@acme.com', applicationId: 'app-jira', identityId: 'o-priya', entitlementIds: ['ent-jira-contrib'] },
];

/** People directory — candidates for "Add Owners". The full canonical people set. */
export const ownerDirectory: SeedEAOwner[] = userIdentities.map(toOwner);
