/**
 * Emergency Access service — the read model for the Emergency Access module.
 * Derives list rows and detail view-models from the seed. Screens depend on
 * these functions, not on the raw seed.
 */
import {
  emergencyAccessList,
  emergencySessions,
  emergencySessionsTotal,
  emergencyOwners,
  emergencyGovernanceTeamsCount,
  ownerDirectory,
  identities,
  catalogApps,
  type RiskLevel,
  type Tone,
  type SeedEAOwner,
  type EAStatus,
  type SeedEmergencyAccess,
} from './seed';
import type { EntitySelection } from './automation-types';
import {
  getEligibilityGroups,
  setEligibilityGroups,
  type EligibilityGroup,
} from './eligibility-criteria';

export type { EligibilityGroup, EligibilityCondition, EligibilityAttribute } from './eligibility-criteria';
export {
  getEligibilityGroups,
  setEligibilityGroups,
  emptyEligibilityGroup,
  isEligibilityGroupValid,
  eligibilityConditionText,
} from './eligibility-criteria';

const RISK_INTENT: Record<RiskLevel, Extract<Tone, 'success' | 'warning' | 'info' | 'danger'>> = {
  low: 'success',
  medium: 'warning',
  high: 'info',
  critical: 'danger',
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface EARow {
  id: string;
  name: string;
  initial: string;
  status: { intent: 'warning' | 'success'; label: string };
  risk: { intent: 'success' | 'warning' | 'info' | 'danger'; label: string } | null;
  activeUsers: number | null;
}

/**
 * Profiles created during this session, newest first.
 *
 * Session memory like the rest of this module. They join the seeded list rather
 * than replacing it, so a demo can create one and still see the others.
 */
const createdProfiles: SeedEmergencyAccess[] = [];

const allProfiles = (): SeedEmergencyAccess[] => [...createdProfiles, ...emergencyAccessList];


/**
 * Creates a draft and returns its id.
 *
 * Deliberately empty: no eligibility, no assignments, no owners. A new profile
 * that arrived pre-filled would hide the one thing the draft state exists to
 * show — what is still missing before it can be switched on.
 */
export function createEmergencyAccess(input: { name: string; description: string }): string {
  const id = `ea-new-${Math.random().toString(36).slice(2, 8)}`;
  // An instant, not a formatted string: the display format belongs to the screen
  // showing it, and a stored "April 20, 2026" can never grow a time later.
  const today = new Date().toISOString();
  createdProfiles.unshift({
    id,
    name: input.name.trim(),
    initial: (input.name.trim().charAt(0) || 'E').toUpperCase(),
    description: input.description.trim(),
    status: 'draft',
    maxDurationHrs: 24,
    maxConcurrent: 10,
    maxRequestsPerDay: 5,
    cooldownHrs: 2,
    createdOn: today,
    updatedOn: today,
  });
  // Claim the assignments slot so the seeding fallback does not hand a brand-new
  // draft somebody else's entitlements.
  assignmentsById.set(id, { entitlements: [], technicalRoles: [] });
  return id;
}

export function getEmergencyAccessList(): EARow[] {
  return allProfiles().map((ea) => ({
    id: ea.id,
    name: ea.name,
    initial: ea.initial,
    status: isActive(ea.id, ea.status)
      ? { intent: 'success', label: 'Active' }
      : { intent: 'warning', label: 'Draft' },
    risk:
      ea.riskLevel && ea.riskScore != null
        ? { intent: RISK_INTENT[ea.riskLevel], label: `${cap(ea.riskLevel)} (${ea.riskScore})` }
        : null,
    activeUsers: ea.activeUsers ?? null,
  }));
}

export interface EASessionView {
  id: string;
  name: string;
  subtitle: string;
  when: string;
  ongoing: boolean;
}

export interface EADetail {
  id: string;
  name: string;
  initial: string;
  description: string;
  status: { intent: 'warning' | 'success'; label: string };
  /** A draft has never been activated, so it has no sessions and cannot be requested. */
  isDraft: boolean;
  risk: { intent: 'success' | 'warning' | 'info' | 'danger'; label: string } | null;
  config: { maxDurationHrs: number; maxConcurrent: number; maxRequestsPerDay: number; cooldownHrs: number };
  timeline: { createdOn: string; updatedOn: string };
  sessions: EASessionView[];
  sessionsTotal: number;
  owners: SeedEAOwner[];
  ownersCount: number;
  governanceTeamsCount: number;
  eligibilityGroups: EligibilityGroup[];
}

export function getEmergencyAccess(id: string): EADetail | null {
  const ea = allProfiles().find((e) => e.id === id);
  if (!ea) return null;

  const sessions: EASessionView[] = emergencySessions.map((s, i) => {
    const idn = identities.find((u) => u.id === s.identityId);
    return {
      id: `${s.identityId}-${i}`,
      name: idn?.name ?? 'Unknown',
      subtitle: idn ? `${idn.title} · ${idn.app}` : '',
      when: s.when,
      ongoing: s.ongoing,
    };
  });

  return {
    id: ea.id,
    name: ea.name,
    initial: ea.initial,
    description: ea.description,
    status: isActive(ea.id, ea.status)
      ? { intent: 'success', label: 'Active' }
      : { intent: 'warning', label: 'Draft' },
    risk:
      ea.riskLevel && ea.riskScore != null
        ? { intent: RISK_INTENT[ea.riskLevel], label: `${cap(ea.riskLevel)} (${ea.riskScore})` }
        : null,
    config: {
      maxDurationHrs: ea.maxDurationHrs,
      maxConcurrent: ea.maxConcurrent,
      maxRequestsPerDay: ea.maxRequestsPerDay,
      cooldownHrs: ea.cooldownHrs,
    },
    isDraft: !isActive(ea.id, ea.status),
    timeline: { createdOn: ea.createdOn, updatedOn: ea.updatedOn },
    sessions,
    sessionsTotal: emergencySessionsTotal,
    owners: emergencyOwners,
    ownersCount: emergencyOwners.length,
    governanceTeamsCount: emergencyGovernanceTeamsCount,
    eligibilityGroups: getEligibilityGroups(id),
  };
}

/** Persist eligibility groups for an emergency-access profile (session memory). */
export function setEmergencyAccessEligibility(id: string, groups: EligibilityGroup[]): EligibilityGroup[] {
  return setEligibilityGroups(id, groups);
}

/**
 * Governance teams that own a break-glass profile.
 *
 * The other half of ownership: a named person answers for it day to day, a team
 * answers for it at review. Session memory, seeded empty — group ownership is
 * something the user assigns, not something the seed asserts.
 */
const groupOwnersById = new Map<string, string[]>();

export function getEAGovernanceTeams(id: string): string[] {
  return groupOwnersById.get(id) ?? [];
}

export function setEAGovernanceTeams(id: string, ids: string[]): string[] {
  groupOwnersById.set(id, ids);
  return ids;
}

/** People who can be added as owners (directory minus current owners). */
export function getAvailableOwners(id: string): SeedEAOwner[] {
  const assigned = new Set(emergencyOwners.map((o) => o.id));
  return ownerDirectory.filter((o) => !assigned.has(o.id));
}

/**
 * Profiles activated during this session.
 *
 * The seed says what a profile started as; activation is something the user did
 * to it. Session memory, like eligibility and assignments — a draft that
 * survives a reload as "active" would be lying about the seed.
 */
const activatedIds = new Set<string>();

const isActive = (id: string, seeded: EAStatus) =>
  activatedIds.has(id) || (seeded === 'active' && !deactivatedIds.has(id));

/** Turns a draft on. Idempotent — activating an active profile is not an error. */
export function activateEmergencyAccess(id: string): void {
  activatedIds.add(id);
}

/** Puts an active profile back into draft. Sessions already granted are unaffected. */
export function deactivateEmergencyAccess(id: string): void {
  activatedIds.delete(id);
  deactivatedIds.add(id);
}

const deactivatedIds = new Set<string>();

/**
 * What still stands between a draft and being switched on, named in the reader's
 * words.
 *
 * One definition, used by both the header's Activate button and the Overview
 * checklist — two copies of this rule would eventually disagree, and a disabled
 * button whose checklist says everything is done is a bug nobody can diagnose.
 *
 * Owners and advanced limits are deliberately absent: they make a profile better
 * governed, not functional, and blocking activation on a missing owner would
 * stop someone turning on break-glass access during an incident.
 */
export function eaBlockingSteps(ea: EADetail): string[] {
  const assignments = getEAAssignments(ea.id);
  const blocking: string[] = [];
  if (ea.name.trim() === '' || ea.description.trim() === '') blocking.push('basic details');
  if (ea.eligibilityGroups.length === 0) blocking.push('eligibility criteria');
  if (assignments.entitlements.length + assignments.technicalRoles.length === 0) {
    blocking.push('assignments');
  }
  return blocking;
}

/**
 * What a break-glass profile actually hands over.
 *
 * Entitlements and technical roles only — no business roles. A business role is
 * a job description, and nobody is temporarily given a job; break-glass grants
 * the narrowest thing that unblocks the incident, then takes it back.
 *
 * Session memory, like eligibility and advanced config above: these edits belong
 * to the prototype's lifetime, not to a store.
 */
export interface EAAssignments {
  entitlements: EntitySelection[];
  technicalRoles: EntitySelection[];
}

const assignmentsById = new Map<string, EAAssignments>();

/** Seeded from the profile's own name so each one reads plausibly, not identically. */
function seedAssignments(id: string): EAAssignments {
  const app = catalogApps.find((a) => id.includes(a.id.replace('app-', ''))) ?? catalogApps[3];
  return {
    entitlements: app.entitlements
      .slice(0, 2)
      .map((e) => ({ id: e.id, name: e.name, appName: app.name })),
    technicalRoles: [],
  };
}

export function getEAAssignments(id: string): EAAssignments {
  const existing = assignmentsById.get(id);
  if (existing) return existing;
  const seeded = seedAssignments(id);
  assignmentsById.set(id, seeded);
  return seeded;
}

export function setEAAssignments(id: string, next: EAAssignments): EAAssignments {
  assignmentsById.set(id, next);
  return next;
}

/** Advanced configuration — editable limits, risk, and time-window settings. */
export type EAWeekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface EAAdvancedConfig {
  riskScore: number;
  maxConcurrent: number;
  maxRequestsPerDay: number;
  maxDurationHrs: number;
  cooldownHrs: number;
  cooldownMins: number;
  timezone: string;
  windowStart: string;
  windowEnd: string;
  /** Days of week when this access may be requested. */
  days: EAWeekday[];
}

const advancedConfigById = new Map<string, EAAdvancedConfig>();

export const EA_WEEKDAYS: { id: EAWeekday; label: string; short: string }[] = [
  { id: 'mon', label: 'Monday', short: 'Mon' },
  { id: 'tue', label: 'Tuesday', short: 'Tue' },
  { id: 'wed', label: 'Wednesday', short: 'Wed' },
  { id: 'thu', label: 'Thursday', short: 'Thu' },
  { id: 'fri', label: 'Friday', short: 'Fri' },
  { id: 'sat', label: 'Saturday', short: 'Sat' },
  { id: 'sun', label: 'Sunday', short: 'Sun' },
];

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 90) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export function riskChipFromScore(score: number): {
  intent: 'success' | 'warning' | 'info' | 'danger';
  label: string;
} {
  const level = riskLevelFromScore(score);
  return { intent: RISK_INTENT[level], label: cap(level) };
}

function defaultAdvancedConfig(id: string): EAAdvancedConfig {
  const ea = allProfiles().find((e) => e.id === id);
  return {
    riskScore: ea?.riskScore ?? 84,
    maxConcurrent: ea?.maxConcurrent ?? 2,
    maxRequestsPerDay: ea?.maxRequestsPerDay ?? 2,
    maxDurationHrs: ea?.maxDurationHrs ?? 2,
    cooldownHrs: ea?.cooldownHrs ?? 2,
    cooldownMins: 30,
    timezone: 'Asia/Kolkata',
    windowStart: '21:34',
    windowEnd: '21:34',
    days: ['mon', 'tue', 'wed', 'thu', 'fri'],
  };
}

export function getAdvancedConfig(id: string): EAAdvancedConfig {
  const existing = advancedConfigById.get(id);
  const seeded = defaultAdvancedConfig(id);
  if (existing) {
    const merged: EAAdvancedConfig = {
      ...seeded,
      ...existing,
      days: existing.days?.length ? [...existing.days] : [...seeded.days],
    };
    return merged;
  }
  advancedConfigById.set(id, seeded);
  return { ...seeded, days: [...seeded.days] };
}

export function setAdvancedConfig(id: string, config: EAAdvancedConfig): EAAdvancedConfig {
  const next = { ...config, days: [...config.days] };
  advancedConfigById.set(id, next);
  return { ...next, days: [...next.days] };
}
