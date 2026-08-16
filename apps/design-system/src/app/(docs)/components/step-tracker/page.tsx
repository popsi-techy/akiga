'use client';

import * as React from 'react';
import { PageHeader, Section, PropsTable, DoDont } from '@/components/docs/primitives';
import { Button, StepTracker } from '@ds/components';

const STEPS = [
  { label: 'Certification details', description: 'Name it and choose the applications it covers' },
  { label: 'Users', description: 'The people whose access will be reviewed' },
  { label: 'Reviewers and outcomes', description: 'Who decides, and what happens to access nobody keeps' },
  { label: 'Timeline', description: 'When it runs and how long reviewers get' },
  { label: 'Preview', description: 'Check it, then launch or save for later' },
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
        description="Use it when the steps need explaining and the reader will be on the screen long enough to look. Completed steps are clickable; going forward stays the job of the form's own action, which is what validates the current step. `fill` stretches the rail down the container so it occupies the panel it sits in rather than bunching at the top."
      >
        <div className="grid gap-6 sm:grid-cols-[300px_minmax(0,1fr)]">
          <div className="h-[520px] rounded-xl border border-border bg-subtle p-5">
            <StepTracker steps={STEPS} current={step} onStepClick={setStep} fill />
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
        title="Stepper or Step Tracker?"
        description="They answer different questions. Stepper says “where am I in a short flow” in a strip above a canvas; Step Tracker says “what are these five things and which have I done” in a column beside a form. A screen needs one of them, never both."
      >
        <DoDont
          dos={[
            'Give every step a description — without one, use the horizontal Stepper instead.',
            'Let a reader jump back to a completed step; that is the cheapest way to fix a mistake.',
            'Keep the step count between three and six. Beyond that the flow itself is the problem.',
          ]}
          donts={[
            'Use it for steps that can be done in any order — a numbered column claims a sequence that does not exist.',
            'Allow a jump forward past the current step: nothing has validated the step being skipped.',
            'Swap a completed step’s number for a tick — the fill already says done, and losing the number means “step 3 of 5” can no longer be checked against the rail.',
          ]}
        />
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'steps', type: 'StepTrackerStep[]', description: 'Each with a label and an optional description.' },
            { name: 'current', type: 'number', description: 'Zero-based index of the step being worked on.' },
            { name: 'onStepClick', type: '(index: number) => void', default: '—', description: 'Jump to a step. Only completed steps are offered.' },
            { name: 'title', type: 'string', default: "'Your progress'", description: 'Heading above the list; also the rail’s accessible name.' },
            { name: 'fill', type: 'boolean', default: 'false', description: 'Stretch to the container’s height, spreading the steps down it. No effect unless the parent constrains height.' },
          ]}
        />
      </Section>
    </>
  );
}
