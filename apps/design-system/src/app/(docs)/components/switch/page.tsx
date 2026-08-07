'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { Switch } from '@ds/components';

export default function SwitchDocs() {
  const [on, setOn] = React.useState(true);
  const [off, setOff] = React.useState(false);

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Switch"
        description="Binary on/off control. Extended from MUI Switch with a contained thumb — the knob sits inside the pill track so off and on are obvious. Use for immediate settings toggles, not for multi-option choices."
      />

      <Section title="Anatomy" description="Track is the background pill; thumb is the circle that travels inside it. On fills the track with brand; off uses a muted track.">
        <Example label="off · on">
          <label className="inline-flex items-center gap-2 text-body-sm text-text-primary">
            <Switch checked={off} onChange={(e) => setOff(e.target.checked)} inputProps={{ 'aria-label': 'Demo off' }} />
            Off
          </label>
          <label className="inline-flex items-center gap-2 text-body-sm text-text-primary">
            <Switch checked={on} onChange={(e) => setOn(e.target.checked)} inputProps={{ 'aria-label': 'Demo on' }} />
            On
          </label>
        </Example>
      </Section>

      <Section title="Sizes">
        <Example label="sm · md">
          <Switch size="sm" defaultChecked inputProps={{ 'aria-label': 'Small switch' }} />
          <Switch size="md" defaultChecked inputProps={{ 'aria-label': 'Medium switch' }} />
        </Example>
      </Section>

      <Section title="States">
        <Example label="default · disabled on · disabled off">
          <Switch defaultChecked inputProps={{ 'aria-label': 'Enabled' }} />
          <Switch checked disabled inputProps={{ 'aria-label': 'Disabled on' }} />
          <Switch checked={false} disabled inputProps={{ 'aria-label': 'Disabled off' }} />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'size', type: "'sm' | 'md'", default: "'sm'", description: 'Track and thumb scale.' },
            { name: 'checked / defaultChecked', type: 'boolean', description: 'Controlled or uncontrolled on state.' },
            { name: 'disabled', type: 'boolean', default: 'false', description: 'Blocks interaction; dims the control.' },
            { name: 'inputProps', type: 'InputHTMLAttributes', description: 'Pass aria-label (required when there is no visible label).' },
            { name: '…MuiSwitchProps', type: 'SwitchProps', description: 'onChange, name, etc. pass through (size/color remapped).' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Use for an immediate setting that takes effect on toggle.',
            'Pair with a clear label; put the switch at the trailing edge of the row.',
            'Always provide an accessible name (label or aria-label).',
          ]}
          donts={[
            'Don’t use a Switch for multi-option choices — use Radio Card Group or Select.',
            'Don’t import raw @mui/material/Switch — the contained thumb lives in this wrapper.',
            'Don’t restyle with hex; on/off colors come from brand and border tokens.',
          ]}
        />
      </Section>

      <Section title="Usage">
        <div className="rounded-lg border border-border bg-sunken p-4 font-mono text-caption leading-6 text-text-primary">
          <div>{`import { Switch } from '@ds/components';`}</div>
          <div>{`<Switch`}</div>
          <div>{`  checked={enabled}`}</div>
          <div>{`  onChange={(e) => setEnabled(e.target.checked)}`}</div>
          <div>{`  inputProps={{ 'aria-label': 'Add fallback' }}`}</div>
          <div>{`/>`}</div>
        </div>
        <p className="mt-3 text-body-sm text-text-tertiary">
          Built on <Code>@mui/material/Switch</Code>; the contained-thumb geometry and token
          colors are owned by this component (MUI’s overlapping thumb was insufficient).
        </p>
      </Section>
    </>
  );
}
