'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { SetupChecklistDock, type SetupChecklistStep } from '@ds/components';

const INITIAL: SetupChecklistStep[] = [
  {
    id: 'basic',
    label: 'Basic details',
    hint: 'The name shown wherever this is requested.',
    cta: 'Edit details',
    tab: 'basic',
    required: true,
    done: true,
    seedDone: true,
  },
  {
    id: 'assignments',
    label: 'Assignments',
    hint: 'What a session hands over, then takes back.',
    cta: 'Add assignments',
    tab: 'assignments',
    required: true,
    done: false,
  },
  {
    id: 'eligibility',
    label: 'Eligibility',
    hint: 'Who can ask for it.',
    cta: 'Add criteria',
    tab: 'eligibility',
    required: true,
    done: false,
  },
  {
    id: 'owners',
    label: 'Owners',
    hint: 'Who answers for this at review.',
    cta: 'Add owners',
    tab: 'owners',
    required: false,
    done: false,
  },
  {
    id: 'advanced',
    label: 'Limits',
    hint: 'How long a session lasts.',
    cta: 'Review limits',
    tab: 'advanced',
    required: false,
    done: true,
    doneLabel: 'Default applied',
    passiveDone: true,
  },
];

export default function SetupChecklistDockDocs() {
  const [steps, setSteps] = React.useState(INITIAL);
  const [tab, setTab] = React.useState('overview');
  const [open, setOpen] = React.useState(true);

  const finishAssignments = () => {
    setSteps((prev) => prev.map((s) => (s.id === 'assignments' ? { ...s, done: true } : s)));
    setTab('assignments');
  };

  if (!open) {
    return (
      <>
        <PageHeader
          eyebrow="Components"
          title="Setup Checklist Dock"
          description="Remaining work, docked to the right of a draft. Not a second navigator — the tabs still are."
        />
        <Section title="Closed">
          <button type="button" className="text-body-sm text-text-brand" onClick={() => setOpen(true)}>
            Show the dock again
          </button>
        </Section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Setup Checklist Dock"
        description="Remaining work, docked to the right of a draft. The Next prompt appears only after someone actually finishes a step — a seedDone name or a passiveDone factory chip does not count. A “Modified” chip does."
      />

      <Section
        title="Finish one step and the next prompt appears"
        description="Basic is seedDone (the object exists). Limits show “Default applied”. Mark Assignments done and Eligibility gets the Next CTA — unless you are already on that tab."
      >
        <Example label="interactive">
          <div className="flex h-[520px] overflow-hidden rounded-lg border border-border">
            <div className="min-w-0 flex-1 bg-canvas p-5">
              <p className="text-body-sm text-text-secondary">Current tab: {tab}</p>
              <button
                type="button"
                className="mt-3 text-body-sm text-text-brand"
                onClick={finishAssignments}
              >
                Mark Assignments done
              </button>
            </div>
            <SetupChecklistDock
              steps={steps}
              currentTab={tab}
              onClose={() => setOpen(false)}
              onGoTo={(step) => setTab(step.tab)}
            />
          </div>
        </Example>
      </Section>

      <Section title="When to use">
        <DoDont
          dos={[
            'A draft object whose editors already live on the page (tabs).',
            'Mark existence-only steps `seedDone` so a new draft does not prompt.',
            'Pass `gateVerb="connect"` when the header action is Connect, not Activate.',
          ]}
          donts={[
            'SetupBar. That floating strip has no product caller; this is the live pattern.',
            'A left rail of the same steps. The tabs are the navigator.',
            'Hardcoding a step id inside the dock. Domain facts stay on the caller.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { SetupChecklistDock } from '@ds/components';`}</Code>
        </p>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'steps', type: 'SetupChecklistStep[]', description: '{ id, label, hint, cta, tab, required, done, doneLabel?, doneLabelIntent?, passiveDone?, seedDone? }.' },
            { name: 'currentTab', type: 'string', description: 'The open section. The matching row is current; it does not get a Next CTA.' },
            { name: 'onClose', type: '() => void', description: 'Hides the dock.' },
            { name: 'onGoTo', type: '(step) => void', description: 'Opens the step’s tab or drawer.' },
            { name: 'gateVerb', type: "'activate' | 'connect'", default: "'activate'", description: 'Copy for the header and group headings.' },
          ]}
        />
      </Section>
    </>
  );
}
