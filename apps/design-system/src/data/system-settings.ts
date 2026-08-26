/**
 * Tenant-wide System Settings — MFA, access-request defaults, micro
 * certifications, locale, and related admin configuration.
 *
 * Screens call these functions. Persistence is session memory in this module
 * (hydrated from localStorage when a window exists), same contract as the other
 * admin stores: a future API is a swap behind this file, not a rewrite of the page.
 */

export const SYSTEM_SETTING_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'America/New_York (ET)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PT)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
] as const;

export type OnBehalfWho = 'anyone' | 'managers' | 'governance-teams';
export type MfaMethod = 'email-otp' | 'authenticator' | 'sms-otp';

export const MFA_METHOD_LABELS: Record<MfaMethod, string> = {
  'email-otp': 'Email OTP',
  authenticator: 'Authenticator',
  'sms-otp': 'SMS OTP',
};

export interface MfaSettings {
  /** Tenant-wide switch. Role cards below still apply when this is off. */
  enforceForAllUsers: boolean;
  endUserEnabled: boolean;
  reviewerEnabled: boolean;
  methods: MfaMethod[];
}

export interface AccessRequestGeneralSettings {
  onBehalfEnabled: boolean;
  onBehalfWho: OnBehalfWho;
}

export interface AccessRequestEntitySettings {
  requestable: boolean;
  /** Omit on entitlements — they are requested one at a time. */
  maxItemsPerRequest?: number;
  approvalPolicyId: string;
  approvalPolicyName: string;
}

export interface AccessRequestNotificationSettings {
  emailTemplateId: string;
}

export interface AccessRequestSettings {
  general: AccessRequestGeneralSettings;
  application: AccessRequestEntitySettings;
  entitlement: AccessRequestEntitySettings;
  role: AccessRequestEntitySettings;
  notification: AccessRequestNotificationSettings;
}

export interface MicroCertificationSettings {
  enabled: boolean;
  timezone: string;
  /** 24-hour `HH:MM`. */
  time: string;
}

export type MicroCertDisableAction = 'create-and-disable' | 'delete-pending';

/** Events waiting to become micro certifications — shown when turning the job off. */
export const MICRO_CERT_PENDING_EVENTS = 2175;

/** ISO 3166-1 alpha-2. Applied at provisioning when the user has no usage location. */
export const ISO_USAGE_LOCATION = /^[A-Z]{2}$/;

export function normalizeUsageLocation(raw: string): string {
  return raw.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase();
}

/** Tenant clock, geography, and the default usage location applied at provisioning. */
export interface TenantLocale {
  timezoneId: string;
  /** Human label, e.g. "(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi". */
  timezoneDisplay: string;
  region: string;
  /** ISO 3166-1 alpha-2. Applied to users who do not already have a usage location. */
  usageLocation: string;
}

export type SsoOauthProvider = 'miniorange' | 'okta' | 'entra' | 'custom';

export const SSO_OAUTH_PROVIDERS: { value: SsoOauthProvider; label: string }[] = [
  { value: 'miniorange', label: 'miniOrange' },
  { value: 'okta', label: 'Okta' },
  { value: 'entra', label: 'Microsoft Entra ID' },
  { value: 'custom', label: 'Custom' },
];

export interface SsoOauthSettings {
  configurationName: string;
  provider: SsoOauthProvider;
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  redirectUri: string;
  grantType: string;
  idpRsaPublicKey: string;
}

export type RoleMiningFrequency = 'weekly' | 'monthly' | 'quarterly';

export const ROLE_MINING_FREQUENCIES: { value: RoleMiningFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
];

export interface RoleMiningSettings {
  enabled: boolean;
  appLevelEnabled: boolean;
  appLevelFrequency: RoleMiningFrequency;
  tenantLevelEnabled: boolean;
  tenantLevelFrequency: RoleMiningFrequency;
  minCoveragePercent: number;
  minEntitlementsPerRole: number;
  minAccountsPerRole: number;
}

export interface ProvisioningTaskSettings {
  /** When on, an admin cannot complete a manual grant or removal without attaching evidence. */
  requireEvidence: boolean;
}

export interface SystemSettings {
  mfa: MfaSettings;
  accessRequest: AccessRequestSettings;
  microCertification: MicroCertificationSettings;
  locale: TenantLocale;
  ssoOauth: SsoOauthSettings;
  roleMining: RoleMiningSettings;
  provisioningTask: ProvisioningTaskSettings;
}

export const EMAIL_TEMPLATE_OPTIONS = [
  { value: 'approval-complete-default', label: 'Approval completion (default)' },
  { value: 'approval-complete-compact', label: 'Approval completion (compact)' },
  { value: 'test', label: 'test' },
] as const;

export const ON_BEHALF_OPTIONS: { value: OnBehalfWho; label: string }[] = [
  { value: 'anyone', label: 'Anyone' },
  { value: 'managers', label: 'Managers only' },
  { value: 'governance-teams', label: 'Governance teams' },
];

const STORE_KEY = 'iga.systemSettings.v2';

const DEFAULTS: SystemSettings = {
  mfa: {
    enforceForAllUsers: false,
    endUserEnabled: false,
    reviewerEnabled: false,
    methods: ['email-otp', 'authenticator', 'sms-otp'],
  },
  accessRequest: {
    general: { onBehalfEnabled: true, onBehalfWho: 'anyone' },
    application: {
      requestable: true,
      maxItemsPerRequest: 100,
      approvalPolicyId: 'ap-default',
      approvalPolicyName: 'Approval',
    },
    entitlement: {
      requestable: true,
      approvalPolicyId: 'ap-default',
      approvalPolicyName: 'Approval',
    },
    role: {
      requestable: true,
      maxItemsPerRequest: 10,
      approvalPolicyId: 'ap-default',
      approvalPolicyName: 'Approval',
    },
    notification: { emailTemplateId: 'approval-complete-default' },
  },
  microCertification: {
    enabled: true,
    timezone: 'Asia/Kolkata',
    time: '12:58',
  },
  locale: {
    timezoneId: 'Asia/Kolkata',
    timezoneDisplay: '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi',
    region: 'India',
    usageLocation: 'US',
  },
  ssoOauth: {
    configurationName: '',
    provider: 'miniorange',
    clientId: '',
    clientSecret: '',
    authorizationUrl: 'https://<your-host>/moas/idp/openidso',
    tokenUrl: 'https://<your-host>/moas/rest/oauth/token',
    userInfoUrl: 'https://<your-host>/moas/rest/oauth/getuserinfo',
    redirectUri: 'https://test.miniorange.in/iga/ssoOauth/7fb0059f-a3b9-44f2-8d4d-cb7eafd81286',
    grantType: 'authorization_code',
    idpRsaPublicKey: '',
  },
  roleMining: {
    enabled: true,
    appLevelEnabled: true,
    appLevelFrequency: 'monthly',
    tenantLevelEnabled: true,
    tenantLevelFrequency: 'quarterly',
    minCoveragePercent: 74,
    minEntitlementsPerRole: 3,
    minAccountsPerRole: 4,
  },
  provisioningTask: {
    requireEvidence: false,
  },
};

const hasWindow = () => typeof window !== 'undefined';

function readStore(): SystemSettings {
  if (!hasWindow()) return structuredClone(DEFAULTS);
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const parsed = JSON.parse(raw) as Partial<SystemSettings>;
    return {
      mfa: { ...DEFAULTS.mfa, ...parsed.mfa },
      accessRequest: {
        general: { ...DEFAULTS.accessRequest.general, ...parsed.accessRequest?.general },
        application: { ...DEFAULTS.accessRequest.application, ...parsed.accessRequest?.application },
        entitlement: { ...DEFAULTS.accessRequest.entitlement, ...parsed.accessRequest?.entitlement },
        role: { ...DEFAULTS.accessRequest.role, ...parsed.accessRequest?.role },
        notification: { ...DEFAULTS.accessRequest.notification, ...parsed.accessRequest?.notification },
      },
      microCertification: { ...DEFAULTS.microCertification, ...parsed.microCertification },
      locale: { ...DEFAULTS.locale, ...parsed.locale },
      ssoOauth: { ...DEFAULTS.ssoOauth, ...parsed.ssoOauth },
      roleMining: { ...DEFAULTS.roleMining, ...parsed.roleMining },
      provisioningTask: { ...DEFAULTS.provisioningTask, ...parsed.provisioningTask },
    };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

function writeStore(next: SystemSettings): SystemSettings {
  if (hasWindow()) {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota */
    }
  }
  return next;
}

export function getSystemSettings(): SystemSettings {
  return readStore();
}

export function saveMfaSettings(next: MfaSettings): MfaSettings {
  const all = readStore();
  return writeStore({ ...all, mfa: next }).mfa;
}

export function saveAccessRequestSettings(next: AccessRequestSettings): AccessRequestSettings {
  const all = readStore();
  return writeStore({ ...all, accessRequest: next }).accessRequest;
}

export function saveMicroCertificationSettings(
  next: MicroCertificationSettings,
): MicroCertificationSettings {
  const all = readStore();
  return writeStore({ ...all, microCertification: next }).microCertification;
}

export function saveSsoOauthSettings(next: SsoOauthSettings): SsoOauthSettings {
  const all = readStore();
  return writeStore({ ...all, ssoOauth: next }).ssoOauth;
}

export function saveRoleMiningSettings(next: RoleMiningSettings): RoleMiningSettings {
  const all = readStore();
  return writeStore({ ...all, roleMining: next }).roleMining;
}

export function saveProvisioningTaskSettings(
  next: ProvisioningTaskSettings,
): ProvisioningTaskSettings {
  const all = readStore();
  return writeStore({ ...all, provisioningTask: next }).provisioningTask;
}

export function saveLocaleSettings(next: TenantLocale): TenantLocale {
  const all = readStore();
  return writeStore({ ...all, locale: next }).locale;
}

export function timezoneLabel(value: string): string {
  return SYSTEM_SETTING_TIMEZONES.find((z) => z.value === value)?.label ?? value;
}
