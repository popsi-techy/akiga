'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { SetupBar, Stepper, Button } from '@ds/components';

const STEPS = [{ label: 'Assignments' }, { label: 'Eligibility' }, { label: 'Owners' }, { label: 'Limits' }];

export default function SetupBarDocs() {
  const [current, setCurrent] = React.useState(1);
  const last = current === STEPS.length - 1;
  const ready = current >= 1;

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Setup Bar"
        description="A floating strip under a draft: which step is current, Back and Next through the real editors, and one Activate (or Connect) the moment required work is done. Gone once the object is live."
      />

      <Section
        title="Guide the work that is already on the page"
        description="The bar does not hold forms. It names the step and moves between the tabs or surfaces that do. Pair it with Stepper (cap four) and put the payoff in `primary` only when it can fire."
      >
        <Example label="Interactive — Next, Back, Activate when ready">
          <div className="relative min-h-[140px] rounded-lg bg-subtle p-6">
            <p className="text-body-sm text-text-secondary">Page content sits above the bar.</p>
            <div className="absolute inset-x-4 bottom-4">
              <SetupBar
                progress={<Stepper steps={STEPS} current={current} onStepClick={setCurrent} showBack={false} />}
                actions={
                  <>
                    <Button variant="secondary" disabled={current === 0} onClick={() => setCurrent((c) => Math.max(0, c - 1))}>
                      Back
                    </Button>
                    {!last && (
                      <Button variant={ready ? 'secondary' : 'primary'} onClick={() => setCurrent((c) => Math.min(STEPS.length - 1, c + 1))}>
                        Next
                      </Button>
                    )}
                  </>
                }
                primary={ready ? <Button onClick={() => undefined}>Activate</Button> : undefined}
              />
            </div>
          </div>
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'progress', type: 'ReactNode', description: 'Usually a Stepper. Reports position.' },
            { name: 'actions', type: 'ReactNode', description: 'Back and Next — the path through the steps.' },
            { name: 'primary', type: 'ReactNode', description: 'Activate / Connect. Omit until it can succeed.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Use it on a draft whose editors already live on the page (tabs, not a second wizard).',
            'Remove it when the object is activated — setup is over.',
            'Gate Next on the current required step; let optional steps pass.',
            'Show Activate the moment the gate is met, even mid-flow.',
          ]}
          donts={[
            'Don’t put the form inside the bar.',
            'Don’t keep a disabled Activate next to Next — hide it until it works.',
            'Don’t use it for more than four steps — Stepper’s cap still applies.',
            'Don’t leave it on after go-live; that is a header action now.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { SetupBar } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
