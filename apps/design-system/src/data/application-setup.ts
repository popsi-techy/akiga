/**
 * Application setup — what an onboarded application still needs before IGA can
 * reach it. Same shape as emergency-access setup: a small set of required checks,
 * optional steps that improve governance, one blocking list for the header button.
 */
import type { OnboardedApplication } from './applications-store';
import { listAuthorizations } from './provisioning-auth';
import { eventStatus, listConnectionEvents } from './connection-events';
import { getOwners } from './entity-owners';
import { reconciliationSummary } from './reconciliation';
import { listBaselines } from './baselines';
import { getAppApprovalPolicy } from './app-approval-policy';

function provisioningReady(app: OnboardedApplication) {
  const authorized = listAuthorizations(app.id).some((a) => a.authorized);
  const eventsReady = listConnectionEvents(app.id).some((e) => eventStatus(e) === 'ready');
  return authorized && eventsReady;
}

function reconciliationReady(app: OnboardedApplication) {
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
  applies: (app: OnboardedApplication) => boolean;
  satisfied: (app: OnboardedApplication) => boolean;
}[] = [
  {
    id: 'provisioning',
    label: 'configure',
    // Configure is the connector. Off means IGA will not push access, so there
    // is no authorization or event work to finish before Activate.
    applies: (app) => app.enableProvisioning,
    satisfied: (app) => provisioningReady(app),
  },
];

function requiredChecks(app: OnboardedApplication) {
  return APP_REQUIRED_CHECKS.filter((c) => c.applies(app));
}

/** How many things must be configured before this application can be activated. */
export function requiredAppSetupCount(app: OnboardedApplication): number {
  return requiredChecks(app).length;
}

export function isRequiredAppSetupStep(id: AppSetupStepId, app: OnboardedApplication): boolean {
  return requiredChecks(app).some((c) => c.id === id);
}

export function appBlockingSteps(app: OnboardedApplication): string[] {
  return requiredChecks(app).filter((c) => !c.satisfied(app)).map((c) => c.label);
}

/**
 * Connector surfaces exist only when this application will push access.
 * Off means no Configure tab and no Reconciliation tab — IGA is not going
 * to talk to the system. Activate is still available.
 */
export function applicationShowsConfigure(app: OnboardedApplication): boolean {
  return app.enableProvisioning;
}

export function isAppSetupStepDone(id: AppSetupStepId, app: OnboardedApplication): boolean {
  switch (id) {
    case 'provisioning':
      return provisioningReady(app);
    case 'reconciliation':
      // A freshly onboarded application has nothing to pull yet — that empty
      // state is finished, not missing. Once there is inventory, a sync must
      // have run.
      return reconciliationReady(app);
    case 'owners':
      return getOwners('application', app.id, []).length > 0;
    case 'baseline':
      return listBaselines(app.id).length > 0;
    case 'approval':
      return getAppApprovalPolicy(app.id) != null;
  }
}
