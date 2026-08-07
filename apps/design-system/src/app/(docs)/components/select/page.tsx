'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { Select } from '@ds/components';

const durations = [
  { value: '1', label: '1 hour' },
  { value: '4', label: '4 hours' },
  { value: '8', label: '8 hours' },
  { value: '24', label: '24 hours' },
];

export default function SelectDocs() {
  const [a, setA] = React.useState('4');
  const [b, setB] = React.useState('');
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Select"
        description="A single-choice dropdown built on MUI's select-mode field, so it shares the exact label, helper, error, and sizing treatment as Input. Options are passed declaratively as data."
      />

      <Section title="Basic">
        <Example label="selected value">
          <div className="w-64">
            <Select label="Max duration" options={durations} value={a} onChange={setA} />
          </div>
        </Example>
      </Section>

      <Section title="Placeholder & error">
        <Example label="placeholder · error state">
          <div className="w-64">
            <Select label="Duration" options={durations} value={b} onChange={setB} placeholder="Select duration" />
          </div>
          <div className="w-64">
            <Select label="Duration" options={durations} value="" onChange={() => {}} placeholder="Select duration" error="Duration is required" />
          </div>
        </Example>
      </Section>

      <Section title="Sizes">
        <Example label="sm · md">
          <div className="w-52"><Select label="Small" size="sm" options={durations} value={a} onChange={setA} /></div>
          <div className="w-52"><Select label="Medium" size="md" options={durations} value={a} onChange={setA} /></div>
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'options', type: 'SelectOption[]', description: '{ value, label, disabled? } items.' },
            { name: 'value / onChange', type: 'string / (v) => void', description: 'Controlled value.' },
            { name: 'label', type: 'string', description: 'Visible field label.' },
            { name: 'placeholder', type: 'string', description: 'Shown when no value is selected.' },
            { name: 'error', type: 'string', description: 'Error message + error state.' },
            { name: 'size', type: "'sm' | 'md'", default: "'md'", description: 'Control height.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Use for a single choice from a known list.',
            'Provide a label and, when unset, a placeholder.',
            'Keep option labels short and scannable.',
            'Use Input with search for very long lists later.',
          ]}
          donts={[
            'Don’t use a select for 2 mutually exclusive options (use a toggle/radio).',
            'Don’t rely on placeholder as the label.',
            'Don’t nest rich content in options.',
            'Don’t leave a required select without validation.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { Select } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
