'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { Button, ProgressRing } from '@ds/components';

export default function ProgressRingDocs() {
  const [done, setDone] = React.useState(1);
  const total = 3;
  const complete = done >= total;

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Progress Ring"
        description="“N of M done”, small enough to sit inside a button. For a control that stays disabled until a countable set of things is finished — the ring says how far off it is, in the place the reader is already looking."
      />

      <Section
        title="In the control it gates"
        description="Press the button to add a step. The arc closes as the count rises; the last one swaps it for a tick that draws itself, and the label stops describing a state and becomes a verb."
      >
        <Example label="disabled until complete">
          <div className="flex items-center gap-4">
            <Button
              startIcon={
                <ProgressRing
                  value={done}
                  total={total}
                  accent={complete ? undefined : 'var(--ds-color-status-success-fill)'}
                />
              }
              disabled={!complete}
              onClick={() => undefined}
            >
              {complete ? 'Activate' : `${done} of ${total} required`}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setDone((d) => (d >= total ? 0 : d + 1))}>
              {complete ? 'Reset' : 'Complete a step'}
            </Button>
          </div>
        </Example>
      </Section>

      <Section title="Sizes" description="Sized for an icon slot. Larger than about 24px and a segmented indicator reads better.">
        <Example label="14 · 18 (default) · 24">
          <div className="flex items-center gap-4 text-text-secondary">
            <ProgressRing value={2} total={3} size={14} />
            <ProgressRing value={2} total={3} />
            <ProgressRing value={2} total={3} size={24} thickness={3} />
          </div>
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'value', type: 'number', description: 'How many are done. Clamped to total.' },
            { name: 'total', type: 'number', description: 'How many there are in all.' },
            { name: 'size', type: 'number', default: '18', description: 'Box size in px, sized for a button icon slot.' },
            { name: 'thickness', type: 'number', default: '2', description: 'Ring thickness in px.' },
            { name: 'accent', type: 'string', default: 'currentColor', description: 'Colour of the completed arc. Pass a token when the host is disabled — inheriting draws the informative part in the host’s dimmest colour.' },
          ]}
        />
        <Code>{`import { ProgressRing } from '@ds/components';`}</Code>
      </Section>

      <Section title="Do / Don’t">
        <DoDont
          dos={[
            'Put it in the control it describes, so “why is this dead” and “how far off” are one glance.',
            'Pair it with a label that states the count — the ring is aria-hidden on purpose.',
            'Give the arc an accent when the host is disabled — the track and tick should still inherit.',
            'Count only what actually gates the action.',
          ]}
          donts={[
            'Don’t use it as a standalone indicator — that is SetupProgress, which has room to be counted.',
            'Don’t colour the track or the tick; those must follow the host’s state.',
            'Don’t animate anything but the completion moment.',
            'Don’t use it for a continuous proportion — that is a Meter.',
          ]}
        />
      </Section>
    </>
  );
}
