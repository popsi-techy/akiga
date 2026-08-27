import {
  APP_SETUP_STEPS,
  isAppSetupStepDone,
  isRequiredAppSetupStep,
  type AppSetupStepId,
} from '@/data/application-setup';
import type { OnboardedApplication } from '@/data/applications-store';
import { reconciliationSummary } from '@/data/reconciliation';

export interface ApplicationSetupStep {
  id: AppSetupStepId;
  label: string;
  hint: string;
  cta: string;
  tab: string;
  required: boolean;
  done: boolean;
  doneLabel?: string;
}

const COPY: Record<AppSetupStepId, { hint: string; cta: string; tab: string }> = {
  provisioning: {
    hint: 'How IGA reaches this application — authorize it and pick the events to listen for.',
    cta: 'Configure',
    tab: 'provisioning',
  },
  reconciliation: {
    hint: 'Pull accounts and entitlements so IGA has an inventory to govern.',
    cta: 'Review inventory',
    tab: 'reconciliation',
  },
  owners: {
    hint: 'Who answers for this application when access is requested or attested.',
    cta: 'Add owners',
    tab: 'owners',
  },
  baseline: {
    hint: 'The entitlements every user of this application should hold by default.',
    cta: 'Set baseline',
    tab: 'baseline',
  },
  approval: {
    hint: 'Which policy decides who may grant access to this application.',
    cta: 'Choose policy',
    tab: 'approval',
  },
};

/**
 * The setup steps for one application, with where each is done and whether it is.
 *
 * Ordering, labels and required-ness all come from `data/application-setup` — this only
 * adds where a step is edited, which is a fact about the screens rather than the domain.
 */
export function applicationSetupSteps(app: OnboardedApplication): ApplicationSetupStep[] {
  return APP_SETUP_STEPS.map((step) => {
    const copy = COPY[step.id];
    const done = isAppSetupStepDone(step.id, app);
    const emptyInventory = step.id === 'reconciliation' && !reconciliationSummary(app.id).lastSync;
    return {
      id: step.id,
      label: step.label,
      required: isRequiredAppSetupStep(step.id),
      done,
      ...copy,
      doneLabel: done && emptyInventory ? 'Nothing to pull' : undefined,
    };
  });
}

/** First unfinished setup tab, or the last one once everything is in place. */
export function firstUnfinishedAppTab(app: OnboardedApplication): string {
  const steps = applicationSetupSteps(app);
  return steps.find((s) => !s.done)?.tab ?? steps[steps.length - 1].tab;
}
