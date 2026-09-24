import {
  APP_SETUP_STEPS,
  configureSubsteps,
  isAppSetupStepDone,
  isRequiredAppSetupStep,
  type AppSetupStepId,
  type AppSetupSubject,
  type ConfigureSubstep,
} from '@/data/application-setup';

export interface ApplicationSetupStep {
  id: AppSetupStepId;
  label: string;
  hint: string;
  cta: string;
  tab: string;
  required: boolean;
  done: boolean;
  /** Done because the application exists — excluded from the dock's Next prompt. */
  seedDone?: boolean;
  substeps?: ConfigureSubstep[];
}

const COPY: Record<AppSetupStepId, { hint: string; cta: string; tab: string }> = {
  basic: {
    hint: 'The name and description shown wherever this application is listed.',
    cta: 'Edit details',
    tab: 'basic',
  },
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
export function applicationSetupSteps(app: AppSetupSubject): ApplicationSetupStep[] {
  return APP_SETUP_STEPS.filter(
    (step) => step.id !== 'provisioning' || app.enableProvisioning,
  ).map(
    (step) => {
      const copy = COPY[step.id];
      return {
        id: step.id,
        label: step.label,
        required: isRequiredAppSetupStep(step.id, app),
        done: isAppSetupStepDone(step.id, app),
        seedDone: step.id === 'basic',
        substeps: step.id === 'provisioning' ? configureSubsteps(app) : undefined,
        ...copy,
      };
    },
  );
}

/** Whether any setup step for this application is still open. */
export function appSetupIncomplete(app: AppSetupSubject): boolean {
  return applicationSetupSteps(app).some((s) => !s.done);
}

/** First unfinished setup tab, or the last one once everything is in place. */
export function firstUnfinishedAppTab(app: AppSetupSubject): string {
  const steps = applicationSetupSteps(app);
  return steps.find((s) => !s.done)?.tab ?? steps[steps.length - 1].tab;
}
