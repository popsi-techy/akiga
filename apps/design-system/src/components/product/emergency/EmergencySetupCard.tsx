'use client';

import * as React from 'react';
import NotesOutlined from '@mui/icons-material/NotesOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import { Button, useToast } from '@ds/components';
import {
  activateEmergencyAccess,
  eaBlockingSteps,
  getEAAssignments,
  type EADetail,
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
export function EmergencySetupCard({ ea, onGoToTab }: { ea: EADetail; onGoToTab: (tab: string) => void }) {
  const toast = useToast();
  // Read during render, not in an effect: the store is a module-level Map seeded
  // deterministically, so the server and client agree — and an effect would show
  // every step as "To do" for one frame before correcting itself.
  const assignments = React.useMemo(() => getEAAssignments(ea.id), [ea.id]);

  const steps: Step[] = [
    {
      id: 'basic',
      label: 'Basic details',
      hint: 'Name and description',
      icon: <NotesOutlined sx={{ fontSize: 18 }} />,
      required: true,
      done: ea.name.trim() !== '' && ea.description.trim() !== '',
      tab: 'overview',
    },
    {
      id: 'eligibility',
      label: 'Eligibility criteria',
      hint: 'Who may request this access',
      icon: <TuneOutlined sx={{ fontSize: 18 }} />,
      required: true,
      done: ea.eligibilityGroups.length > 0,
      tab: 'eligibility',
    },
    {
      id: 'assignments',
      label: 'Assignments',
      hint: 'What it hands over',
      icon: <AssignmentOutlined sx={{ fontSize: 18 }} />,
      required: true,
      done: assignments.entitlements.length + assignments.technicalRoles.length > 0,
      tab: 'assignments',
    },
    {
      id: 'owners',
      label: 'Owners',
      hint: 'Who answers for it at review',
      icon: <GroupsOutlined sx={{ fontSize: 18 }} />,
      required: false,
      done: ea.ownersCount > 0,
      tab: 'owners',
    },
    {
      id: 'advanced',
      label: 'Advanced configuration',
      hint: 'Duration, concurrency and cooldown limits',
      icon: <SettingsOutlined sx={{ fontSize: 18 }} />,
      required: false,
      done: true,
      tab: 'advanced',
    },
  ];

  // One definition, shared with the header's Activate button — see `eaBlockingSteps`.
  const blocking = eaBlockingSteps(ea);
  const canActivate = blocking.length === 0;

  const activate = () => {
    if (!canActivate) return;
    activateEmergencyAccess(ea.id);
    toast.success(`“${ea.name}” is active. It can now be requested.`);
    // The page reads status on render, so send the reader to the tab that now
    // has something in it.
    onGoToTab('sessions');
  };

  return (
    <NextStepsCard
      steps={steps}
      onStep={(id) => onGoToTab(steps.find((s) => s.id === id)?.tab ?? 'overview')}
      footer={
        <>
          <p className="min-w-0 flex-1 text-body-sm text-text-secondary">
            {canActivate
              ? 'Everything required is in place. Activating lets eligible people request this access.'
              : // Names what is missing rather than just disabling the button —
                // a dead control with no reason is the most common dead end.
                `Add ${blocking.join(' and ')} before this can be activated.`}
          </p>
          <Button startIcon={<CheckCircleOutlined />} disabled={!canActivate} onClick={activate}>
            Activate
          </Button>
        </>
      }
    />
  );
}
