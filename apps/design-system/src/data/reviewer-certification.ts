/**
 * Reviewer-side access certification — ownership verification, then entitlement
 * review. Admin campaign setup lives in `certifications.ts`; this is the inbox
 * a reviewer actually works.
 */
const STORE_KEY = 'iga.reviewer-certification.v1';
const SEED_VERSION = 2;

export type AccountKind = 'service' | 'app';
export type OwnershipDecision = 'mine' | 'not-mine';
export type EntitlementDecision = 'certify' | 'revoke';

export type ReviewAccount = {
  id: string;
  name: string;
  kind: AccountKind;
  status: 'active' | 'inactive';
  applicationId: string;
  applicationName: string;
  lastModified: string;
  ownership: OwnershipDecision | null;
  entitlementName: string;
  entitlementDecision: EntitlementDecision | null;
};

export type ReviewCampaign = {
  id: string;
  name: string;
  reviewerRole: string;
  startsOn: string;
  dueOn: string;
  remainingDays: number;
  accounts: ReviewAccount[];
};

type Store = { version: number; campaign: ReviewCampaign };

const SEED: ReviewCampaign = {
  id: 'cert-vp-q1',
  name: 'VP Quarterly Review – 1',
  reviewerRole: 'Entitlement Owner',
  startsOn: '2026-01-01T00:00:00.000Z',
  dueOn: '2026-04-15T00:00:00.000Z',
  remainingDays: 8,
  accounts: [
    acc('acc-liam', 'Liam Turner', 'app', 'app-okta', 'Okta', 'Super Admin', '2026-08-12T09:14:00.000Z'),
    acc('acc-marcus', 'Marcus Lee', 'service', 'app-salesforce', 'Salesforce', 'System Administrator', '2026-08-08T16:40:00.000Z'),
    acc('acc-frank', 'Frank Wilson', 'app', 'app-github', 'GitHub', 'Org Admin', '2026-07-29T11:02:00.000Z'),
    acc('acc-priya', 'Priya Sharma', 'app', 'app-aws', 'AWS', 'AdministratorAccess', '2026-08-15T08:21:00.000Z'),
    acc('acc-bob', 'Bob Smith', 'service', 'app-workday', 'Workday', 'HR Administrator', '2026-08-03T13:55:00.000Z'),
    acc('acc-nathan', 'Nathan Green', 'app', 'app-servicenow', 'ServiceNow', 'Platform Admin', '2026-07-22T10:18:00.000Z'),
    acc('acc-catherine', 'Catherine Brown', 'app', 'app-sap', 'SAP S/4HANA Finance', 'Payment Release', '2026-08-18T07:44:00.000Z'),
    acc('acc-hana', 'Hana Kim', 'app', 'app-netsuite', 'NetSuite', 'Controller', '2026-08-11T12:08:00.000Z'),
    acc('acc-henry', 'Henry Taylor', 'service', 'app-okta', 'Okta', 'Read-only Admin', '2026-08-09T15:33:00.000Z'),
    acc('acc-grace', 'Grace Lee', 'app', 'app-servicenow', 'ServiceNow', 'Fulfiller', '2026-08-05T09:47:00.000Z'),
    acc('acc-emily', 'Emily Davis', 'app', 'app-workday', 'Workday', 'Employee Self-Service', '2026-08-01T18:12:00.000Z'),
    acc('acc-olivia', 'Olivia Martin', 'app', 'app-snowflake', 'Snowflake', 'Analyst Read', '2026-07-28T14:26:00.000Z'),
    acc('acc-sofia', 'Sofia Rossi', 'app', 'app-github', 'GitHub', 'Write', '2026-07-25T11:03:00.000Z'),
    acc('acc-daniel', 'Daniel White', 'app', 'app-salesforce', 'Salesforce', 'Sales User', '2026-07-19T08:51:00.000Z'),
    acc('acc-arjun', 'Arjun Nair', 'service', 'app-aws', 'AWS', 'ReadOnlyAccess', '2026-07-16T16:09:00.000Z'),
  ],
};

function acc(
  id: string,
  name: string,
  kind: AccountKind,
  applicationId: string,
  applicationName: string,
  entitlementName: string,
  lastModified: string,
): ReviewAccount {
  return {
    id,
    name,
    kind,
    status: 'active',
    applicationId,
    applicationName,
    lastModified,
    ownership: null,
    entitlementName,
    entitlementDecision: null,
  };
}

function readStore(): Store {
  if (typeof window === 'undefined') return { version: SEED_VERSION, campaign: structuredClone(SEED) };
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) {
      const fresh: Store = { version: SEED_VERSION, campaign: structuredClone(SEED) };
      writeStore(fresh);
      return fresh;
    }
    const parsed = JSON.parse(raw) as Store;
    if (!parsed?.campaign || parsed.version !== SEED_VERSION) {
      const fresh: Store = { version: SEED_VERSION, campaign: structuredClone(SEED) };
      writeStore(fresh);
      return fresh;
    }
    return parsed;
  } catch {
    return { version: SEED_VERSION, campaign: structuredClone(SEED) };
  }
}

function writeStore(store: Store): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

export function getReviewCampaign(): ReviewCampaign {
  return readStore().campaign;
}

export function setAccountOwnership(accountId: string, ownership: OwnershipDecision): ReviewCampaign {
  return setManyAccountOwnership([accountId], ownership);
}

export function setManyAccountOwnership(ids: string[], ownership: OwnershipDecision): ReviewCampaign {
  const want = new Set(ids);
  const store = readStore();
  store.campaign = {
    ...store.campaign,
    accounts: store.campaign.accounts.map((a) =>
      want.has(a.id)
        ? {
            ...a,
            ownership,
            entitlementDecision: ownership === 'not-mine' ? null : a.entitlementDecision,
          }
        : a,
    ),
  };
  writeStore(store);
  return store.campaign;
}

export function setEntitlementDecision(accountId: string, decision: EntitlementDecision): ReviewCampaign {
  return setManyEntitlementDecisions([accountId], decision);
}

export function setManyEntitlementDecisions(ids: string[], decision: EntitlementDecision): ReviewCampaign {
  const want = new Set(ids);
  const store = readStore();
  store.campaign = {
    ...store.campaign,
    accounts: store.campaign.accounts.map((a) =>
      want.has(a.id) ? { ...a, entitlementDecision: decision } : a,
    ),
  };
  writeStore(store);
  return store.campaign;
}

export function extendReviewTimeline(extraDays: number): ReviewCampaign {
  const store = readStore();
  const due = new Date(store.campaign.dueOn);
  due.setUTCDate(due.getUTCDate() + extraDays);
  store.campaign = {
    ...store.campaign,
    remainingDays: store.campaign.remainingDays + extraDays,
    dueOn: due.toISOString(),
  };
  writeStore(store);
  return store.campaign;
}

export const ACCOUNT_KIND_LABEL: Record<AccountKind, string> = {
  service: 'Service Account',
  app: 'App Account',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatReviewDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, '0')}, ${d.getUTCFullYear()}`;
}

export function formatReviewDateTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  const hour = h % 12 || 12;
  const ap = h >= 12 ? 'PM' : 'AM';
  return `${formatReviewDate(iso)} ${hour}:${m} ${ap}`;
}

export function verifiedCount(campaign: ReviewCampaign): number {
  return campaign.accounts.filter((a) => a.ownership !== null).length;
}

export function mineAccounts(campaign: ReviewCampaign): ReviewAccount[] {
  return campaign.accounts.filter((a) => a.ownership === 'mine');
}
