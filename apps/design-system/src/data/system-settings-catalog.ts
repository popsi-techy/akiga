/**
 * Destinations on the System Settings hub.
 *
 * Grouped by job, not by product module: sign-in, access, identities,
 * notifications. `implemented` pages have their own route and form; the rest
 * share a placeholder — same catalog, one source of titles.
 */

export const SYSTEM_SETTINGS_GROUPS = [
  {
    id: 'sign-in',
    title: 'Authentication and identity providers',
    description: 'Sign-in, MFA, SSO, and how users authenticate to this tenant.',
  },
  {
    id: 'access',
    title: 'Access lifecycle and fulfillment',
    description: 'Access requests, reviews, discovery, provisioning, and fulfillment.',
  },
  {
    id: 'identities',
    title: 'Identity data and correlation',
    description: 'Identities, attributes, account matching, and usage location.',
  },
  {
    id: 'notifications',
    title: 'Notification templates and routing',
    description: 'Notifications, email templates, and which event sends which message.',
  },
] as const;

export type SystemSettingsGroupId = (typeof SYSTEM_SETTINGS_GROUPS)[number]['id'];

export interface SystemSettingsSection {
  id: string;
  href: string;
  title: string;
  group: SystemSettingsGroupId;
  /** One line on the hub card. */
  description: string;
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
    description: 'Second-factor for end users and reviewers.',
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
    description: 'Sign in through an external identity provider.',
    pageDescription:
      'Register an external identity provider (name, provider, client ID and secret, redirect URI) so tenant users sign in through your IdP instead of local credentials.',
    keywords: ['idp', 'oauth', 'sso', 'client', 'redirect', 'login', 'provider'],
    implemented: false,
  },
  {
    id: 'access-request',
    href: '/iga/configurations/access-request',
    title: 'Access Request',
    group: 'access',
    description: 'Defaults for requests, approvals, and emails.',
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
    description: 'Categories of access your tenant recognises.',
    pageDescription:
      'Manage the categories of access your tenant recognises (GROUP, PERMISSION, ROLE). Controls how discovered access is classified, filtered and requested.',
    keywords: ['group', 'permission', 'role', 'classify', 'category'],
    implemented: false,
  },
  {
    id: 'micro-certification',
    href: '/iga/configurations/micro-certification',
    title: 'Micro Certification',
    group: 'access',
    description: 'When daily events become a certification.',
    pageDescription:
      'System events are collected throughout the day and processed at your scheduled time.',
    keywords: ['timezone', 'schedule', 'daily', 'launch', 'micro', 'certification', 'events'],
    implemented: true,
  },
  {
    id: 'provisioning-task',
    href: '/iga/configurations/provisioning-task',
    title: 'Provisioning Task',
    group: 'access',
    description: 'Evidence required on manual provisioning.',
    pageDescription:
      'Whether evidence upload is mandatory when an admin completes a manual provisioning task. Use it when audit requires proof that access was actually granted or removed.',
    keywords: ['evidence', 'upload', 'manual', 'audit', 'grant', 'remove'],
    implemented: false,
  },
  {
    id: 'role-mining',
    href: '/iga/configurations/role-mining',
    title: 'Role Mining',
    group: 'access',
    description: 'Thresholds for automated role discovery.',
    pageDescription:
      'Master switch and thresholds for automated role discovery: app-level versus tenant-level periodic mining, minimum coverage, minimum entitlements per role, and minimum accounts per role. Tunes how many candidate roles the algorithm proposes and how strict they are.',
    keywords: ['mining', 'coverage', 'threshold', 'candidate', 'discovery', 'algorithm'],
    implemented: false,
  },
  {
    id: 'custom-attributes',
    href: '/iga/configurations/custom-attributes',
    title: 'Custom Attributes',
    group: 'identities',
    description: 'Extra fields on identities and accounts.',
    pageDescription:
      'Define extra attribute fields (for example Cost Center or Employee Type) on user identities and accounts, so governance rules and reports can use data your source systems do not provide out of the box.',
    keywords: ['cost center', 'employee type', 'attribute', 'field', 'identity', 'account'],
    implemented: false,
  },
  {
    id: 'identity-correlation',
    href: '/iga/configurations/identity-correlation',
    title: 'User Identity Correlation',
    group: 'identities',
    description: 'Match discovered accounts to identities.',
    pageDescription:
      'Rules that match accounts discovered in applications to the right identity (by email, display name, and similar) with a confidence threshold. Determines what becomes owned access versus an orphan account.',
    keywords: ['orphan', 'match', 'email', 'display name', 'confidence', 'correlation', 'account'],
    implemented: false,
  },
  {
    id: 'locale-regional',
    href: '/iga/configurations/locale-regional',
    title: 'Locale & Regional',
    group: 'identities',
    description: 'Default country for users without one.',
    pageDescription:
      'Default usage location (ISO country code) applied to users who do not have one. Required by Microsoft 365 before licenses can be assigned.',
    keywords: ['iso', 'country', 'location', 'm365', 'license', 'locale', 'region'],
    implemented: false,
  },
  {
    id: 'email-templates',
    href: '/iga/configurations/email-templates',
    title: 'Email Templates',
    group: 'notifications',
    description: 'HTML emails for workflow automation.',
    pageDescription:
      'Create and manage the HTML emails sent by workflow automation, with dynamic placeholders such as first name and assigned applications. A central library, reusable across events.',
    keywords: ['html', 'placeholder', 'firstName', 'assignedApplications', 'template', 'workflow'],
    implemented: false,
  },
  {
    id: 'notification-routing',
    href: '/iga/configurations/notification-routing',
    title: 'Notification Routing',
    group: 'notifications',
    description: 'Which template each event sends.',
    pageDescription:
      'Maps each governance event (request approved or rejected, certification assigned, provisioning task assigned) to a template, or falls back to the built-in default. Decides which email actually goes out.',
    keywords: ['routing', 'approved', 'rejected', 'certification', 'assigned', 'default'],
    implemented: false,
  },
];

export function getSystemSettingsSection(id: string): SystemSettingsSection | undefined {
  return SYSTEM_SETTINGS_SECTIONS.find((s) => s.id === id);
}
