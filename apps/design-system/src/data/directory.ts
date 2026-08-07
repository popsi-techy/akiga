/**
 * Directory service — the canonical read model for the seven core IGA entities
 * (User Identity, App Account, Application, Entitlement, Technical Role, Business
 * Role, Governance Group). Reads the seed (source of truth for prototype data);
 * screens depend on these functions, resolving relationships by id with
 * denormalized display fields. One module (not one per entity) so the many
 * cross-references between entities never form an import cycle.
 */
import {
  userIdentities,
  appAccounts,
  catalogApps,
  technicalRoles,
  businessRoles,
  governanceGroups,
  ownerDirectory,
  type SeedUserIdentity,
  type SeedAppAccount,
  type RiskLevel,
  type IdentityStatus,
} from './seed';

// ---- back-compat (consumed by automation approver pickers) ------------
export interface DirUser {
  id: string;
  name: string;
  email: string;
}
export interface GovGroup {
  id: string;
  name: string;
  members: number;
}
export function listUsers(): DirUser[] {
  return ownerDirectory;
}
export function getUser(id: string): DirUser | undefined {
  return ownerDirectory.find((u) => u.id === id);
}
export function listGovernanceGroups(): GovGroup[] {
  return governanceGroups.map((g) => ({ id: g.id, name: g.name, members: g.members }));
}
export function getGovernanceGroup(id: string): GovGroup | undefined {
  const g = governanceGroups.find((x) => x.id === id);
  return g ? { id: g.id, name: g.name, members: g.members } : undefined;
}

// ---- id → entity lookups ---------------------------------------------
const identityById = new Map(userIdentities.map((u) => [u.id, u]));
const accountById = new Map(appAccounts.map((a) => [a.id, a]));
const appById = new Map(catalogApps.map((a) => [a.id, a]));
const techRoleById = new Map(technicalRoles.map((r) => [r.id, r]));
const bizRoleById = new Map(businessRoles.map((r) => [r.id, r]));
const govGroupById = new Map(governanceGroups.map((g) => [g.id, g]));

/** Flattened entitlement catalog with its owning application denormalized. */
interface FlatEntitlement {
  id: string;
  name: string;
  description: string;
  risk: number;
  ownerIds: string[];
  applicationId: string;
  applicationName: string;
}
const flatEntitlements: FlatEntitlement[] = catalogApps.flatMap((app) =>
  app.entitlements.map((e) => ({ ...e, applicationId: app.id, applicationName: app.name })),
);
const entById = new Map(flatEntitlements.map((e) => [e.id, e]));

// ---- row projections (list tables) -----------------------------------
export interface UserIdentityRow {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  department: string;
  status: IdentityStatus;
  riskScore: number;
  riskLevel: RiskLevel;
}
export interface AppAccountRow {
  id: string;
  accountName: string;
  email: string;
  applicationId: string;
  applicationName: string;
  identityId: string | null;
  identityName: string | null;
  orphan: boolean;
}
export interface ApplicationRow {
  id: string;
  name: string;
  description: string;
  ownerCount: number;
  accountCount: number;
  entitlementCount: number;
}
export interface EntitlementRow {
  id: string;
  name: string;
  description: string;
  applicationId: string;
  applicationName: string;
  risk: number;
}
export interface RoleRow {
  id: string;
  name: string;
  description: string;
  risk: number;
}
export interface GovernanceGroupRow {
  id: string;
  name: string;
  description: string;
  reviewerCount: number;
}

const toUserRow = (u: SeedUserIdentity): UserIdentityRow => ({ ...u });
const toAccountRow = (a: SeedAppAccount): AppAccountRow => ({
  id: a.id,
  accountName: a.accountName,
  email: a.email,
  applicationId: a.applicationId,
  applicationName: appById.get(a.applicationId)?.name ?? a.applicationId,
  identityId: a.identityId,
  identityName: a.identityId ? identityById.get(a.identityId)?.name ?? null : null,
  orphan: a.identityId === null,
});
const toEntRow = (e: FlatEntitlement): EntitlementRow => ({
  id: e.id,
  name: e.name,
  description: e.description,
  applicationId: e.applicationId,
  applicationName: e.applicationName,
  risk: e.risk,
});

// ---- resolvers -------------------------------------------------------
/** Owner/reviewer ids → User Identity rows (skips unknown ids). */
export function resolvePeople(ids: string[]): UserIdentityRow[] {
  return ids.map((id) => identityById.get(id)).filter(Boolean).map((u) => toUserRow(u as SeedUserIdentity));
}
export function resolveEntitlements(ids: string[]): EntitlementRow[] {
  return ids.map((id) => entById.get(id)).filter(Boolean).map((e) => toEntRow(e as FlatEntitlement));
}

// ---- User Identity ---------------------------------------------------
export function listUserIdentities(): UserIdentityRow[] {
  return userIdentities.map(toUserRow);
}
export function getUserIdentityDetail(id: string) {
  const identity = identityById.get(id);
  if (!identity) return null;
  const accounts = appAccounts.filter((a) => a.identityId === id).map(toAccountRow);
  const technicalRolesFor = technicalRoles.filter((r) => r.memberIds.includes(id)).map(toRoleRow);
  const businessRolesFor = businessRoles.filter((r) => r.memberIds.includes(id)).map(toRoleRow);
  return { identity, accounts, technicalRoles: technicalRolesFor, businessRoles: businessRolesFor };
}

// ---- App Account -----------------------------------------------------
export function listAppAccounts(): AppAccountRow[] {
  return appAccounts.map(toAccountRow);
}
export function getAppAccountDetail(id: string) {
  const account = accountById.get(id);
  if (!account) return null;
  return {
    account,
    applicationName: appById.get(account.applicationId)?.name ?? account.applicationId,
    identityName: account.identityId ? identityById.get(account.identityId)?.name ?? null : null,
    entitlements: resolveEntitlements(account.entitlementIds),
  };
}

// ---- Application -----------------------------------------------------
export function listApplications(): ApplicationRow[] {
  return catalogApps.map((app) => ({
    id: app.id,
    name: app.name,
    description: app.description,
    ownerCount: app.ownerIds.length,
    accountCount: appAccounts.filter((a) => a.applicationId === app.id).length,
    entitlementCount: app.entitlements.length,
  }));
}
export function getApplicationDetail(id: string) {
  const app = appById.get(id);
  if (!app) return null;
  return {
    app,
    accounts: appAccounts.filter((a) => a.applicationId === id).map(toAccountRow),
    entitlements: app.entitlements.map((e) => toEntRow({ ...e, applicationId: app.id, applicationName: app.name })),
  };
}

// ---- Entitlement -----------------------------------------------------
export function listEntitlementRows(): EntitlementRow[] {
  return flatEntitlements.map(toEntRow);
}
export function getEntitlementDetail(id: string) {
  const ent = entById.get(id);
  if (!ent) return null;
  return {
    entitlement: ent,
    accounts: appAccounts.filter((a) => a.entitlementIds.includes(id)).map(toAccountRow),
    technicalRoles: technicalRoles.filter((r) => r.entitlementIds.includes(id)).map(toRoleRow),
    businessRoles: businessRoles.filter((r) => r.entitlementIds.includes(id)).map(toRoleRow),
  };
}

// ---- Technical Role --------------------------------------------------
const toRoleRow = (r: { id: string; name: string; description: string; risk: number }): RoleRow => ({
  id: r.id,
  name: r.name,
  description: r.description,
  risk: r.risk,
});
export function listTechnicalRoleRows(): RoleRow[] {
  return technicalRoles.map(toRoleRow);
}
export function getTechnicalRoleDetail(id: string) {
  const role = techRoleById.get(id);
  if (!role) return null;
  return {
    role,
    members: resolvePeople(role.memberIds),
    entitlements: resolveEntitlements(role.entitlementIds),
  };
}

// ---- Business Role ---------------------------------------------------
export function listBusinessRoleRows(): RoleRow[] {
  return businessRoles.map(toRoleRow);
}
export function getBusinessRoleDetail(id: string) {
  const role = bizRoleById.get(id);
  if (!role) return null;
  return {
    role,
    members: resolvePeople(role.memberIds),
    technicalRoles: role.technicalRoleIds.map((tid) => techRoleById.get(tid)).filter(Boolean).map((r) => toRoleRow(r!)),
    entitlements: resolveEntitlements(role.entitlementIds),
  };
}

// ---- Governance Group ------------------------------------------------
export function listGovernanceGroupRows(): GovernanceGroupRow[] {
  return governanceGroups.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    reviewerCount: g.reviewerIds.length,
  }));
}
export function getGovernanceGroupDetail(id: string) {
  const group = govGroupById.get(id);
  if (!group) return null;
  return {
    group,
    reviewers: resolvePeople(group.reviewerIds),
    ownedApplications: group.ownedApplicationIds.map((aid) => appById.get(aid)).filter(Boolean).map((a) => ({
      id: a!.id, name: a!.name, description: a!.description, ownerCount: a!.ownerIds.length,
      accountCount: appAccounts.filter((x) => x.applicationId === a!.id).length, entitlementCount: a!.entitlements.length,
    })) as ApplicationRow[],
    ownedEntitlements: resolveEntitlements(group.ownedEntitlementIds),
    ownedTechnicalRoles: group.ownedTechnicalRoleIds.map((tid) => techRoleById.get(tid)).filter(Boolean).map((r) => toRoleRow(r!)),
    ownedBusinessRoles: group.ownedBusinessRoleIds.map((bid) => bizRoleById.get(bid)).filter(Boolean).map((r) => toRoleRow(r!)),
  };
}
