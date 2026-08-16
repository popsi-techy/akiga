/**
 * Governance Model service — the one read model behind both views.
 *
 * The Governance Map and the Governance Explorer are two renderings of what this
 * module returns; neither owns any governance logic of its own. That is what makes
 * switching views lossless: the selection, the filters and the risk context all
 * refer to the same entity and relationship ids.
 *
 * Composition:
 *   entities      = Directory seed (applications, roles, people…) + governance seed
 *   relationships = derived from the ids the two seeds already cross-reference
 *   findings      = derived from the model, not hand-written — a gap exists because
 *                   the data says so, so it cannot drift from what the screen shows
 *
 * Everything is computed once at module load and is pure: no storage, no network,
 * no clock. A real API replaces the two seed imports and nothing else changes.
 */
import {
  catalogApps,
  technicalRoles,
  businessRoles,
  governanceTeams,
  userIdentities,
  appAccounts,
  approvalPolicySeed,
} from './seed';
import { sodPolicies } from './sod-seed';
import {
  AS_OF,
  DEPARTMENT_BY_NAME,
  PERSON_LOCATION,
  applicationGovernance,
  approvalPolicyGovernance,
  govApprovalHierarchies,
  govApprovalWorkflows,
  govBirthrightPolicies,
  govDelegations,
  govDepartments,
  govEscalationRules,
  govGovernanceRoles,
  govLocations,
  roleScope,
  sodPolicyGovernance,
} from './governance-seed';
import {
  DOMAIN_OF,
  KIND_LABEL,
  LAYER_OF,
  LAYER_ORDER,
  type GovApprovalHierarchy,
  type GovDelegation,
  type GovDomain,
  type GovEntity,
  type GovEntityKind,
  type GovEscalationRule,
  type GovFinding,
  type GovFindingKind,
  type GovHealthMetric,
  type GovLayer,
  type GovMetric,
  type GovRelationship,
  type GovRelationType,
} from './governance-types';
import { riskTier, type RiskTier } from '@/lib/risk';

/* ------------------------------------------------------------------ *
 * Entity construction
 * ------------------------------------------------------------------ */

const entities: GovEntity[] = [];
const push = (e: GovEntity) => {
  entities.push(e);
  return e;
};

/** Defaults so each builder below only states what is true of its own kind. */
const base = (init: Partial<GovEntity> & Pick<GovEntity, 'id' | 'kind' | 'name'>): GovEntity => ({
  description: '',
  risk: 0,
  status: 'active',
  metrics: [],
  departmentIds: [],
  locationIds: [],
  ownerIds: [],
  reviewOwnerIds: [],
  approvalOwnerIds: [],
  governanceRoleIds: [],
  updatedAt: AS_OF,
  updatedBy: 'o-marcus',
  ...init,
});

const flatEntitlements = catalogApps.flatMap((app) =>
  app.entitlements.map((e) => ({ ...e, applicationId: app.id, applicationName: app.name })),
);

// ---- people ----------------------------------------------------------
for (const u of userIdentities) {
  const accounts = appAccounts.filter((a) => a.identityId === u.id);
  push(
    base({
      id: u.id,
      kind: 'person',
      name: u.name,
      description: `${u.jobTitle} · ${u.department}`,
      risk: u.riskScore,
      status: u.status === 'active' ? 'active' : 'inactive',
      departmentIds: [DEPARTMENT_BY_NAME[u.department]].filter(Boolean),
      locationIds: [PERSON_LOCATION[u.id]].filter(Boolean),
      metrics: [
        { label: 'Accounts', value: accounts.length },
        { label: 'Job title', value: u.jobTitle },
      ],
      updatedBy: u.id,
    }),
  );
}

// ---- organization ----------------------------------------------------
for (const l of govLocations) {
  push(
    base({
      id: l.id,
      kind: 'location',
      name: l.name,
      description: l.note,
      risk: 0,
      locationIds: [l.id],
      metrics: [
        { label: 'Site', value: l.site },
        { label: 'People', value: l.headcount },
      ],
    }),
  );
}

for (const d of govDepartments) {
  push(
    base({
      id: d.id,
      kind: 'department',
      name: d.name,
      description: d.description,
      risk: d.risk,
      departmentIds: [d.id],
      locationIds: d.locationIds,
      ownerIds: [d.headId],
      metrics: [
        { label: 'People', value: d.headcount },
        { label: 'Locations', value: d.locationIds.length },
      ],
    }),
  );
}

// ---- roles -----------------------------------------------------------
for (const r of businessRoles) {
  const scope = roleScope[r.id];
  push(
    base({
      id: r.id,
      kind: 'business-role',
      name: r.name,
      description: r.description,
      risk: r.risk,
      departmentIds: scope?.departmentIds ?? [],
      locationIds: scope?.locationIds ?? [],
      ownerIds: r.ownerIds,
      metrics: [
        { label: 'Users', value: scope?.userCount ?? r.memberIds.length },
        { label: 'Technical roles', value: r.technicalRoleIds.length },
      ],
    }),
  );
}

for (const r of technicalRoles) {
  const scope = roleScope[r.id];
  push(
    base({
      id: r.id,
      kind: 'technical-role',
      name: r.name,
      description: r.description,
      risk: r.risk,
      departmentIds: scope?.departmentIds ?? [],
      locationIds: scope?.locationIds ?? [],
      ownerIds: r.ownerIds,
      metrics: [
        { label: 'Users', value: scope?.userCount ?? r.memberIds.length },
        { label: 'Entitlements', value: r.entitlementIds.length },
      ],
    }),
  );
}

// ---- access ----------------------------------------------------------
for (const app of catalogApps) {
  const g = applicationGovernance[app.id];
  const policies = Object.values(approvalPolicyGovernance).filter((p) => p.applicationIds.includes(app.id)).length;
  const sod = Object.values(sodPolicyGovernance).filter((p) => p.applicationIds.includes(app.id)).length;
  push(
    base({
      id: app.id,
      kind: 'application',
      name: app.name,
      description: app.description,
      risk: g?.risk ?? 0,
      departmentIds: g?.departmentIds ?? [],
      locationIds: g?.locationIds ?? [],
      ownerIds: app.ownerIds,
      reviewOwnerIds: g?.reviewOwnerIds ?? [],
      approvalOwnerIds: g?.approvalOwnerIds ?? [],
      governanceRoleIds: g?.governanceRoleIds ?? [],
      metrics: [
        { label: 'Connected policies', value: policies + sod },
        { label: 'Users', value: g?.userCount ?? 0 },
        { label: 'Entitlements', value: app.entitlements.length },
      ],
    }),
  );
}

for (const e of flatEntitlements) {
  const g = applicationGovernance[e.applicationId];
  push(
    base({
      id: e.id,
      kind: 'entitlement',
      name: e.name,
      description: e.description,
      risk: e.risk,
      departmentIds: g?.departmentIds ?? [],
      locationIds: g?.locationIds ?? [],
      ownerIds: e.ownerIds,
      reviewOwnerIds: g?.reviewOwnerIds ?? [],
      metrics: [
        { label: 'Application', value: e.applicationName },
        { label: 'Accounts', value: appAccounts.filter((a) => a.entitlementIds.includes(e.id)).length },
      ],
    }),
  );
}

// ---- governance controls ---------------------------------------------
for (const p of govBirthrightPolicies) {
  push(
    base({
      id: p.id,
      kind: 'birthright-policy',
      name: p.name,
      description: p.description,
      risk: p.risk,
      status: p.status,
      departmentIds: p.departmentIds,
      locationIds: p.locationIds,
      ownerIds: p.ownerIds,
      metrics: [
        { label: 'Grants', value: p.grantsEntitlementIds.length },
        { label: 'Users covered', value: p.usersCovered },
      ],
      updatedAt: p.updatedAt,
      updatedBy: p.updatedBy,
    }),
  );
}

for (const p of approvalPolicySeed) {
  const g = approvalPolicyGovernance[p.id];
  const hierarchy = govApprovalHierarchies.find((h) => h.id === g?.hierarchyId);
  push(
    base({
      id: p.id,
      kind: 'approval-policy',
      name: p.policyName,
      description: p.description,
      risk: g?.risk ?? 0,
      status: p.status === 'active' ? 'active' : 'draft',
      ownerIds: g?.ownerIds ?? [],
      metrics: [
        { label: 'Approval levels', value: hierarchy?.levels.length ?? 0 },
        { label: 'Applications', value: g?.applicationIds.length ?? 0 },
        { label: 'Requests / quarter', value: g?.requestsPerQuarter ?? 0 },
      ],
      updatedAt: p.updatedAt.slice(0, 10),
      updatedBy: g?.updatedBy ?? 'o-marcus',
    }),
  );
}

for (const w of govApprovalWorkflows) {
  push(
    base({
      id: w.id,
      kind: 'approval-workflow',
      name: w.name,
      description: w.description,
      risk: w.risk,
      status: w.status,
      ownerIds: w.ownerIds,
      metrics: [
        { label: 'Steps', value: w.steps },
        { label: 'Runs / quarter', value: w.runsPerQuarter },
      ],
      updatedAt: w.updatedAt,
      updatedBy: w.updatedBy,
    }),
  );
}

for (const p of sodPolicies) {
  const g = sodPolicyGovernance[p.id];
  push(
    base({
      id: p.id,
      kind: 'sod-policy',
      name: p.name,
      description: p.description,
      risk: g?.risk ?? 0,
      departmentIds: g?.departmentIds ?? [],
      locationIds: g?.locationIds ?? [],
      ownerIds: g?.ownerIds ?? [],
      governanceRoleIds: g?.governanceRoleIds ?? [],
      metrics: [
        { label: 'Open violations', value: g?.openViolations ?? 0 },
        { label: 'Users affected', value: g?.usersAffected ?? 0 },
        { label: 'Applications', value: g?.applicationIds.length ?? 0 },
      ],
      updatedAt: g?.updatedAt ?? AS_OF,
      updatedBy: g?.ownerIds[0] ?? 'o-catherine',
    }),
  );
}

// ---- approval chain --------------------------------------------------
const personName = (id: string) => userIdentities.find((u) => u.id === id)?.name ?? id;

for (const d of govDelegations) {
  push(
    base({
      id: d.id,
      kind: 'delegation',
      name: `${personName(d.fromId)} → ${personName(d.toId)}`,
      description: `Approval authority for ${d.scope.toLowerCase()}, delegated by ${personName(d.fromId)}.`,
      // A delegation with no end date is riskier than a lapsed one: it never returns.
      risk: d.validUntil === null ? 72 : d.status === 'expired' ? 58 : 26,
      status: d.status === 'expired' ? 'expired' : 'active',
      ownerIds: [d.fromId],
      metrics: [
        { label: 'Scope', value: d.scope },
        { label: 'Valid until', value: d.validUntil ?? 'No end date' },
      ],
    }),
  );
}

for (const r of govEscalationRules) {
  const unassigned = r.levels.filter((l) => l.approverId === null).length;
  push(
    base({
      id: r.id,
      kind: 'escalation-rule',
      name: r.name,
      description:
        unassigned > 0
          ? 'Escalation path with an unassigned level — requests can stall here.'
          : `Escalates through ${r.levels.length} level${r.levels.length === 1 ? '' : 's'} when a decision is not made in time.`,
      risk: unassigned > 0 ? 64 : r.terminalAction === 'none' ? 48 : 24,
      metrics: [
        { label: 'Levels', value: r.levels.length },
        { label: 'First timeout', value: `${r.levels[0]?.afterHours ?? 0}h` },
      ],
    }),
  );
}

// ---- responsibility --------------------------------------------------
for (const r of govGovernanceRoles) {
  const team = governanceTeams.find((g) => g.id === r.governanceTeamId);
  push(
    base({
      id: r.id,
      kind: 'governance-role',
      name: r.name,
      description: r.description,
      risk: r.risk,
      metrics: [
        { label: 'Holders', value: team?.reviewerIds.length ?? 0 },
        { label: 'Governance team', value: team?.name ?? '—' },
      ],
    }),
  );
}

const entityById = new Map(entities.map((e) => [e.id, e]));

/* ------------------------------------------------------------------ *
 * Relationship construction
 * ------------------------------------------------------------------ */

const relationships: GovRelationship[] = [];
let relSeq = 0;

/** Adds a relationship, skipping any edge whose endpoints are not both modelled. */
function link(
  source: string,
  target: string,
  type: GovRelationType,
  init: Partial<Omit<GovRelationship, 'id' | 'source' | 'target' | 'type'>> = {},
): void {
  if (!entityById.has(source) || !entityById.has(target) || source === target) return;
  relationships.push({
    id: `rel-${++relSeq}`,
    source,
    target,
    type,
    scope: init.scope ?? 'Organization-wide',
    effective: init.effective ?? 'active',
    riskNote: init.riskNote,
    updatedAt: init.updatedAt ?? entityById.get(source)?.updatedAt ?? AS_OF,
    ownerId: init.ownerId ?? entityById.get(target)?.ownerIds[0] ?? entityById.get(source)?.ownerIds[0],
  });
}

const linkAll = (
  source: string,
  targets: string[],
  type: GovRelationType,
  init: Partial<Omit<GovRelationship, 'id' | 'source' | 'target' | 'type'>> = {},
) => targets.forEach((t) => link(source, t, type, init));

const deptName = (id: string) => govDepartments.find((d) => d.id === id)?.name ?? id;

// organization
for (const d of govDepartments) {
  linkAll(d.id, d.locationIds, 'operates-in', { scope: `${d.name} headcount` });
  link(d.id, d.headId, 'owned-by', { scope: `${d.name} access decisions` });
}

// department → the roles held inside it
for (const [roleId, scope] of Object.entries(roleScope)) {
  for (const depId of scope.departmentIds) {
    link(depId, roleId, 'assigned-through', {
      scope: `${scope.userCount} users in ${deptName(depId)}`,
    });
  }
}

// roles
for (const r of businessRoles) {
  linkAll(r.id, r.technicalRoleIds, 'inherited-from', { scope: `${r.name} bundle` });
  linkAll(r.id, r.entitlementIds, 'grants', { scope: 'Direct grant' });
  linkAll(r.id, r.ownerIds, 'owned-by', { scope: 'Role definition and membership' });
  // A role reaches an application through the entitlements it grants.
  const apps = new Set(
    [...r.entitlementIds, ...r.technicalRoleIds.flatMap((t) => technicalRoles.find((x) => x.id === t)?.entitlementIds ?? [])]
      .map((eid) => flatEntitlements.find((e) => e.id === eid)?.applicationId)
      .filter((x): x is string => Boolean(x)),
  );
  linkAll(r.id, [...apps], 'assigned-through', { scope: `${roleScope[r.id]?.userCount ?? 0} users` });
}

for (const r of technicalRoles) {
  linkAll(r.id, r.entitlementIds, 'grants', { scope: `${r.name} bundle` });
  linkAll(r.id, r.ownerIds, 'owned-by', { scope: 'Role definition and membership' });
  const apps = new Set(
    r.entitlementIds.map((eid) => flatEntitlements.find((e) => e.id === eid)?.applicationId).filter((x): x is string => Boolean(x)),
  );
  linkAll(r.id, [...apps], 'assigned-through', { scope: `${roleScope[r.id]?.userCount ?? 0} users` });
}

// access
for (const app of catalogApps) {
  const g = applicationGovernance[app.id];
  linkAll(app.id, app.entitlements.map((e) => e.id), 'grants', { scope: `${app.name} entitlement catalog` });
  linkAll(app.id, app.ownerIds, 'owned-by', { scope: 'Application configuration and risk' });
  linkAll(app.id, g?.reviewOwnerIds ?? [], 'reviewed-by', { scope: 'Access certification' });
  linkAll(app.id, g?.approvalOwnerIds ?? [], 'approved-by', { scope: 'Access requests' });
  linkAll(app.id, g?.governanceRoleIds ?? [], 'enforced-by', { scope: 'Governance oversight' });
}

for (const e of flatEntitlements) {
  linkAll(e.id, e.ownerIds, 'owned-by', { scope: 'Entitlement definition' });
}

// governance controls
for (const p of govBirthrightPolicies) {
  linkAll(p.id, p.grantsEntitlementIds, 'grants', { scope: `${p.usersCovered} users on join` });
  linkAll(p.id, p.departmentIds, 'applies-to', { scope: 'Automatic on assignment' });
  linkAll(p.id, p.locationIds, 'applies-to', { scope: 'Automatic on assignment' });
  linkAll(p.id, p.ownerIds, 'owned-by', { scope: 'Policy rules and exceptions' });
  // The applications reached by what the policy grants.
  const apps = new Set(
    p.grantsEntitlementIds.map((eid) => flatEntitlements.find((x) => x.id === eid)?.applicationId).filter((x): x is string => Boolean(x)),
  );
  for (const appId of apps) {
    link(appId, p.id, 'governed-by', {
      scope: 'Birthright provisioning',
      riskNote: p.ownerIds.length === 0 ? 'The policy that provisions this access has no owner.' : undefined,
    });
  }
}

for (const [policyId, g] of Object.entries(approvalPolicyGovernance)) {
  const hierarchy = govApprovalHierarchies.find((h) => h.id === g.hierarchyId);
  const broken = hierarchy?.levels.some((l) => l.approverId === null) ?? false;
  for (const appId of g.applicationIds) {
    link(appId, policyId, 'governed-by', {
      scope: `${g.requestsPerQuarter} requests / quarter`,
      riskNote: broken ? 'The approval chain for this policy has an unresolved level.' : undefined,
    });
  }
  link(policyId, g.workflowId, 'enforced-by', { scope: 'Runtime execution' });
  linkAll(policyId, g.ownerIds, 'owned-by', { scope: 'Approval routing' });

  for (const level of hierarchy?.levels ?? []) {
    if (level.approverId) {
      link(policyId, level.approverId, 'approved-by', {
        scope: `Level ${level.level} · ${level.approverLabel} · SLA ${level.slaHours}h`,
      });
    }
    if (level.delegationId) {
      link(policyId, level.delegationId, 'delegated-to', { scope: `Level ${level.level} authority` });
    }
    if (level.escalationRuleId) {
      link(policyId, level.escalationRuleId, 'escalates-to', { scope: `Level ${level.level} timeout` });
    }
  }
}

for (const [policyId, g] of Object.entries(sodPolicyGovernance)) {
  linkAll(policyId, g.ownerIds, 'owned-by', { scope: 'Rule set and exceptions' });
  linkAll(policyId, g.governanceRoleIds, 'enforced-by', { scope: 'Violation adjudication' });
  linkAll(policyId, g.departmentIds, 'applies-to', { scope: `${g.usersAffected} users in scope` });
  for (const appId of g.applicationIds) {
    link(appId, policyId, 'protected-by', {
      scope: `${g.openViolations} open violations`,
      riskNote: g.openViolations > 0 ? `${g.openViolations} unresolved violations on this application.` : undefined,
    });
  }
  for (const roleId of [...g.businessRoleIds, ...g.technicalRoleIds]) {
    link(roleId, policyId, 'protected-by', { scope: 'Conflicting-access constraint' });
  }
}

// approval chain
for (const d of govDelegations) {
  link(d.id, d.toId, 'delegated-to', {
    scope: d.scope,
    effective: d.status === 'expired' ? 'inactive' : 'active',
    riskNote:
      d.validUntil === null
        ? 'Delegated authority with no end date — it never returns to its owner.'
        : d.status === 'expired'
          ? 'This delegation lapsed but is still referenced by an approval chain.'
          : undefined,
  });
  link(d.id, d.fromId, 'owned-by', { scope: 'Delegating authority' });
}

for (const r of govEscalationRules) {
  for (const l of r.levels) {
    if (!l.approverId) continue;
    link(r.id, l.approverId, 'escalates-to', { scope: `Level ${l.level} · after ${l.afterHours}h` });
  }
}

// responsibility
for (const r of govGovernanceRoles) {
  const team = governanceTeams.find((g) => g.id === r.governanceTeamId);
  linkAll(r.id, team?.reviewerIds ?? [], 'held-by', { scope: team?.name ?? 'Governance team' });
}

/* ------------------------------------------------------------------ *
 * Adjacency
 * ------------------------------------------------------------------ */

const outgoing = new Map<string, GovRelationship[]>();
const incoming = new Map<string, GovRelationship[]>();
for (const r of relationships) {
  if (!outgoing.has(r.source)) outgoing.set(r.source, []);
  if (!incoming.has(r.target)) incoming.set(r.target, []);
  outgoing.get(r.source)!.push(r);
  incoming.get(r.target)!.push(r);
}

export const relationshipsFrom = (id: string): GovRelationship[] => outgoing.get(id) ?? [];
export const relationshipsTo = (id: string): GovRelationship[] => incoming.get(id) ?? [];
export const relationshipsOf = (id: string): GovRelationship[] => [...relationshipsFrom(id), ...relationshipsTo(id)];

/* ------------------------------------------------------------------ *
 * Public read model
 * ------------------------------------------------------------------ */

export const listGovEntities = (): GovEntity[] => entities;
export const getGovEntity = (id: string): GovEntity | undefined => entityById.get(id);
export const listGovRelationships = (): GovRelationship[] => relationships;
export const getGovRelationship = (id: string): GovRelationship | undefined => relationships.find((r) => r.id === id);
export const listByKind = (kind: GovEntityKind): GovEntity[] => entities.filter((e) => e.kind === kind);
export const listByDomain = (domain: GovDomain): GovEntity[] => entities.filter((e) => DOMAIN_OF[e.kind] === domain);
export const layerOf = (e: GovEntity): GovLayer => LAYER_OF[e.kind];

export const listDepartments = () => listByKind('department');
export const listLocations = () => listByKind('location');
export const listApprovalHierarchies = (): GovApprovalHierarchy[] => govApprovalHierarchies;
export const listDelegations = (): GovDelegation[] => govDelegations;
export const listEscalationRules = (): GovEscalationRule[] => govEscalationRules;
export const getApprovalHierarchy = (policyId: string) => govApprovalHierarchies.find((h) => h.policyId === policyId);
export { AS_OF };

/** Display name for a person, governance role, or any other entity id. */
export const displayName = (id: string | null | undefined): string =>
  (id && entityById.get(id)?.name) || '—';

/* ------------------------------------------------------------------ *
 * Findings — derived governance gaps
 * ------------------------------------------------------------------ */

const findings: GovFinding[] = [];
let findingSeq = 0;

const severityFrom = (risk: number): RiskTier => riskTier(risk);

function addFinding(f: Omit<GovFinding, 'id'>): void {
  findings.push({ ...f, id: `gf-${++findingSeq}` });
}

// Missing owner — an application or role nobody is accountable for.
for (const e of entities) {
  if (!['application', 'business-role', 'technical-role'].includes(e.kind)) continue;
  if (e.ownerIds.length > 0) continue;
  addFinding({
    kind: 'missing-owner',
    severity: severityFrom(Math.max(e.risk, 60)),
    entityId: e.id,
    title: `${e.name} has no owner`,
    what: `${KIND_LABEL[e.kind].one} “${e.name}” has no accountable owner assigned.`,
    why: 'Without an owner nobody approves changes to its access model, attests to its risk, or answers for it at audit. Requests route to a level that cannot be resolved.',
    impact: [
      { label: 'Users affected', value: (e.metrics.find((m) => m.label === 'Users')?.value ?? 0) as number },
      { label: 'Departments', value: e.departmentIds.map((d) => displayName(d)).join(', ') || 'Organization-wide' },
      { label: 'Risk score', value: e.risk },
    ],
    ownerId: null,
    action: `Assign an application owner to ${e.name}.`,
  });
}

// Missing access review owner — provisioned access nobody certifies.
for (const e of entities) {
  if (e.kind !== 'application' || e.reviewOwnerIds.length > 0) continue;
  addFinding({
    kind: 'missing-review-owner',
    severity: severityFrom(Math.max(e.risk, 50)),
    entityId: e.id,
    title: `${e.name} has no access review owner`,
    what: `${e.name} is provisioned to users but no one is assigned to certify that access.`,
    why: 'Access certifications for this application have no responsible reviewer, so entitlements accumulate without ever being re-confirmed.',
    impact: [
      { label: 'Users affected', value: (e.metrics.find((m) => m.label === 'Users')?.value ?? 0) as number },
      { label: 'Departments', value: e.departmentIds.map((d) => displayName(d)).join(', ') || 'Organization-wide' },
      { label: 'Entitlements', value: (e.metrics.find((m) => m.label === 'Entitlements')?.value ?? 0) as number },
    ],
    ownerId: e.ownerIds[0] ?? null,
    action: `Assign an access review owner to ${e.name}.`,
  });
}

// Missing policy owner.
for (const e of entities) {
  if (!['birthright-policy', 'approval-policy', 'sod-policy'].includes(e.kind)) continue;
  if (e.ownerIds.length > 0) continue;
  addFinding({
    kind: 'missing-policy-owner',
    severity: severityFrom(Math.max(e.risk, 55)),
    entityId: e.id,
    title: `${e.name} has no policy owner`,
    what: `${KIND_LABEL[e.kind].one} “${e.name}” is in force but has no owner.`,
    why: 'An unowned policy is never reviewed for correctness and its exceptions are never approved by anyone accountable — it keeps granting access on rules nobody maintains.',
    impact: [
      { label: 'Users covered', value: (e.metrics.find((m) => m.label === 'Users covered')?.value ?? 0) as number },
      { label: 'Scope', value: e.locationIds.map((l) => displayName(l)).join(', ') || 'Organization-wide' },
      { label: 'Last changed', value: `${e.updatedAt} by ${displayName(e.updatedBy)}` },
    ],
    ownerId: null,
    action: `Assign a policy owner to ${e.name}.`,
  });
}

// Broken approval chain — a level that cannot be routed to.
for (const h of govApprovalHierarchies) {
  const broken = h.levels.filter((l) => l.approverId === null);
  if (broken.length === 0) continue;
  const policy = entityById.get(h.policyId);
  addFinding({
    kind: 'broken-approval-chain',
    severity: 'critical',
    entityId: h.policyId,
    title: `${policy?.name ?? h.policyId} has an unresolved approval level`,
    what: `Level ${broken[0].level} of “${h.name}” resolves to ${broken[0].approverLabel}, which does not exist.`,
    why: 'Requests reaching this level stop. They are neither approved nor rejected, and with no fallback approver the request sits until it is abandoned.',
    impact: [
      { label: 'Requests / quarter', value: (policy?.metrics.find((m) => m.label === 'Requests / quarter')?.value ?? 0) as number },
      { label: 'Approval levels', value: h.levels.length },
      { label: 'Unresolved levels', value: broken.length },
    ],
    ownerId: policy?.ownerIds[0] ?? null,
    action: `Assign an owner to the target application, or replace level ${broken[0].level} with a resolvable approver.`,
  });
}

// Delegations without an end date, and delegations that have lapsed.
for (const d of govDelegations) {
  if (d.validUntil === null) {
    addFinding({
      kind: 'unmanaged-delegation',
      severity: 'high',
      entityId: d.id,
      title: `${displayName(d.fromId)} → ${displayName(d.toId)} has no expiry`,
      what: `Approval authority for ${d.scope.toLowerCase()} is delegated with no end date.`,
      why: 'Delegation is meant to be temporary. Without an expiry the authority never returns to its owner, and the access record no longer reflects who actually decides.',
      impact: [
        { label: 'Scope', value: d.scope },
        { label: 'Delegated by', value: displayName(d.fromId) },
        { label: 'Active since', value: 'No end date set' },
      ],
      ownerId: d.fromId,
      action: 'Set an expiry date, or convert the delegation into a permanent approver change.',
    });
  }
  if (d.status === 'expired') {
    const usedBy = govApprovalHierarchies.filter((h) => h.levels.some((l) => l.delegationId === d.id));
    addFinding({
      kind: 'expired-delegation',
      severity: usedBy.length > 0 ? 'high' : 'medium',
      entityId: d.id,
      title: `${displayName(d.fromId)} → ${displayName(d.toId)} has expired`,
      what: `The delegation lapsed on ${d.validUntil}${usedBy.length > 0 ? ' but is still referenced by an active approval chain' : ''}.`,
      why: 'An approval level pointing at a lapsed delegation falls back to its original approver without warning — or stalls, if that approver is also unavailable.',
      impact: [
        { label: 'Expired on', value: d.validUntil ?? '—' },
        { label: 'Referenced by', value: usedBy.map((h) => h.name).join(', ') || 'No active chain' },
        { label: 'Scope', value: d.scope },
      ],
      ownerId: d.fromId,
      action: 'Renew the delegation or remove it from the approval chain that references it.',
    });
  }
}

// Escalation gaps — no rule at all, or a rule with an unassigned level.
for (const h of govApprovalHierarchies) {
  const policy = entityById.get(h.policyId);
  if (h.levels.every((l) => l.escalationRuleId === null)) {
    addFinding({
      kind: 'escalation-gap',
      severity: 'medium',
      entityId: h.policyId,
      title: `${policy?.name ?? h.policyId} has no escalation path`,
      what: 'No level of this approval chain has an escalation rule attached.',
      why: 'When an approver does not act, nothing happens. The request waits indefinitely and no one is notified that a decision is overdue.',
      impact: [
        { label: 'Approval levels', value: h.levels.length },
        { label: 'Longest SLA', value: `${Math.max(...h.levels.map((l) => l.slaHours))}h` },
        { label: 'Requests / quarter', value: (policy?.metrics.find((m) => m.label === 'Requests / quarter')?.value ?? 0) as number },
      ],
      ownerId: policy?.ownerIds[0] ?? null,
      action: 'Attach an escalation rule to each approval level.',
    });
  }
}
for (const r of govEscalationRules) {
  const unassigned = r.levels.filter((l) => l.approverId === null);
  if (unassigned.length === 0) continue;
  addFinding({
    kind: 'escalation-gap',
    severity: 'high',
    entityId: r.id,
    title: `${r.name} escalates to an unassigned level`,
    what: `Level ${unassigned[0].level} (${unassigned[0].approverLabel}) has no assignee${r.terminalAction === 'none' ? ' and the rule has no terminal action' : ''}.`,
    why: 'An escalation that arrives at an empty level is where a request goes to die: past its SLA, out of the requester’s view, and with no automatic disposition.',
    impact: [
      { label: 'Levels', value: r.levels.length },
      { label: 'Escalates after', value: `${unassigned[0].afterHours}h` },
      { label: 'Terminal action', value: r.terminalAction === 'none' ? 'None' : r.terminalAction },
    ],
    ownerId: null,
    action: `Assign an approver to level ${unassigned[0].level}, and set a terminal action for the rule.`,
  });
}

// SoD conflicts on applications with open violations.
for (const [policyId, g] of Object.entries(sodPolicyGovernance)) {
  if (g.openViolations === 0) continue;
  const policy = entityById.get(policyId);
  addFinding({
    kind: 'sod-conflict',
    severity: severityFrom(g.risk),
    entityId: policyId,
    title: `${policy?.name ?? policyId} has ${g.openViolations} unresolved violations`,
    what: `${g.usersAffected} users hold access combinations this policy forbids across ${g.applicationIds.length} applications.`,
    why: 'Separation of duties is what stops one person from both initiating and approving the same transaction. Every open violation is a control that is documented but not operating.',
    impact: [
      { label: 'Open violations', value: g.openViolations },
      { label: 'Users affected', value: g.usersAffected },
      { label: 'Applications', value: g.applicationIds.map((a) => displayName(a)).join(', ') },
    ],
    ownerId: g.ownerIds[0] ?? null,
    action: 'Open the SoD resolution queue and decide each conflict — revoke, mitigate, or accept the risk.',
  });
}

// Orphaned policy — exists but is attached to nothing.
for (const p of govBirthrightPolicies) {
  if (p.grantsEntitlementIds.length > 0 || p.departmentIds.length > 0 || p.locationIds.length > 0) continue;
  addFinding({
    kind: 'orphaned-policy',
    severity: 'medium',
    entityId: p.id,
    title: `${p.name} is not attached to anything`,
    what: 'The policy exists but grants no entitlement and applies to no department or location.',
    why: 'An orphaned policy looks like coverage in a control inventory while granting nothing. It hides the fact that the population it was written for has no birthright at all.',
    impact: [
      { label: 'Status', value: p.status },
      { label: 'Entitlements granted', value: 0 },
      { label: 'Last changed', value: `${p.updatedAt} by ${displayName(p.updatedBy)}` },
    ],
    ownerId: p.ownerIds[0] ?? null,
    action: 'Attach the policy to a scope and an entitlement, or retire it.',
  });
}

// Uncontrolled application — access exists with no birthright and no approval policy.
{
  const governedAppIds = new Set<string>();
  for (const g of Object.values(approvalPolicyGovernance)) g.applicationIds.forEach((a) => governedAppIds.add(a));
  for (const p of govBirthrightPolicies) {
    for (const eid of p.grantsEntitlementIds) {
      const appId = flatEntitlements.find((e) => e.id === eid)?.applicationId;
      if (appId) governedAppIds.add(appId);
    }
  }
  for (const app of catalogApps) {
    if (governedAppIds.has(app.id)) continue;
    const e = entityById.get(app.id)!;
    addFinding({
      kind: 'uncontrolled-application',
      severity: severityFrom(Math.max(e.risk, 50)),
      entityId: app.id,
      title: `${app.name} has no governing policy`,
      what: `${app.name} is provisioned to users but no birthright policy and no approval policy references it.`,
      why: 'Access is being granted outside the governance model. There is no recorded rule for who should have it and no approval route for who may request it.',
      impact: [
        { label: 'Users', value: (e.metrics.find((m) => m.label === 'Users')?.value ?? 0) as number },
        { label: 'Entitlements', value: app.entitlements.length },
        { label: 'Departments', value: e.departmentIds.map((d) => displayName(d)).join(', ') || 'Organization-wide' },
      ],
      ownerId: app.ownerIds[0] ?? null,
      action: `Attach ${app.name} to an approval policy, or define a birthright policy for it.`,
    });
  }
}

// Conflicting ownership — the same person owns the object and certifies access to it.
for (const e of entities) {
  if (e.kind !== 'application') continue;
  const both = e.ownerIds.filter((o) => e.reviewOwnerIds.includes(o));
  if (both.length === 0) continue;
  addFinding({
    kind: 'conflicting-ownership',
    severity: 'high',
    entityId: e.id,
    title: `${displayName(both[0])} both owns and reviews ${e.name}`,
    what: `${displayName(both[0])} is the application owner and the access review owner for ${e.name}.`,
    why: 'Certification is meant to be an independent check on the owner’s access decisions. When they are the same person, the review confirms the grants that person made.',
    impact: [
      { label: 'Users', value: (e.metrics.find((m) => m.label === 'Users')?.value ?? 0) as number },
      { label: 'Held by', value: displayName(both[0]) },
      { label: 'Risk score', value: e.risk },
    ],
    ownerId: both[0],
    action: `Assign a different access review owner for ${e.name}.`,
  });
}

const SEVERITY_RANK: Record<RiskTier, number> = { critical: 0, high: 1, medium: 2, low: 3 };
findings.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || a.title.localeCompare(b.title));

export const listFindings = (): GovFinding[] => findings;
export const findingsFor = (entityId: string): GovFinding[] => findings.filter((f) => f.entityId === entityId);
export const findingsByKind = (kinds: GovFindingKind[]): GovFinding[] =>
  kinds.length === 0 ? findings : findings.filter((f) => kinds.includes(f.kind));

/** Entity ids that carry at least one finding — the canvas's gap marker. */
export const entitiesWithFindings = new Set(findings.map((f) => f.entityId));

/* ------------------------------------------------------------------ *
 * Health summary + model summary
 * ------------------------------------------------------------------ */

/**
 * Governance coverage: of the things that must be governed (applications, roles and
 * policies), the share with a complete responsibility record — an owner, a review
 * owner where access is certified, and at least one control governing it.
 */
function coverage(): { covered: number; total: number } {
  const governable = entities.filter((e) => ['application', 'business-role', 'technical-role', 'birthright-policy', 'approval-policy', 'sod-policy'].includes(e.kind));
  const covered = governable.filter((e) => !entitiesWithFindings.has(e.id)).length;
  return { covered, total: governable.length };
}

export function getHealthMetrics(): GovHealthMetric[] {
  const { covered, total } = coverage();
  const pct = total === 0 ? 100 : Math.round((covered / total) * 100);
  const count = (kinds: GovFindingKind[]) => findings.filter((f) => kinds.includes(f.kind)).length;
  const highRisk = relationships.filter((r) => r.riskNote).length;
  const sodViolations = Object.values(sodPolicyGovernance).reduce((n, g) => n + g.openViolations, 0);

  return [
    { id: 'coverage', label: 'Governance coverage', value: `${pct}%`, kinds: [], tone: pct >= 90 ? 'success' : pct >= 75 ? 'warning' : 'danger' },
    { id: 'high-risk', label: 'High-risk relationships', value: String(highRisk), kinds: [], tone: highRisk > 0 ? 'warning' : 'neutral' },
    { id: 'ownership-gaps', label: 'Ownership gaps', value: String(count(['missing-owner', 'missing-review-owner', 'missing-policy-owner'])), kinds: ['missing-owner', 'missing-review-owner', 'missing-policy-owner'], tone: 'danger' },
    { id: 'policy-conflicts', label: 'Policy conflicts', value: String(count(['conflicting-ownership', 'orphaned-policy', 'uncontrolled-application'])), kinds: ['conflicting-ownership', 'orphaned-policy', 'uncontrolled-application'], tone: 'warning' },
    { id: 'sod-violations', label: 'SoD violations', value: String(sodViolations), kinds: ['sod-conflict'], tone: 'danger' },
    { id: 'approval-issues', label: 'Approval chain issues', value: String(count(['broken-approval-chain', 'escalation-gap', 'unmanaged-delegation', 'expired-delegation'])), kinds: ['broken-approval-chain', 'escalation-gap', 'unmanaged-delegation', 'expired-delegation'], tone: 'warning' },
  ];
}

export interface GovSummaryGroup {
  title: string;
  rows: { label: string; value: string }[];
}

/** The optional model summary — counts, and coverage stated as "n of m". */
export function getModelSummary(): GovSummaryGroup[] {
  const n = (kind: GovEntityKind) => listByKind(kind).length;
  const apps = listByKind('application');
  const withOwner = apps.filter((a) => a.ownerIds.length > 0).length;
  const withReview = apps.filter((a) => a.reviewOwnerIds.length > 0).length;
  return [
    {
      title: 'Organizational coverage',
      rows: [
        { label: 'Departments', value: String(n('department')) },
        { label: 'Locations', value: String(n('location')) },
        { label: 'Business Roles', value: String(n('business-role')) },
        { label: 'Technical Roles', value: String(n('technical-role')) },
      ],
    },
    {
      title: 'Access governance',
      rows: [
        { label: 'Applications', value: String(n('application')) },
        { label: 'Entitlements', value: String(n('entitlement')) },
        { label: 'Birthright Policies', value: String(n('birthright-policy')) },
        { label: 'Approval Policies', value: String(n('approval-policy')) },
        { label: 'SoD Policies', value: String(n('sod-policy')) },
      ],
    },
    {
      title: 'Governance responsibility',
      rows: [
        { label: 'Governance Roles', value: String(n('governance-role')) },
        { label: 'Application Owners', value: `${withOwner} / ${apps.length}` },
        { label: 'Review Owners', value: `${withReview} / ${apps.length}` },
        { label: 'Approval Hierarchies', value: String(govApprovalHierarchies.length) },
        { label: 'Active Delegations', value: String(govDelegations.filter((d) => d.status === 'active').length) },
        { label: 'Escalation Rules', value: String(govEscalationRules.length) },
      ],
    },
  ];
}

/* ------------------------------------------------------------------ *
 * Search
 * ------------------------------------------------------------------ */

export interface GovSearchGroup {
  domain: GovDomain;
  label: string;
  results: GovEntity[];
}

/** Categorised entity lookup. Matches name, description, kind, and department. */
export function searchGov(query: string, limitPerGroup = 5): GovSearchGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hit = (e: GovEntity) =>
    e.name.toLowerCase().includes(q) ||
    e.description.toLowerCase().includes(q) ||
    KIND_LABEL[e.kind].one.toLowerCase().includes(q) ||
    e.departmentIds.some((d) => displayName(d).toLowerCase().includes(q));

  const matched = entities.filter(hit);
  const domains: GovDomain[] = ['access', 'policies', 'organization', 'governance'];
  return domains
    .map((domain) => ({
      domain,
      label: domain === 'organization' ? 'Organization' : domain === 'access' ? 'Access' : domain === 'policies' ? 'Policies' : 'Governance',
      results: matched
        .filter((e) => DOMAIN_OF[e.kind] === domain)
        .sort((a, b) => {
          const an = a.name.toLowerCase().startsWith(q) ? 0 : 1;
          const bn = b.name.toLowerCase().startsWith(q) ? 0 : 1;
          return an - bn || b.risk - a.risk;
        })
        .slice(0, limitPerGroup),
    }))
    .filter((g) => g.results.length > 0);
}

/* ------------------------------------------------------------------ *
 * Filters
 * ------------------------------------------------------------------ */

export interface GovFilterState {
  kinds: GovEntityKind[];
  departmentIds: string[];
  locationIds: string[];
  riskTiers: RiskTier[];
  findingKinds: GovFindingKind[];
  relationTypes: GovRelationType[];
}

export const emptyFilters = (): GovFilterState => ({
  kinds: [],
  departmentIds: [],
  locationIds: [],
  riskTiers: [],
  findingKinds: [],
  relationTypes: [],
});

export const filterCount = (f: GovFilterState): number =>
  f.kinds.length + f.departmentIds.length + f.locationIds.length + f.riskTiers.length + f.findingKinds.length + f.relationTypes.length;

/** Whether an entity survives the active filters. Kind filters never hide the root. */
export function matchesFilters(e: GovEntity, f: GovFilterState): boolean {
  if (f.kinds.length && !f.kinds.includes(e.kind)) return false;
  if (f.departmentIds.length && !e.departmentIds.some((d) => f.departmentIds.includes(d))) return false;
  if (f.locationIds.length && !e.locationIds.some((l) => f.locationIds.includes(l))) return false;
  if (f.riskTiers.length && !f.riskTiers.includes(riskTier(e.risk))) return false;
  if (f.findingKinds.length && !findingsFor(e.id).some((x) => f.findingKinds.includes(x.kind))) return false;
  return true;
}

export const applyFilters = (list: GovEntity[], f: GovFilterState): GovEntity[] => list.filter((e) => matchesFilters(e, f));

/* ------------------------------------------------------------------ *
 * Graph construction (the Governance Map)
 * ------------------------------------------------------------------ */

export interface GovGraphNode {
  entity: GovEntity;
  /** Column index — the entity's governance layer. */
  column: number;
  /** Neighbours not drawn because their relation group was capped. */
  hiddenCount: number;
  isRoot: boolean;
}

export interface GovGraph {
  nodes: GovGraphNode[];
  edges: GovRelationship[];
  /** Entities reachable but not drawn, across the whole graph. */
  hiddenTotal: number;
}

/** Neighbours shown per (entity, relation type) before the rest collapse to a count. */
const FANOUT_LIMIT = 5;
/** Tighter cap on the auto-revealed second ring, so depth never costs readability. */
const RING_2_LIMIT = 2;
/** How many first-ring neighbours are auto-expanded to give the default overview. */
const RING_2_SEEDS = 3;

/**
 * Builds the rooted governance neighbourhood.
 *
 * Progressive disclosure is the whole point. The root's direct relationships are
 * always drawn; the four highest-risk of those are opened one further ring so the
 * default view reaches all the way from an organizational unit to the people
 * accountable for its access, the way §8 of the brief describes. Everything beyond
 * that stays a number on a node until the user asks for it — which is what keeps a
 * model of ~400 relationships readable at roughly twenty nodes.
 */
export function buildGraph(rootId: string, expanded: Set<string>, filters: GovFilterState): GovGraph {
  const root = entityById.get(rootId);
  if (!root) return { nodes: [], edges: [], hiddenTotal: 0 };

  const included = new Map<string, GovGraphNode>();
  const hidden = new Map<string, number>();
  included.set(root.id, { entity: root, column: LAYER_ORDER.indexOf(LAYER_OF[root.kind]), hiddenCount: 0, isRoot: true });

  /** Returns the neighbour ids kept, highest-risk first, recording the overflow. */
  const expand = (id: string, limit: number): string[] => {
    const byType = new Map<string, GovRelationship[]>();
    for (const r of relationshipsOf(id)) {
      const other = r.source === id ? r.target : r.source;
      const e = entityById.get(other);
      if (!e) continue;
      if (filters.relationTypes.length && !filters.relationTypes.includes(r.type)) continue;
      if (!matchesFilters(e, filters)) continue;
      const key = `${r.type}:${r.source === id ? 'out' : 'in'}`;
      if (!byType.has(key)) byType.set(key, []);
      byType.get(key)!.push(r);
    }
    const added: string[] = [];
    for (const group of byType.values()) {
      // Highest-risk neighbours survive the cap — the ones worth looking at first.
      const ordered = [...group].sort((a, b) => {
        const ea = entityById.get(a.source === id ? a.target : a.source)!;
        const eb = entityById.get(b.source === id ? b.target : b.source)!;
        return eb.risk - ea.risk;
      });
      const keep = ordered.slice(0, limit);
      if (ordered.length > keep.length) hidden.set(id, (hidden.get(id) ?? 0) + (ordered.length - keep.length));
      for (const r of keep) {
        const otherId = r.source === id ? r.target : r.source;
        added.push(otherId);
        if (included.has(otherId)) continue;
        const e = entityById.get(otherId)!;
        included.set(otherId, { entity: e, column: LAYER_ORDER.indexOf(LAYER_OF[e.kind]), hiddenCount: 0, isRoot: false });
      }
    }
    return added;
  };

  const ring1 = expand(root.id, FANOUT_LIMIT);
  const autoSeeds = [...new Set(ring1)]
    .map((id) => entityById.get(id)!)
    .sort((a, b) => b.risk - a.risk)
    .slice(0, RING_2_SEEDS);
  for (const seed of autoSeeds) if (!expanded.has(seed.id)) expand(seed.id, RING_2_LIMIT);
  for (const id of expanded) if (included.has(id)) expand(id, FANOUT_LIMIT);

  for (const [id, count] of hidden) {
    const node = included.get(id);
    // A node the user already expanded has no hidden neighbours left to advertise.
    if (node && !expanded.has(id)) node.hiddenCount = count;
  }

  const ids = new Set(included.keys());
  const edges = relationships.filter(
    (r) =>
      ids.has(r.source) &&
      ids.has(r.target) &&
      (filters.relationTypes.length === 0 || filters.relationTypes.includes(r.type)),
  );

  return {
    nodes: [...included.values()],
    edges,
    hiddenTotal: [...included.values()].reduce((n, x) => n + x.hiddenCount, 0),
  };
}

/* ------------------------------------------------------------------ *
 * Trace governance
 * ------------------------------------------------------------------ */

export interface GovTraceStep {
  kind: GovEntityKind;
  layer: GovLayer;
  title: string;
  /** The relation that brought these entities into the chain. */
  via: GovRelationType;
  entities: GovEntity[];
}

/**
 * The order a governance trace is read in. Fixed rather than derived, because the
 * value of the trace is that it always answers the same questions in the same
 * sequence: what grants this, what it reaches, what governs it, who decides, who
 * is accountable when nobody does.
 */
const TRACE_ORDER: GovEntityKind[] = [
  'department',
  'location',
  'business-role',
  'technical-role',
  'application',
  'entitlement',
  'birthright-policy',
  'approval-policy',
  'approval-workflow',
  'sod-policy',
  'delegation',
  'escalation-rule',
  'governance-role',
  'person',
];

/**
 * "Why does this access exist, and who governs it?" — walks forward from an entity
 * for a bounded number of hops, then reports what it reached in the fixed order
 * above. Following the relationship direction (which always points toward
 * responsibility) is what makes the result an ordered chain rather than a blob;
 * bounding the walk is what stops a well-connected root from tracing the whole
 * model back to itself.
 */
export function traceGovernance(entityId: string, maxHops = 3, maxPerStep = 6): GovTraceStep[] {
  const start = entityById.get(entityId);
  if (!start) return [];

  const seen = new Set([entityId]);
  const reached = new Map<string, GovRelationType>();
  let frontier = [start];

  for (let hop = 0; hop < maxHops && frontier.length > 0; hop++) {
    const next: GovEntity[] = [];
    for (const node of frontier) {
      for (const r of relationshipsFrom(node.id)) {
        if (seen.has(r.target)) continue;
        const e = entityById.get(r.target);
        if (!e) continue;
        seen.add(e.id);
        reached.set(e.id, r.type);
        next.push(e);
      }
    }
    frontier = next;
  }

  const steps: GovTraceStep[] = [];
  for (const kind of TRACE_ORDER) {
    const matched = [...reached.keys()]
      .map((id) => entityById.get(id)!)
      .filter((e) => e.kind === kind)
      .sort((a, b) => b.risk - a.risk);
    if (matched.length === 0) continue;
    steps.push({
      kind,
      layer: LAYER_OF[kind],
      title: KIND_LABEL[kind].many,
      via: reached.get(matched[0].id)!,
      entities: matched.slice(0, maxPerStep),
    });
  }
  return steps;
}

/* ------------------------------------------------------------------ *
 * Explorer projections
 * ------------------------------------------------------------------ */

export interface GovExplorerRow {
  id: string;
  entity: GovEntity;
  /** "Finance · India, Germany" — the organizational scope, pre-joined. */
  organization: string;
  /** Controls governing this entity, grouped for the Access Controls cell. */
  controls: { birthright: number; approval: number; workflow: number; sod: number };
  ownership: { owners: GovEntity[]; reviewers: GovEntity[]; complete: boolean };
  /** Depth of the deepest approval chain governing this entity, not the sum. */
  approvalLevels: number;
  delegations: number;
  escalations: number;
  findings: GovFinding[];
}

const collect = (rels: GovRelationship[], id: string, kinds: GovEntityKind[]): GovEntity[] => {
  const out: GovEntity[] = [];
  for (const r of rels) {
    const other = r.source === id ? r.target : r.source;
    const e = entityById.get(other);
    if (e && kinds.includes(e.kind) && !out.some((x) => x.id === e.id)) out.push(e);
  }
  return out;
};

export function explorerRow(entity: GovEntity): GovExplorerRow {
  const rels = relationshipsOf(entity.id);
  const controls = collect(rels, entity.id, ['birthright-policy', 'approval-policy', 'approval-workflow', 'sod-policy']);
  const approvalPolicies = controls.filter((c) => c.kind === 'approval-policy');
  // The deepest chain, not the sum: "4 levels" answers "how far does a request go?".
  const approvalLevels = approvalPolicies.reduce((n, p) => Math.max(n, getApprovalHierarchy(p.id)?.levels.length ?? 0), 0);
  // Workflows reached through this entity's approval policies, not directly linked.
  const workflowIds = new Set(
    approvalPolicies
      .flatMap((p) => relationshipsFrom(p.id).filter((r) => r.type === 'enforced-by'))
      .map((r) => r.target)
      .filter((id) => entityById.get(id)?.kind === 'approval-workflow'),
  );
  const owners = collect(relationshipsFrom(entity.id).filter((r) => r.type === 'owned-by'), entity.id, ['person']);
  const reviewers = collect(relationshipsFrom(entity.id).filter((r) => r.type === 'reviewed-by'), entity.id, ['person']);
  const delegations = approvalPolicies.flatMap((p) => getApprovalHierarchy(p.id)?.levels ?? []).filter((l) => l.delegationId).length;
  const escalations = new Set(
    approvalPolicies.flatMap((p) => (getApprovalHierarchy(p.id)?.levels ?? []).map((l) => l.escalationRuleId).filter(Boolean)),
  ).size;

  const org = [
    entity.departmentIds.map((d) => displayName(d)).join(', '),
    entity.locationIds.map((l) => displayName(l)).join(', '),
  ].filter(Boolean);

  const needsReviewer = entity.kind === 'application' || entity.kind === 'entitlement';
  return {
    id: entity.id,
    entity,
    organization: org.join(' · ') || 'Organization-wide',
    controls: {
      birthright: controls.filter((c) => c.kind === 'birthright-policy').length,
      approval: approvalPolicies.length,
      workflow: controls.filter((c) => c.kind === 'approval-workflow').length + workflowIds.size,
      sod: controls.filter((c) => c.kind === 'sod-policy').length,
    },
    ownership: { owners, reviewers, complete: owners.length > 0 && (!needsReviewer || reviewers.length > 0) },
    approvalLevels,
    delegations,
    escalations,
    findings: findingsFor(entity.id),
  };
}

export const explorerRows = (kinds: GovEntityKind[], filters: GovFilterState): GovExplorerRow[] =>
  entities
    .filter((e) => kinds.includes(e.kind) && matchesFilters(e, filters))
    .map(explorerRow)
    .sort((a, b) => b.findings.length - a.findings.length || b.entity.risk - a.entity.risk);

/** Ownership coverage, for the Explorer's ownership mode. */
export function ownershipCoverage(): { pct: number; missingOwners: number; missingPolicyOwners: number; missingReviewOwners: number } {
  const apps = listByKind('application');
  const roles = [...listByKind('business-role'), ...listByKind('technical-role')];
  const policies = [...listByKind('birthright-policy'), ...listByKind('approval-policy'), ...listByKind('sod-policy')];
  const all = [...apps, ...roles, ...policies];
  const owned = all.filter((e) => e.ownerIds.length > 0).length;
  return {
    pct: all.length === 0 ? 100 : Math.round((owned / all.length) * 100),
    missingOwners: [...apps, ...roles].filter((e) => e.ownerIds.length === 0).length,
    missingPolicyOwners: policies.filter((e) => e.ownerIds.length === 0).length,
    missingReviewOwners: apps.filter((e) => e.reviewOwnerIds.length === 0).length,
  };
}

/** Every ownership assignment, flattened — "who owns what". */
export interface OwnershipRow {
  id: string;
  entity: GovEntity;
  responsibility: 'Owner' | 'Access Review Owner' | 'Approval Owner';
  personId: string | null;
}

export function ownershipRows(filters: GovFilterState): OwnershipRow[] {
  const out: OwnershipRow[] = [];
  const subjects = entities.filter(
    (e) =>
      ['application', 'entitlement', 'business-role', 'technical-role', 'birthright-policy', 'approval-policy', 'sod-policy'].includes(e.kind) &&
      matchesFilters(e, filters),
  );
  for (const e of subjects) {
    const rows: [OwnershipRow['responsibility'], string[]][] = [
      ['Owner', e.ownerIds],
      ['Access Review Owner', e.kind === 'application' || e.kind === 'entitlement' ? e.reviewOwnerIds : []],
      ['Approval Owner', e.approvalOwnerIds],
    ];
    for (const [responsibility, ids] of rows) {
      if (responsibility === 'Access Review Owner' && e.kind !== 'application' && e.kind !== 'entitlement') continue;
      if (responsibility === 'Approval Owner' && e.kind !== 'application') continue;
      if (ids.length === 0) {
        out.push({ id: `${e.id}:${responsibility}:none`, entity: e, responsibility, personId: null });
      } else {
        ids.forEach((pid) => out.push({ id: `${e.id}:${responsibility}:${pid}`, entity: e, responsibility, personId: pid }));
      }
    }
  }
  // Gaps first — the reason to open this view at all.
  return out.sort((a, b) => Number(a.personId !== null) - Number(b.personId !== null) || b.entity.risk - a.entity.risk);
}
