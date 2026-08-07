'use client';

import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { StatusChip } from '@ds/components';

export default function StatusChipDocs() {
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Status Chip"
        description="A compact pill communicating state or severity. One component, one intent→color mapping, used for every status label and (dot-less) risk/severity badge across the product — so status looks identical everywhere."
      />

      <Section title="Intents" description="Each intent maps to a semantic status token, matching the lifecycle-state intents in the domain model.">
        <Example label="the five intents">
          <StatusChip intent="neutral" label="Draft" />
          <StatusChip intent="info" label="In Progress" />
          <StatusChip intent="success" label="Active" />
          <StatusChip intent="warning" label="Overdue" />
          <StatusChip intent="danger" label="Rejected" />
        </Example>
      </Section>

      <Section title="Lifecycle statuses" description="Real access-request states mapped to intents (from the Product Knowledge Base state machines).">
        <Example label="access request lifecycle">
          <StatusChip intent="neutral" label="Draft" />
          <StatusChip intent="info" label="Submitted" />
          <StatusChip intent="warning" label="Pending Approval" />
          <StatusChip intent="success" label="Fulfilled" />
          <StatusChip intent="danger" label="Failed" />
        </Example>
      </Section>

      <Section
        title="Risk / severity badges"
        description="Set dot={false} for risk and severity. The four tiers are one hue per level so severity reads as a ramp — blue → yellow → orange → red. Low is info, not success: green says “good”, but a low score is a measurement, not an all-clear. High is caution, the orange step that exists for exactly this — without it High and Medium both land on yellow."
      >
        <Example label="risk levels (no dot)">
          <StatusChip intent="info" dot={false} label="Low" />
          <StatusChip intent="warning" dot={false} label="Medium" />
          <StatusChip intent="caution" dot={false} label="High (68)" />
          <StatusChip intent="danger" dot={false} label="Critical (94)" />
        </Example>
        <p className="mt-3 text-body-sm text-text-tertiary">
          Product code should not repeat this mapping — score to tier to chip lives in{' '}
          <Code>RiskScoreChip</Code>, and <Code>SeverityChip</Code> follows it, so a risk score and a
          policy severity look identical wherever they meet.
        </p>
      </Section>

      <Section title="Emphasis">
        <Example label="subtle (default) · solid">
          <StatusChip intent="success" label="Active" />
          <StatusChip intent="success" label="Active" emphasis="solid" />
          <StatusChip intent="danger" label="Critical" emphasis="solid" dot={false} />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'intent', type: "'info' | 'success' | 'warning' | 'caution' | 'danger' | 'neutral'", default: "'neutral'", description: 'Semantic role → color mapping. caution is the orange step between warning and danger.' },
            { name: 'label', type: 'string', description: 'Text shown in the chip.' },
            { name: 'dot', type: 'boolean', default: 'true', description: 'Leading status dot; false for risk/severity.' },
            { name: 'emphasis', type: "'subtle' | 'solid'", default: "'subtle'", description: 'Tinted (default) or solid fill.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Map product states to intents via the domain’s lifecycle intents.',
            'Use dot for status, no dot for risk/severity.',
            'Take the 4-tier ramp from RiskScoreChip — never re-map score to color.',
            'Keep labels short — the canonical status word.',
            'Reuse this chip everywhere status appears.',
          ]}
          donts={[
            'Don’t invent new colors for a status.',
            'Don’t encode meaning in color alone — the label carries it.',
            'Don’t use solid emphasis for dense tables (too heavy).',
            'Don’t create a separate risk-badge component — this is it.',
          ]}
        />
      </Section>

      <Section title="Usage">
        <div className="rounded-lg border border-border bg-sunken p-4 font-mono text-caption leading-6 text-text-primary">
          <div>{`import { StatusChip } from '@ds/components';`}</div>
          <div>{`<StatusChip intent="success" label="Active" />`}</div>
          <div>{`<StatusChip intent="danger" dot={false} label="Critical (94)" />`}</div>
        </div>
        <p className="mt-3 text-body-sm text-text-tertiary">
          Colors come from <Code>color.status[intent]</Code> — the same tokens documented under
          Foundations → Colors.
        </p>
      </Section>
    </>
  );
}
