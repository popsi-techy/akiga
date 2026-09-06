/**
 * Applications that appear on the Directory list.
 *
 * The older Okta / Salesforce / … catalog stays in `seed.ts` so accounts,
 * entitlements, and other modules keep their fixtures. This list is the ten
 * instances of the available application types — one live, one inactive.
 *
 * No import from `seed.ts` — that file concatenates these apps into the catalog.
 */

export const DIRECTORY_LIST_APP_IDS = [
  'app-google-workspace',
  'app-google-workspace-archive',
  'app-scim',
  'app-scim-archive',
  'app-active-directory',
  'app-active-directory-archive',
  'app-adobe',
  'app-adobe-archive',
  'app-entra',
  'app-entra-archive',
] as const;

export type DirectoryListAppId = (typeof DIRECTORY_LIST_APP_IDS)[number];

export const DIRECTORY_LIST_ID_SET: ReadonlySet<string> = new Set(DIRECTORY_LIST_APP_IDS);

/** Seeded lifecycle. Overlay in the applications store can still flip these. */
export const directoryListLifecycle: Record<DirectoryListAppId, 'active' | 'inactive'> = {
  'app-google-workspace': 'active',
  'app-google-workspace-archive': 'inactive',
  'app-scim': 'active',
  'app-scim-archive': 'inactive',
  'app-active-directory': 'active',
  'app-active-directory-archive': 'inactive',
  'app-adobe': 'active',
  'app-adobe-archive': 'inactive',
  'app-entra': 'active',
  'app-entra-archive': 'inactive',
};

type ListProfile = {
  appType: string;
  discoverySource: 'IAM' | 'Direct' | 'PAM';
  authorizationStatus: 'authorized' | 'pending';
  externalProvisioning: 'enabled' | 'disabled';
  provisioningType: 'manual' | 'auto';
};

function profile(
  appType: string,
  discoverySource: ListProfile['discoverySource'],
): ListProfile {
  return {
    appType,
    discoverySource,
    authorizationStatus: 'authorized',
    externalProvisioning: 'enabled',
    provisioningType: 'auto',
  };
}

export const directoryListProfiles: Record<DirectoryListAppId, ListProfile> = {
  'app-google-workspace': profile('Google Workspace', 'Direct'),
  'app-google-workspace-archive': profile('Google Workspace', 'Direct'),
  'app-scim': profile('SCIM Application', 'Direct'),
  'app-scim-archive': profile('SCIM Application', 'Direct'),
  'app-active-directory': profile('Active Directory', 'Direct'),
  'app-active-directory-archive': profile('Active Directory', 'Direct'),
  'app-adobe': profile('Adobe', 'Direct'),
  'app-adobe-archive': profile('Adobe', 'Direct'),
  'app-entra': profile('Microsoft Entra ID', 'IAM'),
  'app-entra-archive': profile('Microsoft Entra ID', 'IAM'),
};

type ListEntitlement = {
  id: string;
  name: string;
  description: string;
  risk: number;
  ownerIds: string[];
};

function pair(
  id: DirectoryListAppId,
  name: string,
  description: string,
  ownerIds: string[],
  entitlements: ListEntitlement[],
) {
  return { id, name, description, ownerIds, entitlements };
}

export const directoryListApps = [
  pair(
    'app-google-workspace',
    'Google Workspace',
    'Email, calendar, and drive for the workforce.',
    ['o-henry'],
    [
      { id: 'ent-gw-user', name: 'User', description: 'Mailbox, calendar, and drive.', risk: 12, ownerIds: ['o-henry'] },
      { id: 'ent-gw-admin', name: 'Super Admin', description: 'Administer users, groups, and org settings.', risk: 88, ownerIds: ['o-henry'] },
    ],
  ),
  pair(
    'app-google-workspace-archive',
    'Google Workspace Archive',
    'Email, calendar, and drive for the workforce.',
    ['o-henry'],
    [
      { id: 'ent-gw-arc-user', name: 'User', description: 'Mailbox, calendar, and drive.', risk: 12, ownerIds: ['o-henry'] },
      { id: 'ent-gw-arc-admin', name: 'Super Admin', description: 'Administer users, groups, and org settings.', risk: 88, ownerIds: ['o-henry'] },
    ],
  ),
  pair(
    'app-scim',
    'SCIM Application',
    'SCIM-provisioned SaaS application.',
    ['o-priya'],
    [
      { id: 'ent-scim-user', name: 'Standard User', description: 'Signed-in access for the application.', risk: 10, ownerIds: ['o-priya'] },
      { id: 'ent-scim-admin', name: 'Application Admin', description: 'Administer users and application settings.', risk: 74, ownerIds: ['o-priya'] },
    ],
  ),
  pair(
    'app-scim-archive',
    'SCIM Application Archive',
    'SCIM-provisioned SaaS application.',
    ['o-priya'],
    [
      { id: 'ent-scim-arc-user', name: 'Standard User', description: 'Signed-in access for the application.', risk: 10, ownerIds: ['o-priya'] },
      { id: 'ent-scim-arc-admin', name: 'Application Admin', description: 'Administer users and application settings.', risk: 74, ownerIds: ['o-priya'] },
    ],
  ),
  pair(
    'app-active-directory',
    'Active Directory',
    'On-premises directory for identities and groups.',
    ['o-marcus'],
    [
      { id: 'ent-ad-user', name: 'Domain User', description: 'Standard domain sign-in.', risk: 14, ownerIds: ['o-marcus'] },
      { id: 'ent-ad-admin', name: 'Domain Admin', description: 'Full administration of the domain.', risk: 94, ownerIds: ['o-marcus'] },
    ],
  ),
  pair(
    'app-active-directory-archive',
    'Active Directory Archive',
    'On-premises directory for identities and groups.',
    ['o-marcus'],
    [
      { id: 'ent-ad-arc-user', name: 'Domain User', description: 'Standard domain sign-in.', risk: 14, ownerIds: ['o-marcus'] },
      { id: 'ent-ad-arc-admin', name: 'Domain Admin', description: 'Full administration of the domain.', risk: 94, ownerIds: ['o-marcus'] },
    ],
  ),
  pair(
    'app-adobe',
    'Adobe',
    'Creative Cloud and Document Cloud for the workforce.',
    ['o-sofia'],
    [
      { id: 'ent-adobe-user', name: 'Creative Cloud User', description: 'Assigned Creative Cloud apps.', risk: 18, ownerIds: ['o-sofia'] },
      { id: 'ent-adobe-admin', name: 'Product Admin', description: 'Administer seats and product profiles.', risk: 70, ownerIds: ['o-sofia'] },
    ],
  ),
  pair(
    'app-adobe-archive',
    'Adobe Archive',
    'Creative Cloud and Document Cloud for the workforce.',
    ['o-sofia'],
    [
      { id: 'ent-adobe-arc-user', name: 'Creative Cloud User', description: 'Assigned Creative Cloud apps.', risk: 18, ownerIds: ['o-sofia'] },
      { id: 'ent-adobe-arc-admin', name: 'Product Admin', description: 'Administer seats and product profiles.', risk: 70, ownerIds: ['o-sofia'] },
    ],
  ),
  pair(
    'app-entra',
    'Microsoft Entra ID',
    'Cloud identity and access management.',
    ['o-catherine'],
    [
      { id: 'ent-entra-user', name: 'User', description: 'Standard cloud identity.', risk: 16, ownerIds: ['o-catherine'] },
      { id: 'ent-entra-admin', name: 'Global Administrator', description: 'Full administration of the tenant.', risk: 96, ownerIds: ['o-catherine'] },
    ],
  ),
  pair(
    'app-entra-archive',
    'Microsoft Entra ID Archive',
    'Cloud identity and access management.',
    ['o-catherine'],
    [
      { id: 'ent-entra-arc-user', name: 'User', description: 'Standard cloud identity.', risk: 16, ownerIds: ['o-catherine'] },
      { id: 'ent-entra-arc-admin', name: 'Global Administrator', description: 'Full administration of the tenant.', risk: 96, ownerIds: ['o-catherine'] },
    ],
  ),
];
