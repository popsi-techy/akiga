'use client';

import * as React from 'react';
import PersonOutline from '@mui/icons-material/PersonOutline';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import LoginOutlined from '@mui/icons-material/LoginOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { ModeBar } from '@ds/components';

export default function ModeBarDocs() {
  const [method, setMethod] = React.useState('oauth2');

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Mode Bar"
        description="Equal tiles that pick which body lives below them. Pin it in a Drawer’s subheader so the switcher stays put while the form it chose scrolls. Not a FormSection, not Tabs, not a SegmentedControl."
      />

      <Section
        title="Four methods, two available"
        description="Disabled tiles stay in the row so the set does not reflow when one ships. Selected is a brand outline on a white surface — no radio dots."
      >
        <Example label="authentication method">
          <div className="max-w-[512px]">
            <ModeBar
              ariaLabel="Authentication method"
              value={method}
              onChange={setMethod}
              options={[
                { value: 'basic', label: 'Basic', icon: <PersonOutline sx={{ fontSize: 18 }} /> },
                {
                  value: 'bearer',
                  label: 'Bearer Token',
                  icon: <VpnKeyOutlined sx={{ fontSize: 18 }} />,
                  disabled: true,
                  hint: 'Coming soon',
                },
                { value: 'oauth2', label: 'OAuth 2.0', icon: <LoginOutlined sx={{ fontSize: 18 }} /> },
                {
                  value: 'custom',
                  label: 'Custom',
                  icon: <TuneOutlined sx={{ fontSize: 18 }} />,
                  disabled: true,
                  hint: 'Coming soon',
                },
              ]}
            />
            <p className="mt-4 text-body-sm text-text-secondary">
              Below this bar the form is {method === 'basic' ? 'username and password' : 'an OAuth request'}.
            </p>
          </div>
        </Example>
      </Section>

      <Section title="When to use">
        <DoDont
          dos={[
            'A create/edit Drawer whose body is a different form per choice (Basic vs OAuth). Put it in Drawer.subheader so it cannot scroll away.',
            'Keep disabled options in the row. A Coming soon tooltip explains why they cannot be chosen — do not label the tile Soon.',
            'Name the radiogroup with ariaLabel — the tiles have no heading of their own.',
          ]}
          donts={[
            'A FormSection of radios at the top of the scrolling body. That is a field group, and it leaves the viewport.',
            'Tabs. Tabs switch facets of one form (Request / Response), not which form you are filling.',
            'SegmentedControl. That is a density or duration toggle, not a mode of a drawer.',
            'RadioCardGroup. The radio dot and description belong among fields, not in chrome.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { ModeBar } from '@ds/components';`}</Code>
        </p>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            {
              name: 'options',
              type: 'ModeBarOption[]',
              description: '{ value, label, icon, disabled?, hint? }. Icon is outlined 18px, uncoloured.',
            },
            { name: 'value / onChange', type: 'string / (v) => void', description: 'Controlled selection.' },
            {
              name: 'ariaLabel',
              type: 'string',
              description: 'Names the radiogroup. Required — there is no visible heading.',
            },
          ]}
        />
      </Section>
    </>
  );
}
