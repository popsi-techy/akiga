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
  /** How it talks to the system — shown under the name, joined with a middot. */
  protocols: string[];
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
  { id: 'at-google-workspace', name: 'Google Workspace', protocols: ['Directory', 'SCIM'], category: 'application', status: 'available' },
  { id: 'at-custom', name: 'Custom Application', protocols: ['REST API'], category: 'application', status: 'available' },
  { id: 'at-scim', name: 'SCIM Application', protocols: ['SCIM'], category: 'application', status: 'available' },
  { id: 'at-active-directory', name: 'Active Directory', protocols: ['LDAP', 'On-prem'], category: 'application', status: 'available' },
  { id: 'at-salesforce', name: 'Salesforce', protocols: ['REST', 'SCIM'], category: 'application', status: 'coming-soon' },
  { id: 'at-slack', name: 'Slack', protocols: ['SCIM', 'OAuth'], category: 'application', status: 'coming-soon' },
  { id: 'at-github', name: 'GitHub Enterprise', protocols: ['REST', 'SCIM'], category: 'application', status: 'coming-soon' },
  { id: 'at-servicenow', name: 'ServiceNow', protocols: ['REST', 'SCIM'], category: 'application', status: 'coming-soon' },

  { id: 'at-entra', name: 'Microsoft Entra ID', protocols: ['SCIM', 'Graph API'], category: 'iam', status: 'available' },
  { id: 'at-okta', name: 'Okta', protocols: ['SCIM', 'OAuth'], category: 'iam', status: 'coming-soon' },

  { id: 'at-cyberark', name: 'CyberArk', protocols: ['REST', 'Vault'], category: 'pam', status: 'coming-soon' },
  { id: 'at-hashicorp-vault', name: 'HashiCorp Vault', protocols: ['REST', 'Vault'], category: 'pam', status: 'coming-soon' },
];

export function listAppTypes(): AppTypeOption[] {
  return appTypes;
}

/** True when the type answers a free-text search of name or protocol. */
export function appTypeMatches(t: AppTypeOption, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return t.name.toLowerCase().includes(q) || t.protocols.some((p) => p.toLowerCase().includes(q));
}
