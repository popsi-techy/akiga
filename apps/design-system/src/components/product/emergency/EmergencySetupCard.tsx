'use client';

import * as React from 'react';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { Button } from '@ds/components';
import {
  eaBlockingSteps,
  isEASetupStepDone,
  isRequiredSetupStep,
  EA_SETUP_STEPS,
  type EADetail,
  type EASetupStepId,
} from '@/data/emergency-access';
import { NextStepsCard, type NextStep } from '../NextStepsCard';

/** The card's own step, plus where this module sends the reader when it is clicked. */
interface Step extends NextStep {
  tab: string;
}

/**
 * What a draft still needs before it can be switched on.
 *
 * Replaces Recent Sessions on a draft, because a profile that has never been
 * activated has no sessions and never will until it is — an empty table there
 * reads as "nobody used it", when the truth is "nobody could".
 *
 * Optional steps are listed but not counted against activation. Owners and
 * advanced limits make a profile *better governed*; eligibility and assignments
 * are what make it *work at all*, and conflating the two would block someone
 * from turning on access during an incident over a missing owner.
 */
export function EmergencySetupCard({
  ea,
  onGoToTab,
  onEditBasics,
  onActivate,
}: {
  ea: EADetail;
  onGoToTab: (tab: string) => void;
  /** Basic details is edited in a drawer, not on a tab — so it needs its own opener. */
  onEditBasics: () => void;
  /** Same action as the header Activate — offered here once the gate is met. */
  onActivate?: () => void;
}) {
  /**
   * Order and labels come from `EA_SETUP_STEPS`; required-ness from the gate. What
   * stays here is only what this screen adds — the sentence, the CTA, the tab a row
   * opens, and whether it is done. The creation drawer renders the same list, so the
   * two cannot tell the reader different stories.
   */
  const EXTRAS: Record<
    EASetupStepId,
    { hint: string; cta: string; tab: string; done: boolean; doneLabel?: string }
  > = {
    basic: {
      hint: 'The name and description shown wherever this access is requested or reviewed.',
      cta: 'Edit details',
      tab: 'overview',
      done: isEASetupStepDone('basic', ea),
    },
    assignments: {
      hint: 'The entitlements and technical roles a session hands over, then takes back.',
      cta: 'Add assignments',
      tab: 'assignments',
      done: isEASetupStepDone('assignments', ea),
    },
    eligibility: {
      hint: 'Who can ask for it — anyone matching the rules in a group becomes eligible.',
      cta: 'Add criteria',
      tab: 'eligibility',
      done: isEASetupStepDone('eligibility', ea),
    },
    owners: {
      hint: 'Who answers for this access when it comes up for review.',
      cta: 'Add owners',
      tab: 'owners',
      done: isEASetupStepDone('owners', ea),
    },
    advanced: {
      hint: 'How long a session lasts, how many run at once, and when it can be requested.',
      cta: 'Review limits',
      tab: 'advanced',
      // Satisfied from the moment the profile exists: it is created with working
      // limits. So it reports the defaults rather than claiming a decision — the
      // reader still needs to know these are worth a look.
      done: true,
      doneLabel: 'Default applied',
    },
  };

  const steps: Step[] = EA_SETUP_STEPS.map((step) => ({
    id: step.id,
    label: step.label,
    required: isRequiredSetupStep(step.id),
    ...EXTRAS[step.id],
  }));

  const canActivate = eaBlockingSteps(ea).length === 0;

  return (
    <NextStepsCard
      title="Recommended next steps to activate this access"
      steps={steps}
      onStep={(id) => {
        // Every other step lives on a tab; this one is a drawer, so routing it to
        // `overview` would have looked like a dead click from the tab it is already on.
        if (id === 'basic') {
          onEditBasics();
          return;
        }
        onGoToTab(steps.find((s) => s.id === id)?.tab ?? 'overview');
      }}
      footer={
        canActivate && onActivate ? (
          <div
            role="status"
            className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--ds-color-status-info-border)] bg-[var(--ds-color-status-info-subtle)] px-3 py-2.5"
          >
            <div className="flex min-w-0 flex-1 items-start gap-2.5">
              <InfoOutlined
                sx={{ fontSize: 18, color: 'var(--ds-color-status-info-fg)' }}
                className="mt-0.5 shrink-0"
                aria-hidden
              />
              <p className="text-body-sm text-[var(--ds-color-status-info-fg)]">
                Required steps are complete. You can activate this emergency access now.
              </p>
            </div>
            <Button onClick={onActivate}>Activate</Button>
          </div>
        ) : undefined
      }
      stepCtaVariant={canActivate ? 'secondary' : 'primary'}
    />
  );
}
