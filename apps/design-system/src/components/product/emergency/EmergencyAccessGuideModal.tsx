'use client';

import * as React from 'react';
import MenuBookOutlined from '@mui/icons-material/MenuBookOutlined';
import { Button, Modal, Tooltip } from '@ds/components';
import { SegmentedDonut } from '@/components/product/SetupProgress';
import { EA_SETUP_STEPS, isRequiredSetupStep, type EASetupStepId } from '@/data/emergency-access';

const GUIDE_INTRO: Record<EASetupStepId, string> = {
  basic:
    'Name the profile and say when it should be used. This is the only step in the create drawer — everything else happens on the draft.',
  assignments:
    'Choose the entitlements and technical roles a session hands over, then takes back when it ends.',
  eligibility:
    'Define who can ask for it. Anyone matching a group’s rules becomes eligible to request a session.',
  owners: 'Name who answers for this access when it comes up for review. Optional — it does not block activation.',
  advanced:
    'How long a session lasts, how many can run at once, and when it can be requested. Sensible defaults are already in place.',
};

/**
 * After Continue, basic details are already saved. The remaining steps need more
 * than a one-line hint: what to put in, and whether Activate waits for it.
 */
const GUIDE_NEXT: Record<Exclude<EASetupStepId, 'basic'>, string> = {
  assignments:
    'Required before activation. Pick the entitlements and technical roles a session actually grants — and takes back when it ends. At least one assignment is needed; without it the profile has nothing to hand over.',
  eligibility:
    'Required before activation. Define who may request a session. Anyone matching a group’s rules becomes eligible; everyone else cannot ask. Add at least one group so the request path has an audience.',
  owners:
    'Optional. Name who answers for this access when it comes up for review. You can activate without owners, but naming them now means later reviews have a clear owner from day one.',
  advanced:
    'Optional. Session length, how many can run at once, cooldown, request window and timezone. Sensible defaults are already applied — change them only if this access needs tighter or looser limits.',
};

/**
 * The book control that opens the setup guide.
 *
 * V1: toggles the right-hand checklist, next to More. V3: still the overflow
 * menu item that opens the modal. The reader asks for it — Continue does not
 * force a popup.
 */
export function EmergencyAccessGuideButton({
  onClick,
  labeled = false,
  expanded,
  progress,
}: {
  onClick: () => void;
  /** Rail has room for the words; the setup bar does not. */
  labeled?: boolean;
  /** When this control shows or hides a panel. */
  expanded?: boolean;
  /** Required-step count. When set, a donut wraps the book. */
  progress?: { done: number; total: number };
}) {
  const book = <MenuBookOutlined sx={{ fontSize: progress ? 16 : 18 }} />;
  const glyph =
    progress != null ? (
      <span className="relative grid h-8 w-8 place-items-center">
        <span className="absolute inset-0">
          <SegmentedDonut done={progress.done} total={progress.total} size={32} thickness={2.5} />
        </span>
        {book}
      </span>
    ) : (
      book
    );
  const action = expanded ? 'Hide setup checklist' : 'Setup guide';
  const progressLabel =
    progress != null ? `${progress.done} of ${progress.total} required steps complete. ` : '';

  if (labeled) {
    return (
      <Button
        variant="tertiary"
        size="sm"
        startIcon={glyph}
        onClick={onClick}
      >
        Setup guide
      </Button>
    );
  }
  return (
    <Tooltip title={`${progressLabel}${action}`}>
      <Button
        variant="tertiary"
        size="sm"
        aria-label={`${progressLabel}${action}`}
        aria-expanded={expanded}
        onClick={onClick}
        sx={{ minWidth: 36, px: 0 }}
      >
        {glyph}
      </Button>
    </Tooltip>
  );
}

type IntroProps = {
  open: boolean;
  onClose: () => void;
  variant?: 'intro';
  onCreate: () => void;
};

type NextStepsProps = {
  open: boolean;
  onClose: () => void;
  variant: 'next-steps';
};

/**
 * What creating emergency access involves, in the same order as the draft checklist.
 *
 * `intro` is the empty-list first-run: the profile does not exist yet, so the
 * last action is Create. `next-steps` is opened from Setup guide on a draft —
 * basic details are done, required work is still ahead, and Got it is enough.
 */
export function EmergencyAccessGuideModal(props: IntroProps | NextStepsProps) {
  const { open, onClose } = props;
  const nextSteps = props.variant === 'next-steps';
  const steps = nextSteps ? EA_SETUP_STEPS.filter((step) => step.id !== 'basic') : EA_SETUP_STEPS;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={nextSteps ? 'Finish setting up this access' : 'How emergency access is set up'}
      subtitle={
        nextSteps
          ? 'Name and description are saved. Complete the required steps, then Activate. Reopen this guide anytime from Setup guide on this page.'
          : 'Create a draft, finish the required steps, then activate it from the header.'
      }
      icon={<MenuBookOutlined sx={{ fontSize: 20 }} />}
      width={560}
      footer={
        nextSteps ? (
          <Button onClick={onClose}>Got it</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={() => {
                onClose();
                props.onCreate();
              }}
            >
              Create emergency access
            </Button>
          </>
        )
      }
    >
      <ol className="m-0 list-none space-y-4 p-0">
        {steps.map((step, i) => {
          const required = isRequiredSetupStep(step.id);
          const copy = nextSteps
            ? GUIDE_NEXT[step.id as Exclude<EASetupStepId, 'basic'>]
            : GUIDE_INTRO[step.id];
          return (
            <li key={step.id} className="flex gap-3">
              <span
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-subtle text-caption-strong text-text-secondary tabular-nums"
                aria-hidden
              >
                {i + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <div className="text-body-sm-strong text-text-primary">
                  {step.label}
                  {required && (
                    <>
                      <span aria-hidden className="text-danger">
                        {' *'}
                      </span>
                      <span className="sr-only">Required</span>
                    </>
                  )}
                </div>
                <p className="mt-0.5 text-caption text-text-secondary">{copy}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Modal>
  );
}

export default EmergencyAccessGuideModal;
