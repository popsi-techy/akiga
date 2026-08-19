/**
 * Application setup — what an onboarded application still needs before IGA can
 * reach it. Same shape as emergency-access setup: a small set of required checks,
 * optional steps that improve governance, one blocking list for the header button.
 */
import type { OnboardedApplication } from './applications-store';
import { listAuthorizations } from './provisioning-auth';
import { eventStatus, listConnectionEvents } from './connection-events';
import { getOwners } from './entity-owners';

export type AppSetupStepId = 'basic' | 'authorization' | 'events' | 'owners';

export const APP_SETUP_STEPS: { id: AppSetupStepId; label: string }[] = [
  { id: 'basic', label: 'Basic details' },
  { id: 'authorization', label: 'Authorization' },
  { id: 'events', label: 'Connection events' },
  { id: 'owners', label: 'Owners' },
];

const APP_REQUIRED_CHECKS: {
  id: AppSetupStepId;
  label: string;
  satisfied: (app: OnboardedApplication) => boolean;
}[] = [
  {
    id: 'basic',
    label: 'basic details',
    satisfied: (app) => app.name.trim() !== '' && app.description.trim() !== '',
  },
  {
    id: 'authorization',
    label: 'authorization',
    satisfied: (app) => listAuthorizations(app.id).some((a) => a.authorized),
  },
  {
    id: 'events',
    label: 'connection events',
    satisfied: (app) => listConnectionEvents(app.id).some((e) => eventStatus(e) === 'ready'),
  },
];

/** How many things must be configured before an application can be connected. */
export const APP_REQUIRED_STEPS = APP_REQUIRED_CHECKS.length;

export function isRequiredAppSetupStep(id: AppSetupStepId): boolean {
  return APP_REQUIRED_CHECKS.some((c) => c.id === id);
}

export function appBlockingSteps(app: OnboardedApplication): string[] {
  return APP_REQUIRED_CHECKS.filter((c) => !c.satisfied(app)).map((c) => c.label);
}

export function isAppSetupStepDone(id: AppSetupStepId, app: OnboardedApplication): boolean {
  switch (id) {
    case 'basic':
      return app.name.trim() !== '' && app.description.trim() !== '';
    case 'authorization':
      return listAuthorizations(app.id).some((a) => a.authorized);
    case 'events':
      return listConnectionEvents(app.id).some((e) => eventStatus(e) === 'ready');
    case 'owners':
      return getOwners('application', app.id, []).length > 0;
  }
}
