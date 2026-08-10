'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { Meter } from '@ds/components';

export default function MeterDocs() {
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Meter"
        description="A slim proportion bar for completion and coverage. Tone is semantic and separate from the brand accent — a meter says how healthy something is, not that it is selected."
      />

      <Section
        title="Tones"
        description="brand is neutral progress — how far along you are. success, warning and danger are judgements — how good the number is. Pick the one that matches what the reader should conclude."
      >
        <Example label="With label and value">
          <div className="w-full max-w-md space-y-4">
            <Meter tone="success" value={94} label="Ownership coverage" valueLabel="94%" />
            <Meter tone="warning" value={69} label="Governance coverage" valueLabel="69%" />
            <Meter tone="danger" value={38} label="Review completion" valueLabel="38%" />
            <Meter tone="brand" value={60} label="Campaign progress" valueLabel="3 of 5 steps" />
          </div>
        </Example>
        <Example label="Bare — inside a stat cell, where the number is already shown">
          <div className="w-40">
            <Meter size="sm" tone="success" value={92} />
          </div>
          <div className="w-40">
            <Meter size="md" tone="danger" value={21} />
          </div>
        </Example>
      </Section>

      <Section
        title="A bar is a graphic, so it uses fill"
        description="Tones resolve to the status fill roles rather than the text roles. The text roles are tuned for 4.5:1 against a background and read heavy as a solid block; the fill roles are the ones chosen to clear 3:1 as a graphical object under WCAG 1.4.11."
      >
        <PropsTable
          rows={[
            { name: 'value', type: 'number', description: 'Current amount. Clamped to 0–100% of max.' },
            { name: 'max', type: 'number', default: '100', description: 'The whole. Pass a raw total to avoid computing a percentage.' },
            { name: 'tone', type: "'brand' | 'success' | 'warning' | 'danger'", default: "'brand'", description: 'brand for neutral progress; the rest are judgements.' },
            { name: 'label', type: 'ReactNode', description: 'Left side of the row above the bar.' },
            { name: 'valueLabel', type: 'ReactNode', description: 'Right side of that row — the number, tabular.' },
            { name: 'size', type: "'sm' | 'md'", default: "'md'", description: 'Bar height: sm 6px, md 8px.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Always give the number in text as well — the bar is the shape, not the value.',
            'Use max with a raw total rather than pre-computing a percentage.',
            'Keep one tone rule per surface, so 90% never looks good in one place and bad in another.',
            'Use size="sm" when the meter supports a stat rather than being the stat.',
          ]}
          donts={[
            'Don’t use it for indeterminate loading — it reports a real value to assistive tech.',
            'Don’t stack many meters in one card; that is a chart.',
            'Don’t use brand tone to mean “good” — brand is not a status colour.',
            'Don’t animate the value on page load; it is data, and data does not move.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { Meter } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
