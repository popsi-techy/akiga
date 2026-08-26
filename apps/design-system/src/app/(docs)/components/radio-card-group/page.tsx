'use client';

import * as React from 'react';
import SupervisorAccountOutlined from '@mui/icons-material/SupervisorAccountOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import PersonOutline from '@mui/icons-material/PersonOutline';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { RadioCardGroup } from '@ds/components';

export default function RadioCardGroupDocs() {
  const [value, setValue] = React.useState('manager');
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Radio Card Group"
        description="A single-choice selector rendered as clickable cards (icon + label + optional description). Use it where a plain radio list reads as too plain and the choices benefit from an icon or a one-line explanation — approver type, split attributes, mode pickers. It’s a roving radiogroup for keyboard and screen-reader users."
      />

      <Section title="Single column" description="The default — good for a config panel.">
        <Example label="approver type">
          <div className="w-[320px]">
            <RadioCardGroup
              ariaLabel="Approver type"
              appearance="outlined"
              value={value}
              onChange={setValue}
              options={[
                { value: 'manager', label: 'Manager', description: "The requester's direct manager", icon: <SupervisorAccountOutlined sx={{ fontSize: 20 }} /> },
                { value: 'governanceTeam', label: 'Governance Team', description: 'A named team of approvers', icon: <GroupsOutlined sx={{ fontSize: 20 }} /> },
                { value: 'user', label: 'Specific User', description: 'A named individual approver', icon: <PersonOutline sx={{ fontSize: 20 }} /> },
              ]}
            />
          </div>
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'options', type: 'RadioCardOption[]', description: '{ value, label, description?, icon?, disabled? }.' },
            { name: 'value / onChange', type: 'string / (v) => void', description: 'Controlled selection.' },
            { name: 'columns', type: '1 | 2 | 3', default: '1', description: 'Grid columns.' },
            { name: 'appearance', type: "'plain' | 'outlined'", default: 'plain', description: 'Adds contained option surfaces when choices need stronger separation. Selected is a brand outline on surface — no fill.' },
            { name: 'ariaLabel', type: 'string', description: 'Labels the radiogroup for assistive tech.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Use for a small set of mutually exclusive, explainable choices.',
            'Give each option an icon or a one-line description.',
            'Keep it controlled — the parent owns the value.',
          ]}
          donts={[
            'Don’t use for many options — use a Select.',
            'Don’t use for multi-select — that’s checkboxes.',
            'Don’t bury long paragraphs in the description.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { RadioCardGroup } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
