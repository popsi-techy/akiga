/**
 * Access View service — the read model behind the Access View explorer.
 *
 * Nothing new is seeded: every level is derived from `appAccounts`, which already
 * links an identity to an application and carries that account's entitlement
 * grants. That is what makes the four-level path answerable —
 *
 *   User Identity → Applications → Accounts → Entitlements
 *
 * — and why entitlements are read from the *account*, not the application: the
 * question is what this user actually holds, not what the app could grant.
 */
import { userIdentities, appAccounts, catalogApps } from './seed';
import { riskTier } from '@/lib/risk';

export type AccessPath = 'application' | 'role';

/** One row in a column of the explorer. */
export interface AccessItem {
  id: string;
  label: string;
  /** Secondary line — email, account name, or application. */
  sublabel?: string;
  /** Searchable but undisplayed text, e.g. job title and department. */
  keywords?: string;
  /** 0–100 Risk Score, where the entity carries one. */
  risk?: number;
  /** How many children this item has one level down. */
  count?: number;
  /**
   * Richer detail for presentations with room for it — the graph's subject card
   * shows the caption and tags, while a quarter-width list row cannot.
   */
  caption?: string;
  tags?: string[];
}

/** Headline counts for one identity, shown beside the selection trail. */
export interface AccessSummary {
  applications: number;
  entitlements: number;
  /** Entitlements in the High or Critical tier — the ones worth a second look. */
  highRisk: number;
}

const appById = new Map(catalogApps.map((a) => [a.id, a]));

/** Level 1 — every identity, the entry point of the path. */
export function listAccessIdentities(): AccessItem[] {
  const appsByIdentity = new Map<string, Set<string>>();
  for (const a of appAccounts) {
    if (!a.identityId) continue;
    const set = appsByIdentity.get(a.identityId) ?? new Set<string>();
    set.add(a.applicationId);
    appsByIdentity.set(a.identityId, set);
  }
  // Job title and department are searchable but not shown: "who in Finance has AWS"
  // is a normal question, and the row has no width for a third line.
  return userIdentities.map((u) => ({
    id: u.id,
    label: u.name,
    sublabel: u.email,
    keywords: `${u.jobTitle} ${u.department}`,
    risk: u.riskScore,
    count: appsByIdentity.get(u.id)?.size ?? 0,
    caption: u.jobTitle,
    tags: [u.department],
  }));
}

/**
 * Level 2 — applications this identity holds an account in. Derived from their
 * accounts, so an app the user has no account in never appears.
 */
export function listAccessApplications(identityId: string): AccessItem[] {
  const appIds = new Set(
    appAccounts.filter((a) => a.identityId === identityId).map((a) => a.applicationId),
  );
  return [...appIds]
    .map((id) => {
      const app = appById.get(id);
      const accounts = appAccounts.filter((a) => a.identityId === identityId && a.applicationId === id);
      return {
        id,
        label: app?.name ?? id,
        sublabel: `${accounts.length} account${accounts.length === 1 ? '' : 's'}`,
        keywords: app?.description,
        // Entitlements reachable through this app, so the count answers "how much
        // access is behind this card" rather than restating the accounts line.
        count: accounts.reduce((sum, a) => sum + a.entitlementIds.length, 0),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Level 3 — this identity's accounts within one application (often exactly one). */
export function listAccessAccounts(identityId: string, applicationId: string): AccessItem[] {
  return appAccounts
    .filter((a) => a.identityId === identityId && a.applicationId === applicationId)
    // The account name leads, not the email: the email repeats the identity one
    // level up, while the account name is how this app actually knows the user.
    .map((a) => ({ id: a.id, label: a.accountName, sublabel: a.email, count: a.entitlementIds.length }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Level 4 — entitlements granted to one account. Leaf of the path. */
export function listAccessEntitlements(accountId: string): AccessItem[] {
  const account = appAccounts.find((a) => a.id === accountId);
  if (!account) return [];
  const app = appById.get(account.applicationId);
  const entById = new Map((app?.entitlements ?? []).map((e) => [e.id, e]));
  return account.entitlementIds
    .map((id) => {
      const ent = entById.get(id);
      return {
        id,
        label: ent?.name ?? id,
        sublabel: ent?.description,
        risk: ent?.risk,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Totals across everything one identity holds. Entitlements are counted per grant,
 * not deduplicated by id: the same entitlement held through two accounts is two
 * pieces of access to review, and collapsing them would understate the exposure.
 */
export function accessSummary(identityId: string): AccessSummary {
  const accounts = appAccounts.filter((a) => a.identityId === identityId);
  const apps = new Set(accounts.map((a) => a.applicationId));
  let entitlements = 0;
  let highRisk = 0;
  for (const account of accounts) {
    const byId = new Map((appById.get(account.applicationId)?.entitlements ?? []).map((e) => [e.id, e]));
    for (const id of account.entitlementIds) {
      entitlements += 1;
      const tier = riskTier(byId.get(id)?.risk ?? 0);
      if (tier === 'high' || tier === 'critical') highRisk += 1;
    }
  }
  return { applications: apps.size, entitlements, highRisk };
}

/** Display label for a selected id, for the selection trail. */
export function accessLabel(kind: 'identity' | 'application' | 'account', id: string): string {
  if (kind === 'identity') return userIdentities.find((u) => u.id === id)?.name ?? id;
  if (kind === 'application') return appById.get(id)?.name ?? id;
  return appAccounts.find((a) => a.id === id)?.accountName ?? id;
}
