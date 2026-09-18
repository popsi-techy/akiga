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
            { name: 'options', type: 'RadioCardOption[]', description: '{ value, label, description?, icon?, disabled?, action? }.' },
            { name: 'options[].action', type: 'ReactNode', description: 'Control on the card’s trailing edge — an xs Configure button for that option’s own settings. It renders beside the radio, not inside it: a button nested in a role="radio" is invalid, and clicking it would also pick the option. Opening the settings of the option you have not chosen must not switch the choice.' },
            { name: 'value / onChange', type: 'string / (v) => void', description: 'Controlled selection.' },
            { name: 'columns', type: '1 | 2 | 3', default: '1', description: 'Grid columns.' },
            { name: 'appearance', type: "'plain' | 'outlined'", default: 'plain', description: 'Adds contained option surfaces when choices need stronger separation. Selected is a brand outline on surface — no fill. Pass selectedTone="quiet" when the radio dot is enough and a brand ring would compete with a trailing action.' },
            { name: 'selectedTone', type: "'brand' | 'quiet'", default: 'brand', description: 'Outlined selected treatment. quiet keeps the same border as the other cards.' },
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
            'Don’t put an option’s fields on the page under the group — give the option an action and open them in a Drawer.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { RadioCardGroup } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
