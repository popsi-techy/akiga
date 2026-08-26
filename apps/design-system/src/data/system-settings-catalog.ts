/**
 * Destinations on the System Settings hub.
 *
 * Grouped by job, not by product module: identities, access, then sign-in.
 * Every destination here has its own route and form.
 */

export const SYSTEM_SETTINGS_GROUPS = [
  {
    id: 'identities',
    title: 'Identity data and correlation',
    description: 'Identities, attributes, account matching, and usage location.',
  },
  {
    id: 'access',
    title: 'Access lifecycle and fulfillment',
    description: 'Access requests, reviews, discovery, provisioning, and fulfillment.',
  },
  {
    id: 'sign-in',
    title: 'Authentication and identity providers',
    description: 'Sign-in, MFA, SSO, and how users authenticate to this tenant.',
  },
] as const;

export type SystemSettingsGroupId = (typeof SYSTEM_SETTINGS_GROUPS)[number]['id'];

export interface SystemSettingsSection {
  id: string;
  href: string;
  title: string;
  group: SystemSettingsGroupId;
  /** About fifteen words on the hub. */
  description: string;
  /** Verb for this setting when a destination list shows an action. */
  actionLabel: string;
  /** Lead on the destination page. */
  pageDescription: string;
  keywords: string[];
  /** False until the inner page has real settings. */
  implemented: boolean;
}

export const SYSTEM_SETTINGS_SECTIONS: SystemSettingsSection[] = [
  {
    id: 'mfa',
    href: '/iga/configurations/mfa',
    title: 'MFA',
    group: 'sign-in',
    description: 'Enforce a second factor at login and set which roles must complete it.',
    actionLabel: 'Manage',
    pageDescription:
      'Enforce extra security checks during login and customize authentication requirements by user role.',
    keywords: ['otp', 'email', '2fa', 'factor', 'end user', 'reviewer', 'mfa', 'login'],
    implemented: true,
  },
  {
    id: 'sso-oauth',
    href: '/iga/configurations/sso-oauth',
    title: 'SSO OAuth Login',
    group: 'sign-in',
    description: 'Let tenant users sign in through an external identity provider instead of local credentials.',
    actionLabel: 'Configure',
    pageDescription:
      'Register an external identity provider (name, provider, client ID and secret, redirect URI) so tenant users sign in through your IdP instead of local credentials.',
    keywords: ['idp', 'oauth', 'sso', 'client', 'redirect', 'login', 'provider'],
    implemented: true,
  },
  {
    id: 'micro-certification',
    href: '/iga/configurations/micro-certification',
    title: 'Micro Certification',
    group: 'access',
    description: 'Choose when daily system events are collected and launched as a certification.',
    actionLabel: 'Configure',
    pageDescription:
      'System events are collected throughout the day and processed at your scheduled time.',
    keywords: ['timezone', 'schedule', 'daily', 'launch', 'micro', 'certification', 'events'],
    implemented: true,
  },
  {
    id: 'access-request',
    href: '/iga/configurations/access-request',
    title: 'Access Request',
    group: 'access',
    description: 'Set defaults for how access is requested, approved, and notified by email.',
    actionLabel: 'Manage defaults',
    pageDescription:
      'General, application, entitlement, role, and notification defaults for how access is requested.',
    keywords: [
      'on behalf',
      'entitlement',
      'role',
      'application',
      'notification',
      'approval',
      'requestable',
      'email template',
    ],
    implemented: true,
  },
  {
    id: 'entitlement-types',
    href: '/iga/configurations/entitlement-types',
    title: 'Entitlement Types',
    group: 'access',
    description: 'Define the categories of access this tenant recognises, such as group, permission, and role.',
    actionLabel: 'Manage types',
    pageDescription: 'Manage the types of entitlements available in your system',
    keywords: ['group', 'permission', 'role', 'classify', 'category'],
    implemented: true,
  },
  {
    id: 'provisioning-task',
    href: '/iga/configurations/provisioning-task',
    title: 'Provisioning Task',
    group: 'access',
    description: 'Require evidence upload when an admin completes a manual provisioning grant or removal.',
    actionLabel: 'Configure evidence',
    pageDescription:
      'Configure evidence upload requirements for manual provisioning tasks.',
    keywords: ['evidence', 'upload', 'manual', 'audit', 'grant', 'remove'],
    implemented: true,
  },
  {
    id: 'role-mining',
    href: '/iga/configurations/role-mining',
    title: 'Role Mining',
    group: 'access',
    description: 'Set coverage and size thresholds that control automated discovery of candidate roles.',
    actionLabel: 'Configure thresholds',
    pageDescription:
      'Configure automated role mining schedules and algorithm thresholds.',
    keywords: ['mining', 'coverage', 'threshold', 'candidate', 'discovery', 'algorithm'],
    implemented: true,
  },
  {
    id: 'custom-attributes',
    href: '/iga/configurations/custom-attributes',
    title: 'Custom Attributes',
    group: 'identities',
    description: 'Add extra fields on identities and accounts that source systems do not already provide.',
    actionLabel: 'Manage fields',
    pageDescription:
      'Define custom attribute schemas. Values can be set on both user identities and accounts.',
    keywords: ['cost center', 'employee type', 'attribute', 'field', 'identity', 'account'],
    implemented: true,
  },
  {
    id: 'identity-correlation',
    href: '/iga/configurations/identity-correlation',
    title: 'User Identity Correlation',
    group: 'identities',
    description: 'Match discovered application accounts to the right identity and flag leftover orphans.',
    actionLabel: 'Manage rules',
    pageDescription:
      'Rules that match accounts discovered in applications to the right identity (by email, display name, and similar) with a confidence threshold. Determines what becomes owned access versus an orphan account.',
    keywords: ['orphan', 'match', 'email', 'display name', 'confidence', 'correlation', 'account'],
    implemented: true,
  },
  {
    id: 'locale-regional',
    href: '/iga/configurations/locale-regional',
    title: 'Locale & Regional',
    group: 'identities',
    description: 'Set the default usage country for users who do not already have one.',
    actionLabel: 'Change locale',
    pageDescription:
      'Default country and locale settings applied during user provisioning.',
    keywords: ['iso', 'country', 'location', 'm365', 'license', 'locale', 'region'],
    implemented: true,
  },
];

export function getSystemSettingsSection(id: string): SystemSettingsSection | undefined {
  return SYSTEM_SETTINGS_SECTIONS.find((s) => s.id === id);
}

function haystack(parts: string[]): string {
  return parts.join(' ').toLowerCase();
}

/** Groups with matching sections. A query that hits a group title keeps every item in it. */
export function filterSystemSettingsGroups(query: string) {
  const q = query.trim().toLowerCase();
  return SYSTEM_SETTINGS_GROUPS.map((group) => {
    const byGroup = SYSTEM_SETTINGS_SECTIONS.filter((s) => s.group === group.id);
    if (!q) return { group, items: byGroup };
    const groupHit = haystack([group.title, group.description]).includes(q);
    const items = groupHit
      ? byGroup
      : byGroup.filter((s) => haystack([s.title, s.description, ...s.keywords]).includes(q));
    return { group, items };
  }).filter((g) => g.items.length > 0);
}
