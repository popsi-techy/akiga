import {
  APP_SETUP_STEPS,
  isAppSetupStepDone,
  isRequiredAppSetupStep,
  type AppSetupStepId,
} from '@/data/application-setup';
import type { OnboardedApplication } from '@/data/applications-store';

export interface ApplicationSetupStep {
  id: AppSetupStepId;
  label: string;
  /** Which section it opens. */
  tab: string;
  required: boolean;
  done: boolean;
}

/**
 * Which section each setup step is configured in.
 *
 * `basic` is the exception — it opens a drawer, not a section. Its `tab` still has to
 * carry a value, and that value must be one no section uses: while the emergency-access
 * equivalent said `overview` it collided with the real Overview section, so a rail
 * listing both showed Overview under the name "Basic details" and lit it as current.
 * `basic` matches nothing, which is the whole requirement.
 */
const STEP_TAB: Record<AppSetupStepId, string> = {
  basic: 'basic',
  authorization: 'provisioning',
  events: 'provisioning',
  owners: 'owners',
};

/**
 * The setup steps for one application, with where each is done and whether it is.
 *
 * Ordering, labels and required-ness all come from `data/application-setup` — this only
 * adds where a step is edited, which is a fact about the screens rather than the domain.
 * Same split as the emergency-access equivalent, so the two checklists cannot drift into
 * describing their steps differently.
 */
export function applicationSetupSteps(app: OnboardedApplication): ApplicationSetupStep[] {
  return APP_SETUP_STEPS.map((step) => ({
    id: step.id,
    label: step.label,
    tab: STEP_TAB[step.id],
    required: isRequiredAppSetupStep(step.id),
    done: isAppSetupStepDone(step.id, app),
  }));
}
