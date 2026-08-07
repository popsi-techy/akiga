'use client';

import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { Button } from '@ds/components';

export default function ButtonDocs() {
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Button"
        description="Triggers an action. Extended from MUI Button and themed by our tokens. Four variants express intent and priority; only one primary button per view or section."
      />

      <Section title="Variants" description="Priority descends primary → secondary → tertiary. Danger is for destructive actions.">
        <Example label="primary · secondary · tertiary · danger">
          <Button variant="primary">Create Emergency Access</Button>
          <Button variant="secondary">Filter</Button>
          <Button variant="tertiary">Cancel</Button>
          <Button variant="danger">Deactivate</Button>
        </Example>
      </Section>

      <Section title="Sizes">
        <Example label="sm · md · lg">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </Example>
      </Section>

      <Section title="With icons" description="Icons clarify the action. Leading icon for create/add, trailing for navigation.">
        <Example label="leading & trailing icons">
          <Button variant="primary" startIcon={<AddIcon />}>
            Onboard Application
          </Button>
          <Button variant="secondary" endIcon={<ArrowForwardIcon />}>
            View all
          </Button>
        </Example>
      </Section>

      <Section title="States">
        <Example label="default · loading · disabled">
          <Button variant="primary">Submit</Button>
          <Button variant="primary" loading>
            Submitting
          </Button>
          <Button variant="primary" disabled>
            Submit
          </Button>
          <Button variant="secondary" disabled>
            Filter
          </Button>
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'variant', type: "'primary' | 'secondary' | 'tertiary' | 'danger'", default: "'primary'", description: 'Visual role / priority.' },
            { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Control size.' },
            { name: 'loading', type: 'boolean', default: 'false', description: 'Shows a spinner and disables interaction.' },
            { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the button.' },
            { name: 'startIcon / endIcon', type: 'ReactNode', description: 'Leading / trailing icon (MUI icon).' },
            { name: '…MuiButtonProps', type: 'ButtonProps', description: 'onClick, href, fullWidth, etc. pass through.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Use one primary button per view/section.',
            'Lead with a verb: “Create Policy”, “Approve”.',
            'Use danger only for destructive, irreversible actions.',
            'Show loading during async submits.',
          ]}
          donts={[
            'Don’t place two primary buttons side by side.',
            'Don’t use “OK”/“Submit” when a specific verb fits.',
            'Don’t rely on color alone — keep clear labels.',
            'Don’t restyle with hex — the variants are the API.',
          ]}
        />
      </Section>

      <Section title="Usage">
        <div className="rounded-lg border border-border bg-sunken p-4 font-mono text-caption leading-6 text-text-primary">
          <div>{`import { Button } from '@ds/components';`}</div>
          <div className="text-text-tertiary">{`// primary is the default`}</div>
          <div>{`<Button startIcon={<AddIcon />}>Create Emergency Access</Button>`}</div>
          <div>{`<Button variant="secondary">Filter</Button>`}</div>
          <div>{`<Button variant="danger" onClick={confirmDeactivate}>Deactivate</Button>`}</div>
        </div>
        <p className="mt-3 text-body-sm text-text-tertiary">
          Built on <Code>@mui/material/Button</Code>; brand styling comes from{' '}
          <Code>muiTheme</Code> — no per-instance color overrides.
        </p>
      </Section>
    </>
  );
}
