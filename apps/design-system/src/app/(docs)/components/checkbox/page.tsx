'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { Checkbox } from '@ds/components';

export default function CheckboxDocs() {
  const [basic, setBasic] = React.useState(true);
  const [danger, setDanger] = React.useState(true);
  const [rows, setRows] = React.useState<string[]>(['a']);
  const all = ['a', 'b', 'c'];
  const allOn = rows.length === all.length;
  const some = rows.length > 0 && !allOn;

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Checkbox"
        description="The canonical 18px check box. Selection is additive by default and destructive on demand, it carries a real mixed state, and its label is part of the control rather than a sibling."
      />

      <Section
        title="States"
        description="Unchecked, checked, mixed, and disabled. The outline uses border.control — the token that exists for exactly this."
      >
        <Example label="Basic">
          <Checkbox checked={basic} onChange={setBasic} label="Include inactive identities" />
        </Example>
        <Example label="Mixed (select-all)">
          <Checkbox
            checked={allOn}
            indeterminate={some}
            onChange={() => setRows(allOn ? [] : all)}
            label={`Select all (${rows.length} of ${all.length})`}
          />
        </Example>
        <Example label="Disabled">
          <Checkbox checked disabled onChange={() => {}} label="Locked by policy" />
          <Checkbox checked={false} disabled onChange={() => {}} label="Unavailable" />
        </Example>
      </Section>

      <Section
        title="Tone"
        description="Brand for additive picks — what you are including. Danger for destructive ones — what you are about to revoke."
      >
        <Example label="brand (default) vs danger">
          <Checkbox checked onChange={() => {}} label="Grant Salesforce access" />
          <Checkbox checked={danger} tone="danger" onChange={setDanger} label="Revoke AdministratorAccess" />
        </Example>
      </Section>

      <Section
        title="Contrast is why this is not a hairline"
        description="WCAG 1.4.11 asks 3:1 on a control boundary. border.default reaches 1.28:1 and border.strong 1.66:1, so drawing an unchecked box with either would be a contrast failure rather than merely a light-looking one. check:contrast enforces border.control against both surface and subtle."
      >
        <PropsTable
          rows={[
            { name: 'checked', type: 'boolean', description: 'Selected state. Controlled — the parent owns it.' },
            { name: 'indeterminate', type: 'boolean', default: 'false', description: 'Mixed state: renders a dash and reports aria-checked="mixed".' },
            { name: 'onChange', type: '(checked: boolean) => void', description: 'Fires with the next state.' },
            { name: 'tone', type: "'brand' | 'danger'", default: "'brand'", description: 'Selected accent. Danger for destructive selection.' },
            { name: 'disabled', type: 'boolean', default: 'false', description: 'Non-interactive and visually muted.' },
            { name: 'presentational', type: 'boolean', default: 'false', description: 'Box only, no input — for rows where an ancestor is the real control.' },
            { name: 'label', type: 'ReactNode', description: 'Content beside the box; clicking it toggles.' },
            { name: 'ariaLabel', type: 'string', description: 'Accessible name when there is no visible label.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Pass label rather than wrapping the component in a <label> — a label only forwards clicks to form controls, so the text would be dead.',
            'Use indeterminate for a select-all whose page is partly selected.',
            'Use tone="danger" when the thing being checked will be removed.',
            'Use presentational inside a clickable row, so the row is one target, not two.',
          ]}
          donts={[
            'Don’t use a Checkbox for a single on/off setting — that is a Switch.',
            'Don’t use it for mutually exclusive choices — that is RadioCardGroup or SegmentedControl.',
            'Don’t reach for raw MUI Checkbox; it will not carry border.control.',
            'Don’t leave a checkbox unlabelled and un-aria-labelled.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { Checkbox } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
