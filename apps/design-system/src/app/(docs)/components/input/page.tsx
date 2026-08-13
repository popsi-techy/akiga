'use client';

import * as React from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { Input } from '@ds/components';

export default function InputDocs() {
  const [v, setV] = React.useState('');
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Input"
        description="A text field extended from MUI, themed by tokens. Labels are always visible (never placeholder-only), and helper/error text is standardized so every form field behaves identically."
      />

      <Section title="Basic">
        <Example label="label + value">
          <div className="w-72">
            <Input label="Emergency access name" value={v} onChange={(e) => setV(e.target.value)} />
          </div>
        </Example>
      </Section>

      <Section title="States">
        <Example label="default · required · error · disabled">
          <div className="w-64"><Input label="Name" placeholder="role_name" /></div>
          <div className="w-64"><Input label="Name" required defaultValue="Payments Admin" /></div>
          <div className="w-64"><Input label="Justification" error="Required (min 10 characters)" defaultValue="short" /></div>
          <div className="w-64"><Input label="Owner" disabled defaultValue="bob.smith@acme.com" /></div>
        </Example>
      </Section>

      <Section title="Adornments & helper text">
        <Example label="start adornment · helper">
          <div className="w-72"><Input placeholder="Search by application" startAdornment={<SearchIcon sx={{ fontSize: 18 }} />} /></div>
          <div className="w-72"><Input label="Cooldown" defaultValue="2" endAdornment="hours" helperText="Time before re-request is allowed." /></div>
        </Example>
      </Section>

      <Section
        title="Hint vs helper text"
        description="helperText is always on screen, so it is for what the user needs every time they fill the field. hint hides the sentence behind an info icon on the label — use it for the explanation that is only needed on first acquaintance, and keep the form scannable afterwards."
      >
        <Example label="hint on the label">
          <div className="w-72">
            <Input
              label="Application Prefix"
              hint="Prepended to account names imported from this application, so their origin is readable at a glance."
              placeholder="Enter Application Prefix"
            />
          </div>
        </Example>
      </Section>

      <Section title="Sizes">
        <Example label="sm · md">
          <div className="w-56"><Input label="Small" size="sm" /></div>
          <div className="w-56"><Input label="Medium" size="md" /></div>
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'label', type: 'string', description: 'Always-visible field label.' },
            { name: 'error', type: 'string', description: 'Error message; presence sets the error state.' },
            { name: 'helperText', type: 'ReactNode', description: 'Guidance shown under the field.' },
            { name: 'hint', type: 'ReactNode', description: 'Explanation on an info icon beside the label — for what a user needs once, not every time.' },
            { name: 'startAdornment / endAdornment', type: 'ReactNode', description: 'Leading/trailing content (icon, unit).' },
            { name: 'size', type: "'sm' | 'md'", default: "'md'", description: 'Control height.' },
            { name: '…TextFieldProps', type: 'MUI props', description: 'value, onChange, placeholder, type, etc. pass through.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Always provide a visible label.',
            'Use error to show a specific, fixable message.',
            'Use adornments for units and search icons.',
            'Keep placeholder as an example, not the label.',
          ]}
          donts={[
            'Don’t rely on placeholder text as the label.',
            'Don’t use vague errors like “Invalid input”.',
            'Don’t restyle borders/radius — the theme owns them.',
            'Don’t disable without an obvious reason nearby.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { Input } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
