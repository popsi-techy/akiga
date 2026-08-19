'use client';

import * as React from 'react';
import NotesOutlined from '@mui/icons-material/NotesOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import {
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
  // Read during render, not in an effect: the store is a module-level Map seeded
  // deterministically, so the server and client agree — and an effect would show
  // every step as "Pending" for one frame before correcting itself.
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
      // Satisfied from the moment the profile exists: it is created with working
      // limits. So it reports the defaults rather than claiming a decision — the
      // reader still needs to know these are worth a look.
      done: true,
      doneLabel: 'Default applied',
      tab: 'advanced',
    },
  ];

  // One definition, shared with the header's Activate button — see `eaBlockingSteps`.
  const blocking = eaBlockingSteps(ea);
  const canActivate = blocking.length === 0;

  return (
    <NextStepsCard
      steps={steps}
      onStep={(id) => onGoToTab(steps.find((s) => s.id === id)?.tab ?? 'overview')}
      footer={
        /* The sentence stays; the Activate button that used to sit beside it does
           not. The header's own Activate now carries the progress ring and the same
           gate, so this was a second control for one action — two places to press,
           two things to keep in step, and the reader having to work out whether they
           differ. The checklist's job is to say what is left; the header's is to do
           it. */
        <p className="min-w-0 flex-1 text-body-sm text-text-secondary">
          {canActivate
            ? 'Everything required is in place — activate from the header above.'
            : // Names what is missing rather than leaving the reader to infer it
              // from a control that has gone quiet somewhere else on the page.
              `Add ${blocking.join(' and ')} before this can be activated.`}
        </p>
      }
    />
  );
}
