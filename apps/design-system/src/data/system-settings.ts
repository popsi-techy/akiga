/**
 * Tenant-wide System Settings — MFA, access-request defaults, and micro
 * certifications.
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
export type MfaMethod = 'email-otp';

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

/** Tenant clock and geography — shown on the System Settings hub, not edited there. */
export interface TenantLocale {
  timezoneId: string;
  /** Human label, e.g. "(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi". */
  timezoneDisplay: string;
  region: string;
}

export interface SystemSettings {
  mfa: MfaSettings;
  accessRequest: AccessRequestSettings;
  microCertification: MicroCertificationSettings;
  locale: TenantLocale;
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
    methods: ['email-otp'],
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

export function timezoneLabel(value: string): string {
  return SYSTEM_SETTING_TIMEZONES.find((z) => z.value === value)?.label ?? value;
}
