import {
  isEASetupStepDone,
  isRequiredSetupStep,
  isAdvancedConfigDefault,
  EA_SETUP_STEPS,
  type EADetail,
  type EASetupStepId,
} from '@/data/emergency-access';
import type { StatusIntent } from '@ds/components';

/** A setup step with everything a surface needs to render and route it. */
export interface EmergencySetupStep {
  id: EASetupStepId;
  label: string;
  /** Why it exists, in the reader's terms — never a restatement of the label. */
  hint: string;
  /** The imperative on the control that goes there. */
  cta: string;
  /** Which tab it opens. `basic` is the exception — a drawer, not a tab. */
  tab: string;
  required: boolean;
  done: boolean;
  /** Qualifier chip under a done step — factory defaults, or that they changed. */
  doneLabel?: string;
  /** Chip colour. Factory defaults stay `info`; a human change is `neutral`. */
  doneLabelIntent?: StatusIntent;
  /**
   * Satisfied without a decision (factory defaults). Does not unlock Next.
   * A “Modified” chip is a decision — pass `false` so it counts.
   */
  passiveDone?: boolean;
  /** Done because the object exists — excluded from the dock's Next prompt. */
  seedDone?: boolean;
}

/**
 * The per-screen copy for each setup step.
 *
 * Kept out of `data/emergency-access` on purpose: the order, the labels and which
 * steps gate activation are domain facts and live there; a hint and a button label are
 * presentation, and a data module should not hold either.
 */
const COPY: Record<
  EASetupStepId,
  { hint: string; cta: string; tab: string; doneLabel?: string }
> = {
  basic: {
    hint: 'The name and description shown wherever this access is requested or reviewed.',
    cta: 'Edit details',
    // Not a section — the only step edited in a drawer, which every caller special-cases
    // on the step id. It still needs a value here, and that value must be one no section
    // uses: while this said `overview` it collided with the real Overview section, so a
    // rail listing both showed Overview under the name "Basic details" and lit it up as
    // current. `basic` matches nothing, which is the whole requirement.
    tab: 'basic',
  },
  assignments: {
    hint: 'The entitlements and technical roles a session hands over, then takes back.',
    cta: 'Add assignments',
    tab: 'assignments',
  },
  eligibility: {
    hint: 'Who can ask for it — anyone matching the rules in a group becomes eligible.',
    cta: 'Add criteria',
    tab: 'eligibility',
  },
  owners: {
    hint: 'Who answers for this access when it comes up for review.',
    cta: 'Add owners',
    tab: 'owners',
  },
  advanced: {
    hint: 'How long a session lasts, how many run at once, and when it can be requested.',
    cta: 'Review limits',
    tab: 'advanced',
    // Always qualified: factory vs a human change. A bare tick would overclaim
    // the factory, and dropping the chip on save left no record of the change.
    doneLabel: 'Default applied',
  },
};

/**
 * Every setup step for a profile, resolved.
 *
 * One derivation for the setup dock. Computing it twice is how two surfaces
 * end up disagreeing about whether a profile is finished.
 *
 * Order and required-ness are read off the domain (`EA_SETUP_STEPS`,
 * `isRequiredSetupStep`), never re-declared here.
 */
export function emergencySetupSteps(ea: EADetail): EmergencySetupStep[] {
  return EA_SETUP_STEPS.map((step) => {
    const copy = COPY[step.id];
    if (step.id === 'advanced') {
      const factory = isAdvancedConfigDefault(ea.id);
      return {
        id: step.id,
        label: step.label,
        required: isRequiredSetupStep(step.id),
        done: isEASetupStepDone(step.id, ea),
        ...copy,
        doneLabel: factory ? 'Default applied' : 'Modified',
        doneLabelIntent: factory ? 'info' : 'neutral',
        // Factory does not unlock Next. A saved change is a decision and does.
        passiveDone: factory,
      };
    }
    return {
      id: step.id,
      label: step.label,
      required: isRequiredSetupStep(step.id),
      done: isEASetupStepDone(step.id, ea),
      seedDone: step.id === 'basic',
      ...copy,
    };
  });
}
