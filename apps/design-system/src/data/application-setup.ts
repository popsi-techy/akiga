/**
 * Application setup — what an onboarded application still needs before IGA can
 * reach it. Same shape as emergency-access setup: a small set of required checks,
 * optional steps that improve governance, one blocking list for the header button.
 */
/**
 * What the setup checklist needs to know about an application.
 *
 * Two fields, because that is all any step reads: the id everything else is looked up by,
 * and whether IGA pushes access into this system. Every other answer — authorizations,
 * inventory, owners, baseline, approval policy — comes from its own store, keyed by id.
 *
 * It used to be typed as the whole `OnboardedApplication`, which is what kept the
 * checklist off catalogued applications: they have the same five steps and no such record,
 * so the guide simply did not exist for them. `OnboardedApplication` still satisfies this
 * structurally, so nothing that passed one needs to change.
 */
export interface AppSetupSubject {
  id: string;
  /** IGA pushes access to this system. Catalogued apps read it from the seed profile. */
  enableProvisioning: boolean;
}
import { listAuthorizations } from './provisioning-auth';
import { EVENT_KINDS, SCIM_EVENT_KINDS, eventStatus, listConnectionEvents } from './connection-events';
import { getOwners } from './entity-owners';
import { reconciliationSummary } from './reconciliation';
import { listBaselines } from './baselines';
import { getAppApprovalPolicy } from './app-approval-policy';
import { applicationIsScimProvisioned } from './scim-inbound';

function provisioningReady(app: AppSetupSubject) {
  const authorized = listAuthorizations(app.id).some((a) => a.authorized);
  const eventsReady = listConnectionEvents(app.id).some((e) => eventStatus(e) === 'ready');
  return authorized && eventsReady;
}

function reconciliationReady(app: AppSetupSubject) {
  // Nothing to pull is only a finished state after IGA can reach the system.
  // An empty inventory before Configure is done is not reconciliation — it is
  // the connector still being missing.
  if (app.enableProvisioning && !provisioningReady(app)) return false;
  const summary = reconciliationSummary(app.id);
  if (summary.lastSync) return true;
  return summary.accounts.total === 0 && summary.entitlements.total === 0;
}

export type AppSetupStepId =
  | 'basic'
  | 'provisioning'
  | 'reconciliation'
  | 'owners'
  | 'baseline'
  | 'approval';

export const APP_SETUP_STEPS: { id: AppSetupStepId; label: string }[] = [
  { id: 'basic', label: 'Basic details' },
  { id: 'provisioning', label: 'Configure' },
  { id: 'reconciliation', label: 'Reconciliation' },
  { id: 'owners', label: 'Owners' },
  { id: 'baseline', label: 'Baseline Access' },
  { id: 'approval', label: 'Approval Policy' },
];

const APP_REQUIRED_CHECKS: {
  id: AppSetupStepId;
  label: string;
  applies: (app: AppSetupSubject) => boolean;
  satisfied: (app: AppSetupSubject) => boolean;
}[] = [
  {
    id: 'basic',
    label: 'basic details',
    // The onboard / create drawer already collected the name. The step is on
    // the checklist so finished work is visible, not so it can block.
    applies: () => true,
    satisfied: () => true,
  },
  {
    id: 'provisioning',
    label: 'configure',
    // Configure is the connector. Off means IGA will not push access, so there
    // is no authorization or event work to finish in Configure.
    applies: (app) => app.enableProvisioning,
    satisfied: (app) => provisioningReady(app),
  },
];

function requiredChecks(app: AppSetupSubject) {
  return APP_REQUIRED_CHECKS.filter((c) => c.applies(app));
}

/** How many required setup checks apply to this application. */
export function requiredAppSetupCount(app: AppSetupSubject): number {
  return requiredChecks(app).length;
}

export function isRequiredAppSetupStep(id: AppSetupStepId, app: AppSetupSubject): boolean {
  return requiredChecks(app).some((c) => c.id === id);
}

export function appBlockingSteps(app: AppSetupSubject): string[] {
  return requiredChecks(app).filter((c) => !c.satisfied(app)).map((c) => c.label);
}

/**
 * Configure exists only when this application will push access.
 * Off hides Configure, not Reconciliation — pulling inventory is a
 * different direction from pushing access.
 */
export function applicationShowsConfigure(app: AppSetupSubject): boolean {
  return app.enableProvisioning;
}

function catalogEventsOf(app: AppSetupSubject) {
  const scim = applicationIsScimProvisioned(app.id);
  const kinds = new Set((scim ? SCIM_EVENT_KINDS : EVENT_KINDS).map((k) => k.value));
  return { scim, events: listConnectionEvents(app.id).filter((e) => kinds.has(e.kind)) };
}

export interface ConfigureSubstep {
  id: string;
  label: string;
  done: boolean;
  hint?: string;
  cta?: string;
}

/**
 * Configure's own jobs — the same items the Configure rail lists. The parent
 * step can be *done* for activation before every job here is.
 */
export function configureSubsteps(app: AppSetupSubject): ConfigureSubstep[] | undefined {
  if (!app.enableProvisioning) return undefined;

  const authorized = listAuthorizations(app.id).some((a) => a.authorized);
  const { scim, events } = catalogEventsOf(app);
  const connection = events.length > 0;
  const manage = events.some((e) => e.enabled);
  const mapping = events
    .filter(
      (e) =>
        e.kind === 'accounts-fetch' || e.kind === 'entitlements-fetch' || e.kind === 'group-membership',
    )
    .some((e) => e.attributes.length > 0);

  const items: ConfigureSubstep[] = [
    {
      id: 'authorization',
      label: 'Authorization',
      done: authorized,
      hint: 'IGA cannot reach this application until it knows how to sign in.',
      cta: 'Add authorization',
    },
    {
      id: 'connection',
      label: scim ? 'Attribute mapping' : 'Connection',
      done: connection,
      hint: scim
        ? "Map IGA attributes to this application's fields."
        : 'Pick the events IGA should listen for once it can sign in.',
      cta: scim ? 'Map attributes' : 'Add events',
    },
  ];
  if (!scim) {
    items.push({
      id: 'advanced',
      label: 'Attribute mapping',
      done: mapping,
      hint: "Map IGA attributes to this application's fields.",
      cta: 'Map attributes',
    });
  }
  items.push({
    id: 'manage',
    label: 'Manage connections',
    done: manage,
    hint: 'Turn on the events this application should run.',
    cta: 'Enable events',
  });
  return items;
}

export function isAppSetupStepDone(id: AppSetupStepId, app: AppSetupSubject): boolean {
  switch (id) {
    case 'basic':
      return true;
    case 'provisioning':
      return provisioningReady(app);
    case 'reconciliation':
      // Empty inventory is finished only after Configure is done. Before that
      // there is nothing to pull because the connector is not there yet.
      return reconciliationReady(app);
    case 'owners':
      return getOwners('application', app.id, []).length > 0;
    case 'baseline':
      return listBaselines(app.id).length > 0;
    case 'approval':
      return getAppApprovalPolicy(app.id) != null;
  }
}
