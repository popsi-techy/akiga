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
import { eventStatus, listConnectionEvents } from './connection-events';
import { getOwners } from './entity-owners';
import { reconciliationSummary } from './reconciliation';
import { listBaselines } from './baselines';
import { getAppApprovalPolicy } from './app-approval-policy';

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
  | 'provisioning'
  | 'reconciliation'
  | 'owners'
  | 'baseline'
  | 'approval';

export const APP_SETUP_STEPS: { id: AppSetupStepId; label: string }[] = [
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

export function isAppSetupStepDone(id: AppSetupStepId, app: AppSetupSubject): boolean {
  switch (id) {
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
