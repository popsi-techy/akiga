/**
 * Application types — what an application can be onboarded *from*.
 *
 * This is the type side of the App Type / App Name split: an admin picks a type
 * here, then names the instance it creates, so two Salesforce tenants share one
 * type and differ only by name (see `appProfiles` in the seed).
 *
 * Three categories, because they onboard at different granularity: a direct
 * type brings in one application, an IAM brings in every application it already
 * federates, and a PAM brings in privileged accounts rather than business
 * access.
 */

export type AppTypeCategory = 'application' | 'iam' | 'pam';
export type AppTypeStatus = 'available' | 'coming-soon';

export interface AppTypeOption {
  id: string;
  name: string;
  /** Ten words — every catalog tile uses the same length so the grid stays even. */
  summary: string;
  /** How it talks to the system — shown as pills on the catalog tile. */
  protocols: string[];
  /**
   * IGA is the SCIM server this type pushes to. Listing SCIM as a protocol
   * is not enough — Google Workspace speaks SCIM outbound via Directory, and
   * must not show an inbound token.
   */
  inboundScim?: boolean;
  /** What IGA can do once this type is connected. Shown in Preview. */
  capabilities: string[];
  /** What an administrator must have ready before connecting. Shown in Preview. */
  prerequisites: string[];
  category: AppTypeCategory;
  status: AppTypeStatus;
}

export const appTypeCategories: { id: AppTypeCategory; label: string; description: string }[] = [
  { id: 'application', label: 'Applications', description: 'Business applications you can onboard directly' },
  { id: 'iam', label: 'IAM Integrations', description: 'Connect an IAM to discover and onboard many apps at once' },
  { id: 'pam', label: 'PAM Integrations', description: 'Connect a vault to govern privileged and break-glass access' },
];

/** Available before coming-soon inside each category, so the actionable tiles lead. */
export const appTypes: AppTypeOption[] = [
  {
    id: 'at-custom',
    name: 'Custom Application',
    summary: 'Connect any custom system so IGA governs accounts and access.',
    protocols: ['REST API'],
    capabilities: ['REST account import', 'Manual provisioning', 'Custom entitlement schema', 'Webhook fulfilment'],
    prerequisites: ['REST endpoint URL', 'API key or OAuth client'],
    category: 'application',
    status: 'available',
  },
  {
    id: 'at-google-workspace',
    name: 'Google Workspace',
    summary: 'Connect mail, calendar, and drive so IGA governs workforce accounts.',
    protocols: ['Directory', 'SCIM'],
    capabilities: [
      'Single Sign-On (SAML/OIDC)',
      'Automated SCIM Provisioning',
      'Account Schema Aggregation',
      'Identity Source / HR Sync',
    ],
    prerequisites: [
      'Google Workspace Service Account JSON Key',
      'Admin SDK API enabled in Google Cloud Console',
    ],
    category: 'application',
    status: 'available',
  },
  {
    id: 'at-scim',
    name: 'SCIM Application',
    summary: 'Connect any SCIM app so IGA provisions and reconciles accounts.',
    protocols: ['SCIM'],
    inboundScim: true,
    capabilities: [
      'Automated SCIM Provisioning',
      'Account Schema Aggregation',
      'Entitlement import',
      'Password sync',
    ],
    prerequisites: ['SCIM 2.0 endpoint URL', 'Bearer token or OAuth client'],
    category: 'application',
    status: 'available',
  },
  {
    id: 'at-active-directory',
    name: 'Active Directory',
    summary: 'Connect on-prem directory so IGA governs domain users and groups.',
    protocols: ['LDAP', 'On-prem'],
    capabilities: [
      'Account Schema Aggregation',
      'Group import',
      'Password reset',
      'Identity Source / HR Sync',
    ],
    prerequisites: ['Domain controller host', 'Bind account with read rights'],
    category: 'application',
    status: 'available',
  },
  {
    id: 'at-adobe',
    name: 'Adobe',
    summary: 'Connect Creative Cloud so IGA assigns seats and product access.',
    protocols: ['UMAPI', 'SCIM'],
    capabilities: [
      'Automated SCIM Provisioning',
      'Product profile assignment',
      'Account Schema Aggregation',
      'License reconciliation',
    ],
    prerequisites: ['UMAPI credentials', 'Adobe Admin Console API access'],
    category: 'application',
    status: 'available',
  },
  {
    id: 'at-salesforce',
    name: 'Salesforce',
    summary: 'Connect the CRM so IGA governs users, profiles, and roles.',
    protocols: ['REST', 'SCIM'],
    capabilities: [
      'Single Sign-On (SAML/OIDC)',
      'Automated SCIM Provisioning',
      'Profile and permission-set import',
      'Account Schema Aggregation',
    ],
    prerequisites: ['Connected App', 'OAuth client with API enabled'],
    category: 'application',
    status: 'coming-soon',
  },
  {
    id: 'at-slack',
    name: 'Slack',
    summary: 'Connect the workspace so IGA governs members, channels, and guests.',
    protocols: ['SCIM', 'OAuth'],
    capabilities: [
      'Automated SCIM Provisioning',
      'Workspace member import',
      'Channel entitlement import',
      'Single Sign-On (SAML)',
    ],
    prerequisites: ['Slack Enterprise Grid', 'SCIM API token'],
    category: 'application',
    status: 'coming-soon',
  },
  {
    id: 'at-github',
    name: 'GitHub Enterprise',
    summary: 'Connect the organization so IGA governs members, teams, and repos.',
    protocols: ['REST', 'SCIM'],
    capabilities: [
      'Automated SCIM Provisioning',
      'Org member import',
      'Team entitlement import',
      'Single Sign-On (SAML)',
    ],
    prerequisites: ['GitHub Enterprise organization', 'Fine-grained PAT or GitHub App'],
    category: 'application',
    status: 'coming-soon',
  },
  {
    id: 'at-servicenow',
    name: 'ServiceNow',
    summary: 'Connect the instance so IGA governs fulfillers, roles, and groups.',
    protocols: ['REST', 'SCIM'],
    capabilities: [
      'Automated SCIM Provisioning',
      'Role and group import',
      'Account Schema Aggregation',
      'Ticket fulfilment hook',
    ],
    prerequisites: ['Instance URL', 'OAuth client or basic admin'],
    category: 'application',
    status: 'coming-soon',
  },
  {
    id: 'at-entra',
    name: 'Microsoft Entra ID',
    summary: 'Connect the tenant so IGA discovers cloud apps and identities.',
    protocols: ['SCIM', 'Graph API'],
    capabilities: [
      'Single Sign-On (SAML/OIDC)',
      'Automated SCIM Provisioning',
      'App discovery',
      'Identity Source / HR Sync',
    ],
    prerequisites: ['Tenant ID', 'App registration with Graph permissions'],
    category: 'iam',
    status: 'available',
  },
  {
    id: 'at-okta',
    name: 'Okta',
    summary: 'Connect the IAM so IGA discovers federated apps and accounts.',
    protocols: ['SCIM', 'OAuth'],
    capabilities: [
      'Single Sign-On (SAML/OIDC)',
      'Automated SCIM Provisioning',
      'App discovery',
      'Identity Source / HR Sync',
    ],
    prerequisites: ['Okta org URL', 'API token with read apps'],
    category: 'iam',
    status: 'coming-soon',
  },
  {
    id: 'at-cyberark',
    name: 'CyberArk',
    summary: 'Connect the vault so IGA governs privileged and break-glass access.',
    protocols: ['REST', 'Vault'],
    capabilities: [
      'Privileged account import',
      'Vault reconciliation',
      'Break-glass checkout',
      'Session recording link',
    ],
    prerequisites: ['PVWA URL', 'CyberArk API credentials'],
    category: 'pam',
    status: 'coming-soon',
  },
  {
    id: 'at-hashicorp-vault',
    name: 'HashiCorp Vault',
    summary: 'Connect the vault so IGA governs secrets and privileged access.',
    protocols: ['REST', 'Vault'],
    capabilities: [
      'Secret engine discovery',
      'Privileged credential import',
      'Lease reconciliation',
      'Policy import',
    ],
    prerequisites: ['Vault address', 'AppRole or token with list rights'],
    category: 'pam',
    status: 'coming-soon',
  },
];

export function listAppTypes(): AppTypeOption[] {
  return appTypes;
}

/** Resolve a catalog type by id or display name. */
export function getAppType(nameOrId: string): AppTypeOption | undefined {
  return appTypes.find((t) => t.id === nameOrId || t.name === nameOrId);
}

/** True when this type speaks a given protocol (e.g. SCIM). */
export function appTypeHasProtocol(nameOrId: string, protocol: string): boolean {
  return getAppType(nameOrId)?.protocols.includes(protocol) ?? false;
}

/** True when IGA is the SCIM server this type pushes into. */
export function appTypeHasInboundScim(nameOrId: string): boolean {
  return getAppType(nameOrId)?.inboundScim === true;
}

/** The fallback type when the catalog has no match for a search. */
export function getCustomAppType(): AppTypeOption {
  return appTypes.find((t) => t.id === 'at-custom')!;
}

/** True when the type answers a free-text search of name or protocol. */
export function appTypeMatches(t: AppTypeOption, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    t.name.toLowerCase().includes(q) ||
    t.summary.toLowerCase().includes(q) ||
    t.protocols.some((p) => p.toLowerCase().includes(q))
  );
}

/** Unique protocols on catalogued types, sorted, so a filter list stays stable. */
export function listAppTypeProtocols(): string[] {
  const seen = new Set<string>();
  for (const t of appTypes) {
    if (t.id === 'at-custom') continue;
    for (const p of t.protocols) seen.add(p);
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}

/**
 * True when the type survives a FilterDrawer selection. An empty group is
 * unconstrained — same rule as every other catalog filter.
 */
export function appTypeMatchesFilters(
  t: AppTypeOption,
  selection: Record<string, string[]>,
): boolean {
  const cats = selection.category ?? [];
  const protocols = selection.protocol ?? [];
  if (cats.length > 0 && !cats.includes(t.category)) return false;
  if (protocols.length > 0 && !t.protocols.some((p) => protocols.includes(p))) return false;
  return true;
}
