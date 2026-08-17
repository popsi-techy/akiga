'use client';

import * as React from 'react';
import { PageHeader, Section, PropsTable, DoDont } from '@/components/docs/primitives';
import { Button, StepTracker, type StepTrackerStep } from '@ds/components';

const STEPS = [
  { label: 'Certification details', description: 'Name it and choose the applications it covers' },
  { label: 'Users', description: 'The people whose access will be reviewed' },
  { label: 'Reviewers and outcomes', description: 'Who decides, and what happens to access nobody keeps' },
  { label: 'Timeline', description: 'When it runs and how long reviewers get' },
  { label: 'Preview', description: 'Check it, then launch or save for later' },
];

/** The same flow part-way through a run where steps were passed rather than filled. */
const SKIPPED_STEPS: StepTrackerStep[] = [
  { ...STEPS[0], required: true, status: 'done' },
  { ...STEPS[1], required: true, status: 'done' },
  { ...STEPS[2], required: true, status: 'skipped' },
  { ...STEPS[3], status: 'skipped' },
  STEPS[4],
];

export default function StepTrackerDocs() {
  const [step, setStep] = React.useState(2);
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Step Tracker"
        description="A vertical, numbered progress rail for a multi-step form. Sits beside the form for its whole length and can carry a sentence per step."
      />

      <Section
        title="Beside the form, not above it"
        description="Use it when the steps need explaining and the reader will be on the screen long enough to look. Steps behind the reader are clickable; going forward stays the job of the form's own action, which is what decides whether the current step may be left. The steps sit at the top with one spacing between them however tall the panel is — leftover space below is fine."
      >
        <div className="grid gap-6 sm:grid-cols-[300px_minmax(0,1fr)]">
          <div className="h-[520px] rounded-xl border border-border bg-subtle p-5">
            <StepTracker steps={STEPS} current={step} onStepClick={setStep} />
          </div>
          <div className="flex flex-wrap items-start gap-2">
            <Button variant="secondary" size="sm" disabled={step === 0} onClick={() => setStep(step - 1)}>
              Back
            </Button>
            <Button size="sm" disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)}>
              Next step
            </Button>
          </div>
        </div>
      </Section>

      <Section
        title="When a step can be passed"
        description="Some flows let a reader move on without finishing a step — they do not know which entitlements to grant yet, or who should own the thing. Pass `status` per step and the rail stops guessing from position: a step behind the reader with nothing in it reads as skipped rather than done. Mark the steps that gate the flow's goal with `required` and the asterisk answers “can I pass this?” at the step, instead of on the final screen where it is too late to act."
      >
        <div className="grid gap-6 sm:grid-cols-[300px_minmax(0,1fr)]">
          <div className="rounded-xl border border-border bg-subtle p-5">
            <StepTracker steps={SKIPPED_STEPS} current={4} onStepClick={() => {}} />
          </div>
          <div className="space-y-3 text-body-sm text-text-secondary">
            <p>
              Reading down: two steps are finished, one required step was passed and says what that
              cost, one optional step was passed and simply says so, and the reader is on the last.
            </p>
            <p>
              A skipped step stays clickable. Skipping is a deferral, and a rail that will not take
              the reader back makes it a one-way door.
            </p>
            <p>
              Derive the status from the data rather than recording what the reader clicked. Then
              filling a skipped step in later clears the mark by itself, and a step left empty by
              pressing “Continue” is treated the same as one left empty by pressing “Skip”.
            </p>
          </div>
        </div>
      </Section>

      <Section
        title="Stepper or Step Tracker?"
        description="They answer different questions. Stepper says “where am I in a short flow” in a strip above a canvas; Step Tracker says “what are these five things and which have I done” in a column beside a form. A screen needs one of them, never both."
      >
        <DoDont
          dos={[
            'Give every step a description — without one, use the horizontal Stepper instead.',
            'Let a reader jump back to a completed or skipped step; that is the cheapest way to fix a mistake.',
            'Mark required steps in a flow that can be skipped, so “can I pass this?” is answered at the step.',
            'Keep the step count between three and six. Beyond that the flow itself is the problem.',
          ]}
          donts={[
            'Use it for steps that can be done in any order — a numbered column claims a sequence that does not exist.',
            'Let the rail jump forward past the current step. Passing a step is the form’s action to offer, and its footer is where the reader can be told what passing costs.',
            'Mark every step required. If nothing is optional the flag says nothing, and the asterisks stop being read.',
            'Swap a completed step’s number for a tick — the green fill already says done, and losing the number means “step 3 of 5” can no longer be checked against the rail.',
          ]}
        />
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'steps', type: 'StepTrackerStep[]', description: 'Each with a label and an optional description.' },
            { name: 'steps[].status', type: "'done' | 'skipped'", default: '—', description: 'The step’s own state, for flows where position is not the whole story. Omit it and state is derived from `current`. The current step ignores it.' },
            { name: 'steps[].required', type: 'boolean', default: 'false', description: 'Marks a step whose work must exist before the flow’s goal is reachable. Rendered as the same danger asterisk a required field carries.' },
            { name: 'current', type: 'number', description: 'Zero-based index of the step being worked on.' },
            { name: 'onStepClick', type: '(index: number) => void', default: '—', description: 'Jump to a step. Offered for steps behind the reader and any step carrying a `status`.' },
            { name: 'title', type: 'string', default: "'Your progress'", description: 'Heading above the list; also the rail’s accessible name.' },
          ]}
        />
      </Section>
    </>
  );
}
