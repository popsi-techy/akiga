'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { Stepper, Button } from '@ds/components';

const STEPS = [{ label: 'Select access' }, { label: 'Set duration' }, { label: 'Preview & activate' }];

export default function StepperDocs() {
  const [current, setCurrent] = React.useState(1);

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Stepper"
        description="A horizontal, numbered progress indicator for short linear flows. Steps keep their number throughout, so “step 2” means the same thing on every screen of the wizard."
      />

      <Section
        title="Three states, one number"
        description="Completed steps take a success fill, the current step is brand-filled, and upcoming steps stay muted. Right chevrons join them to signal forward progression."
      >
        <Example label="Interactive — click a step, or use the back arrow">
          <div className="w-full">
            <Stepper steps={STEPS} current={current} onStepClick={setCurrent} />
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}>
                Back
              </Button>
              <Button onClick={() => setCurrent((c) => Math.min(STEPS.length - 1, c + 1))} disabled={current === STEPS.length - 1}>
                Next
              </Button>
            </div>
          </div>
        </Example>
        <Example label="First step — no back arrow, because there is nowhere to go">
          <Stepper steps={STEPS} current={0} onStepClick={() => {}} />
        </Example>
      </Section>

      <Section
        title="The back arrow, and when to suppress it"
        description="From step 2 onward a back arrow sits beside step 1 for quick return. Set showBack={false} on a step that owns its own way back — a final review screen, say, where an explicit Edit action belongs with the content being edited rather than in the progress indicator."
      >
        <Example label="showBack={false} on a review step">
          <Stepper steps={STEPS} current={2} onStepClick={() => {}} showBack={false} />
        </Example>
        <PropsTable
          rows={[
            { name: 'steps', type: 'StepperStep[]', description: 'Ordered steps, each with a label. Keep to three or four.' },
            { name: 'current', type: 'number', description: 'Zero-based index of the active step.' },
            { name: 'onStepClick', type: '(index: number) => void', description: 'Makes steps and the back arrow clickable. Omit for a read-only indicator.' },
            { name: 'showBack', type: 'boolean', default: 'true', description: 'Back arrow beside step 1, from step 2 onward.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Use it in the canvas-workspace band, where it replaces the page title.',
            'Keep labels to two or three words — they sit on one line beside the number.',
            'Let users click back to a completed step; forward should stay gated by validity.',
            'Pair it with a persistent action bar whose primary is disabled-with-a-tooltip, never absent.',
          ]}
          donts={[
            'Don’t use it for more than four steps — that is a checklist or a saved draft flow.',
            'Don’t renumber steps as the flow branches; the number is the user’s anchor.',
            'Don’t make it the only way back when a step has its own Edit affordance.',
            'Don’t use it for non-linear navigation; that is Tabs or NavList.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { Stepper } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
