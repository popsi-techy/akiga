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

/**
 * Same ramp as `RiskScoreChip`: Low blue, Medium yellow, High orange, Critical red.
 * A parallel mapping here made High read as info (blue) — the colour of Low —
 * which is why 84 looked like a calm measurement instead of a high one.
 */
const RISK_INTENT: Record<RiskLevel, 'info' | 'warning' | 'caution' | 'danger'> = {
  low: 'info',
  medium: 'warning',
  high: 'caution',
  critical: 'danger',
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface EARow {
  id: string;
  name: string;
  initial: string;
  status: { intent: 'warning' | 'success'; label: string };
  risk: { intent: 'info' | 'warning' | 'caution' | 'danger'; label: string } | null;
  activeUsers: number | null;
}

/**
 * Profiles created during this session, newest first.
 *
 * Session memory like the rest of this module. They join the seeded list rather
 * than replacing it, so a demo can create one and still see the others.
 */
const createdProfiles: SeedEmergencyAccess[] = [];

/**
 * Profiles deleted during this session.
 *
 * A tombstone rather than a splice, because the seeded profiles come from a
 * frozen module constant that must not be mutated — and because "deleted" is a
 * fact about this session, exactly like activation, so the two are remembered
 * the same way.
 */
const deletedIds = new Set<string>();

/**
 * Name and description, edited after creation.
 *
 * An overrides map rather than a mutation, because the seeded profiles come from
 * a frozen module constant — and a seed that quietly changes shape mid-session
 * is the hardest kind of prototype bug to see.
 */
const basicsById = new Map<string, { name: string; description: string }>();

export function updateEmergencyAccessBasics(
  id: string,
  input: { name: string; description: string },
): void {
  basicsById.set(id, { name: input.name.trim(), description: input.description.trim() });
}

const withBasics = (ea: SeedEmergencyAccess): SeedEmergencyAccess => {
  const edit = basicsById.get(ea.id);
  if (!edit) return ea;
  return {
    ...ea,
    name: edit.name,
    description: edit.description,
    initial: (edit.name.charAt(0) || ea.initial).toUpperCase(),
  };
};

const allProfiles = (): SeedEmergencyAccess[] =>
  [...createdProfiles, ...emergencyAccessList]
    .filter((e) => !deletedIds.has(e.id))
    .map(withBasics);

/**
 * Removes a profile. Its eligibility, assignments and owners go with it — a
 * profile that came back after a delete would come back armed.
 */
export function deleteEmergencyAccess(id: string): void {
  deletedIds.add(id);
  assignmentsById.delete(id);
  ownersById.delete(id);
  groupOwnersById.delete(id);
  advancedConfigById.delete(id);
}


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
  // Claim both slots so the seeding fallbacks do not hand a brand-new draft
  // somebody else's entitlements or somebody else's owners.
  assignmentsById.set(id, { entitlements: [], technicalRoles: [] });
  ownersById.set(id, []);
  return id;
}

export function getEmergencyAccessList(): EARow[] {
  return allProfiles().map((ea) => {
    const active = isActive(ea.id, ea.status);
    return {
      id: ea.id,
      name: ea.name,
      initial: ea.initial,
      status: active
        ? { intent: 'success', label: 'Active' }
        : { intent: 'warning', label: 'Draft' },
      risk: liveRiskChip(ea.id, ea, active),
      activeUsers: ea.activeUsers ?? null,
    };
  });
}

export interface EASessionView {
  id: string;
  /** The directory identity who held the session, so a row can open the person. */
  identityId: string;
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
  risk: { intent: 'info' | 'warning' | 'caution' | 'danger'; label: string } | null;
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
  const active = isActive(ea.id, ea.status);

  const sessions: EASessionView[] = emergencySessions.map((s, i) => {
    const idn = identities.find((u) => u.id === s.identityId);
    return {
      id: `${s.identityId}-${i}`,
      identityId: s.identityId,
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
    status: active
      ? { intent: 'success', label: 'Active' }
      : { intent: 'warning', label: 'Draft' },
    risk: liveRiskChip(ea.id, ea, active),
    config: {
      maxDurationHrs: ea.maxDurationHrs,
      maxConcurrent: ea.maxConcurrent,
      maxRequestsPerDay: ea.maxRequestsPerDay,
      cooldownHrs: ea.cooldownHrs,
    },
    isDraft: !active,
    timeline: { createdOn: ea.createdOn, updatedOn: ea.updatedOn },
    sessions,
    sessionsTotal: emergencySessionsTotal,
    owners: getEAOwners(id),
    ownersCount: getEAOwners(id).length,
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

/**
 * Owners of one profile.
 *
 * Per profile, not per module. A profile the seed says has been running carries
 * the sample owners, because that is what the seed asserts about it; a draft
 * starts with nobody, because nobody has been named yet.
 *
 * The module-wide list this replaced made every profile claim the same eight
 * owners — so a draft nobody had touched reported "Owners: done" on its own
 * checklist, which is the one thing a checklist cannot afford to get wrong.
 *
 * Keyed off the *seeded* status, not the live one: activating a draft is not a
 * way to acquire owners.
 */
const ownersById = new Map<string, SeedEAOwner[]>();

export function getEAOwners(id: string): SeedEAOwner[] {
  const existing = ownersById.get(id);
  if (existing) return existing;
  const seeded = allProfiles().find((e) => e.id === id)?.status === 'active' ? emergencyOwners : [];
  ownersById.set(id, seeded);
  return seeded;
}

export function setEAOwners(id: string, owners: SeedEAOwner[]): SeedEAOwner[] {
  ownersById.set(id, owners);
  return owners;
}

/** People who can be added as owners (directory minus this profile's owners). */
export function getAvailableOwners(id: string): SeedEAOwner[] {
  const assigned = new Set(getEAOwners(id).map((o) => o.id));
  return ownerDirectory.filter((o) => !assigned.has(o.id));
}

/**
 * Everyone who could own a profile, whether they already do or not.
 *
 * The partner to `getAvailableOwners`, which subtracts the current owners because
 * its drawer *appends*. A drawer that *edits* the set has to show the current
 * owners too — with their boxes ticked — or there is no way to take one back out.
 */
export function listOwnerCandidates(): SeedEAOwner[] {
  return ownerDirectory;
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

export type EASetupStepId = 'basic' | 'assignments' | 'eligibility' | 'owners' | 'advanced';

/**
 * Every piece of setting up a profile, in the order it wants doing.
 *
 * One ordered list, because this order is read in four places — the creation
 * drawer's preview of what comes next, the profile's checklist, the tab strip, and
 * the "Add X and Y" sentence — and it has already had to change once. A fourth
 * hardcoded copy is the one that drifts silently, because nothing fails when it
 * disagrees; it just tells a different story on a different screen.
 *
 * Labels only. Whether a step is *required* comes from `isRequiredSetupStep`, so the
 * asterisks and the Activate gate cannot disagree, and the per-screen extras — a
 * hint, a CTA, which tab it opens — stay with the screen that needs them.
 */
export const EA_SETUP_STEPS: { id: EASetupStepId; label: string }[] = [
  { id: 'basic', label: 'Basic details' },
  { id: 'assignments', label: 'Assignments' },
  { id: 'eligibility', label: 'Eligibility criteria' },
  { id: 'owners', label: 'Owners' },
  { id: 'advanced', label: 'Advanced configuration' },
];

/**
 * The tabs a draft lands on, in setup order — the real tabs, not a checklist.
 *
 * Basic details is dropped: the create drawer already collected name and
 * description. A draft opens on the first unfinished tab beside the dock.
 */
export const EA_GUIDED_STEPS: { id: Exclude<EASetupStepId, 'basic'>; label: string; tab: string }[] = [
  { id: 'assignments', label: 'Assignments', tab: 'assignments' },
  { id: 'eligibility', label: 'Eligibility', tab: 'eligibility' },
  { id: 'owners', label: 'Owners', tab: 'owners' },
  { id: 'advanced', label: 'Limits', tab: 'advanced' },
];

/** First unfinished guided tab, or the last one once everything is in place. */
export function firstUnfinishedGuidedTab(ea: EADetail): string {
  const unfinished = EA_GUIDED_STEPS.find((s) => !isEASetupStepDone(s.id, ea));
  return unfinished?.tab ?? EA_GUIDED_STEPS[EA_GUIDED_STEPS.length - 1].tab;
}

/**
 * The checks that gate activation, as data rather than a chain of `if`s.
 *
 * A list so the *count* is derivable: the header shows "2 / 3 required" beside
 * the Activate button, and a hardcoded 3 would keep saying 3 the day a fourth
 * check is added here. One definition, one denominator.
 *
 * Owners and advanced limits are deliberately absent: they make a profile better
 * governed, not functional, and blocking activation on a missing owner would
 * stop someone turning on break-glass access during an incident.
 */
const EA_REQUIRED_CHECKS: { id: EASetupStepId; label: string; satisfied: (ea: EADetail) => boolean }[] = [
  {
    id: 'basic',
    label: 'basic details',
    satisfied: (ea) => ea.name.trim() !== '' && ea.description.trim() !== '',
  },
  // Assignments before eligibility, matching the wizard, the checklist and the tab
  // strip. What the access hands over is the thing being built; who may ask for it
  // is a rule about that thing, so it cannot sensibly be decided first. This array
  // is also what the "Add X and Y" sentence reads, so it has to agree with the lists
  // the reader just scanned.
  {
    id: 'assignments',
    label: 'assignments',
    satisfied: (ea) => {
      const a = getEAAssignments(ea.id);
      return a.entitlements.length + a.technicalRoles.length > 0;
    },
  },
  {
    id: 'eligibility',
    label: 'eligibility criteria',
    satisfied: (ea) => ea.eligibilityGroups.length > 0,
  },
];

/** How many things must be configured before a draft can be switched on. */
export const EA_REQUIRED_STEPS = EA_REQUIRED_CHECKS.length;

/** Whether a setup step gates activation — read off the gate, never re-declared. */
export function isRequiredSetupStep(id: EASetupStepId): boolean {
  return EA_REQUIRED_CHECKS.some((c) => c.id === id);
}

/**
 * What still stands between a draft and being switched on, named in the reader's
 * words.
 *
 * Used by the header's Activate button, the Overview checklist and the V2
 * stepper's preview — two copies of this rule would eventually disagree, and a
 * disabled button whose checklist says everything is done is a bug nobody can
 * diagnose.
 */
export function eaBlockingSteps(ea: EADetail): string[] {
  return EA_REQUIRED_CHECKS.filter((c) => !c.satisfied(ea)).map((c) => c.label);
}

/** Whether a checklist step is done — the same facts the setup card ticks. */
export function isEASetupStepDone(id: EASetupStepId, ea: EADetail): boolean {
  switch (id) {
    case 'basic':
      return ea.name.trim() !== '' && ea.description.trim() !== '';
    case 'assignments': {
      const a = getEAAssignments(ea.id);
      return a.entitlements.length + a.technicalRoles.length > 0;
    }
    case 'eligibility':
      return ea.eligibilityGroups.length > 0;
    case 'owners':
      return ea.ownersCount > 0;
    case 'advanced':
      return true;
  }
}

const SETUP_NEXT_ACTION: Record<EASetupStepId, string> = {
  basic: 'add basic details',
  assignments: 'add assignments',
  eligibility: 'add eligibility criteria',
  owners: 'add owners',
  advanced: 'review advanced configuration',
};

/**
 * What to toast after a setup step *becomes* done. Null when the step was already
 * done (a later edit) or is still unfinished (a removal), so those saves keep
 * their own "saved" / "removed" copy instead of nagging about progress.
 */
export function eaSetupCompletionNotice(
  completedId: EASetupStepId,
  eaAfter: EADetail,
  wasDoneBefore: boolean,
): { title: string; message: string } | null {
  if (!eaAfter.isDraft || wasDoneBefore || !isEASetupStepDone(completedId, eaAfter)) return null;

  const completedLabel = EA_SETUP_STEPS.find((s) => s.id === completedId)?.label ?? completedId;
  const remainingRequired = EA_REQUIRED_CHECKS.filter((c) => !c.satisfied(eaAfter));

  if (remainingRequired.length > 0) {
    return {
      title: `${completedLabel} complete`,
      message: `Next, ${SETUP_NEXT_ACTION[remainingRequired[0].id]}.`,
    };
  }

  if (isRequiredSetupStep(completedId)) {
    return {
      title: 'Required steps complete',
      message: 'Activate now, or add owners and limits.',
    };
  }

  const nextOptional = EA_SETUP_STEPS.find(
    (s) => !isRequiredSetupStep(s.id) && !isEASetupStepDone(s.id, eaAfter),
  );
  return {
    title: `${completedLabel} complete`,
    message: nextOptional
      ? `Next, ${SETUP_NEXT_ACTION[nextOptional.id]}.`
      : 'Ready to activate.',
  };
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

/**
 * Risk on a live profile, from the same score Advanced Configuration edits.
 *
 * Seeded actives carry a number; a draft that was switched on does not — it
 * still has the factory default (84) unless the user changed it. The list used
 * to read only the seed, so Activate produced an Active row with N/A, which is
 * a contradiction: if it can be requested, it has a risk.
 *
 * Drafts stay empty. A score that is not in force is not a score.
 */
function liveRiskChip(
  id: string,
  ea: SeedEmergencyAccess,
  active: boolean,
): EARow['risk'] {
  if (!active) return null;
  const score = advancedConfigById.get(id)?.riskScore ?? ea.riskScore ?? 84;
  const level = riskLevelFromScore(score);
  return { intent: RISK_INTENT[level], label: `${cap(level)} (${score})` };
}

export function riskChipFromScore(score: number): {
  intent: 'info' | 'warning' | 'caution' | 'danger';
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

function sameDays(a: EAWeekday[], b: EAWeekday[]) {
  return [...a].sort().join() === [...b].sort().join();
}

/** True while stored limits still match the values the profile was created with. */
export function isAdvancedConfigDefault(id: string): boolean {
  const current = getAdvancedConfig(id);
  const defaults = defaultAdvancedConfig(id);
  return (
    current.riskScore === defaults.riskScore &&
    current.maxConcurrent === defaults.maxConcurrent &&
    current.maxRequestsPerDay === defaults.maxRequestsPerDay &&
    current.maxDurationHrs === defaults.maxDurationHrs &&
    current.cooldownHrs === defaults.cooldownHrs &&
    current.cooldownMins === defaults.cooldownMins &&
    current.timezone === defaults.timezone &&
    current.windowStart === defaults.windowStart &&
    current.windowEnd === defaults.windowEnd &&
    sameDays(current.days, defaults.days)
  );
}
