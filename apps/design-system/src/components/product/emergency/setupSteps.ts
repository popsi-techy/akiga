import {
  isEASetupStepDone,
  isRequiredSetupStep,
  EA_SETUP_STEPS,
  type EADetail,
  type EASetupStepId,
} from '@/data/emergency-access';

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
  /** Qualifier for a step that is done without anyone deciding anything. */
  doneLabel?: string;
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
    // Satisfied from the moment the profile exists: it is created with working limits.
    // So it reports the defaults rather than claiming a decision — the reader still
    // needs to know these are worth a look.
    doneLabel: 'Default applied',
  },
};

/**
 * Every setup step for a profile, resolved.
 *
 * One derivation, shared by the V1/V2 checklist card and the V4 dock. Both need the
 * same five things per step — order, label, required, done, and where clicking it
 * goes — and computing that twice is how two surfaces end up disagreeing about
 * whether a profile is finished.
 *
 * Order and required-ness are read off the domain (`EA_SETUP_STEPS`,
 * `isRequiredSetupStep`), never re-declared here.
 */
export function emergencySetupSteps(ea: EADetail): EmergencySetupStep[] {
  return EA_SETUP_STEPS.map((step) => ({
    id: step.id,
    label: step.label,
    required: isRequiredSetupStep(step.id),
    done: isEASetupStepDone(step.id, ea),
    ...COPY[step.id],
  }));
}
