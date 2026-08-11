'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { Radio, DataTable, type Column } from '@ds/components';

type Person = { id: string; name: string; email: string };
const PEOPLE: Person[] = [
  { id: 'rev-amelia', name: 'Amelia Ford', email: 'amelia.ford@acme.com' },
  { id: 'rev-marcus', name: 'Marcus Lee', email: 'marcus.lee@acme.com' },
  { id: 'rev-priya', name: 'Priya Sharma', email: 'priya.sharma@acme.com' },
];
const COLUMNS: Column<Person>[] = [
  { id: 'name', header: 'Name', sortable: true, value: (r) => r.name },
  { id: 'email', header: 'Email', sortable: true, value: (r) => r.email },
];

export default function RadioDocs() {
  const [choice, setChoice] = React.useState('rev-marcus');
  const [picked, setPicked] = React.useState<string[]>(['rev-amelia']);

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Radio"
        description="The canonical 18px radio dot — the single-choice partner to Checkbox. Same metrics, same control-boundary token, so a single-select table and a multi-select table put their control on the same optical column."
      />

      <Section
        title="States"
        description="Unselected, selected, and disabled. A radio has no mixed state — that belongs to Checkbox."
      >
        <Example label="Basic">
          {PEOPLE.map((p) => (
            <Radio key={p.id} checked={choice === p.id} onChange={() => setChoice(p.id)} label={p.name} />
          ))}
        </Example>
        <Example label="Disabled">
          <Radio checked disabled label="Locked by policy" />
          <Radio checked={false} disabled label="Unavailable" />
        </Example>
      </Section>

      <Section
        title="A radio never un-checks itself"
        description="Choosing another option is what clears it, so onChange takes no argument — it reports selection, not a toggle. Clicking the selected radio again is a no-op rather than a clear, which is what stops a single-select table from reaching zero rows by accident."
      >
        <Example label="Re-clicking the selected option does nothing">
          <Radio checked onChange={() => {}} label="Already selected — click me" />
        </Example>
      </Section>

      <Section
        title="In a DataTable"
        description={'DataTable selectionMode="single" swaps the checkboxes for radios and drops the select-all header — the control itself tells the user how many they may choose, before they try. Selection is still reported as an array so consumers keep one shape.'}
      >
        <Example label='selectionMode="single"'>
          <div className="w-full">
            <DataTable<Person>
              columns={COLUMNS}
              rows={PEOPLE}
              selectable
              selectionMode="single"
              selectedIds={picked}
              onSelectionChange={setPicked}
            />
          </div>
        </Example>
      </Section>

      <Section
        title="Contrast is why this is not a hairline"
        description="Same reasoning as Checkbox: WCAG 1.4.11 asks 3:1 on a control boundary, and border.default reaches 1.28:1, border.strong 1.66:1. The unselected ring uses border.control, which check:contrast enforces against both surface and subtle."
      >
        <PropsTable
          rows={[
            { name: 'checked', type: 'boolean', description: 'Selected state. Controlled — the parent owns it.' },
            { name: 'onChange', type: '() => void', description: 'Fires when this option is chosen. Never fires to un-choose.' },
            { name: 'disabled', type: 'boolean', default: 'false', description: 'Non-interactive and visually muted.' },
            { name: 'presentational', type: 'boolean', default: 'false', description: 'Dot only, no input — for rows where an ancestor is the real control.' },
            { name: 'label', type: 'ReactNode', description: 'Content beside the dot; clicking it selects.' },
            { name: 'ariaLabel', type: 'string', description: 'Accessible name when there is no visible label.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Use it for mutually exclusive choices where the options are a plain list or table rows.',
            'Pass label rather than wrapping the component in a <label> — a label only forwards clicks to form controls, so the text would be dead.',
            'Use presentational inside a clickable row, so the row is one target, not two.',
            'Reach for DataTable selectionMode="single" rather than hand-rolling radios into a table.',
          ]}
          donts={[
            'Don’t use a Radio where the choice deserves description or an icon — that is RadioCardGroup.',
            'Don’t use it for two mutually exclusive views — that is SegmentedControl.',
            'Don’t use it for a single on/off setting — that is a Switch.',
            'Don’t give onChange a boolean and expect a toggle; there is no un-check.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { Radio } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
