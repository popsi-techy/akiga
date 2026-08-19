'use client';

import * as React from 'react';
import MenuBookOutlined from '@mui/icons-material/MenuBookOutlined';
import { Button, Modal } from '@ds/components';
import { EA_SETUP_STEPS, isRequiredSetupStep, type EASetupStepId } from '@/data/emergency-access';

const GUIDE: Record<EASetupStepId, string> = {
  basic: 'Name the profile and say when it should be used. This is the only step in the create drawer — everything else happens on the draft.',
  assignments: 'Choose the entitlements and technical roles a session hands over, then takes back when it ends.',
  eligibility: 'Define who can ask for it. Anyone matching a group’s rules becomes eligible to request a session.',
  owners: 'Name who answers for this access when it comes up for review. Optional — it does not block activation.',
  advanced: 'How long a session lasts, how many can run at once, and when it can be requested. Sensible defaults are already in place.',
};

/**
 * What creating emergency access involves, in the same order as the draft checklist.
 *
 * A first-run empty state cannot send the reader to a profile that does not exist
 * yet, so the steps have to live here — Modal, not Dialog, because this is
 * supporting content rather than a yes/no.
 */
export function EmergencyAccessGuideModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="How emergency access is set up"
      subtitle="Create a draft, finish the required steps, then activate it from the header."
      icon={<MenuBookOutlined sx={{ fontSize: 20 }} />}
      width={520}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => {
              onClose();
              onCreate();
            }}
          >
            Create emergency access
          </Button>
        </>
      }
    >
      <ol className="m-0 list-none space-y-4 p-0">
        {EA_SETUP_STEPS.map((step, i) => {
          const required = isRequiredSetupStep(step.id);
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
                <p className="mt-0.5 text-caption text-text-secondary">{GUIDE[step.id]}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Modal>
  );
}

export default EmergencyAccessGuideModal;
