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

const STEP_TAB: Record<AppSetupStepId, string> = {
  provisioning: 'provisioning',
  reconciliation: 'reconciliation',
  owners: 'owners',
  baseline: 'baseline',
  approval: 'approval',
};

/**
 * The setup steps for one application, with where each is done and whether it is.
 *
 * Ordering, labels and required-ness all come from `data/application-setup` — this only
 * adds where a step is edited, which is a fact about the screens rather than the domain.
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
