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
  emergencyGovernanceGroupsCount,
  ownerDirectory,
  identities,
  type RiskLevel,
  type Tone,
  type SeedEAOwner,
} from './seed';
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

export function getEmergencyAccessList(): EARow[] {
  return emergencyAccessList.map((ea) => ({
    id: ea.id,
    name: ea.name,
    initial: ea.initial,
    status:
      ea.status === 'active'
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
  risk: { intent: 'success' | 'warning' | 'info' | 'danger'; label: string } | null;
  config: { maxDurationHrs: number; maxConcurrent: number; maxRequestsPerDay: number; cooldownHrs: number };
  timeline: { createdOn: string; updatedOn: string };
  sessions: EASessionView[];
  sessionsTotal: number;
  owners: SeedEAOwner[];
  ownersCount: number;
  governanceGroupsCount: number;
  eligibilityGroups: EligibilityGroup[];
}

export function getEmergencyAccess(id: string): EADetail | null {
  const ea = emergencyAccessList.find((e) => e.id === id);
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
    status:
      ea.status === 'active'
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
    timeline: { createdOn: ea.createdOn, updatedOn: ea.updatedOn },
    sessions,
    sessionsTotal: emergencySessionsTotal,
    owners: emergencyOwners,
    ownersCount: emergencyOwners.length,
    governanceGroupsCount: emergencyGovernanceGroupsCount,
    eligibilityGroups: getEligibilityGroups(id),
  };
}

/** Persist eligibility groups for an emergency-access profile (session memory). */
export function setEmergencyAccessEligibility(id: string, groups: EligibilityGroup[]): EligibilityGroup[] {
  return setEligibilityGroups(id, groups);
}

/** People who can be added as owners (directory minus current owners). */
export function getAvailableOwners(id: string): SeedEAOwner[] {
  const assigned = new Set(emergencyOwners.map((o) => o.id));
  return ownerDirectory.filter((o) => !assigned.has(o.id));
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
  const ea = emergencyAccessList.find((e) => e.id === id);
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
