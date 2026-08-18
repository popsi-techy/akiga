'use client';

import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import PersonOutline from '@mui/icons-material/PersonOutline';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import SmartToyOutlined from '@mui/icons-material/SmartToyOutlined';
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

      <Section
        title="An icon instead of the dot"
        description="Pass `icon` for a chip that labels what a thing IS rather than what state it is in. A dot is a state light — it says “this is currently true” and its colour carries the meaning — so a dot in front of a classification implies a liveness it does not have. The icon says the category outright and, at chip size, is read before the word beside it, which is what matters in a column where every row carries one. It supersedes the dot rather than joining it: two leading marks make the gap before the label stop being predictable down a column."
      >
        <Example label="classification, not state">
          <StatusChip intent="info" label="Workforce" icon={<PersonOutline />} />
          <StatusChip intent="caution" label="External" icon={<BadgeOutlined />} />
          <StatusChip intent="info" label="Service account" icon={<SmartToyOutlined />} />
        </Example>
        <p className="mt-3 max-w-2xl text-body-sm text-text-secondary">
          Pass a plain outlined MUI icon with no <code>sx</code> — the chip sizes it to 13px and gives it
          the intent colour. The icon does the identifying; the tint is for making one value findable
          without reading, so reserve it for the value that genuinely warrants a second look. Never{' '}
          <code>danger</code> on a classification — red belongs to a real fault, not to a category. Pick glyphs that
          are separable at a glance rather than merely different — a reader scanning a column of twenty
          is matching shapes, not reading them.
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
            { name: 'icon', type: 'ReactNode', default: '—', description: 'A leading icon in place of the dot, for a chip that labels what a thing IS rather than its state. Pass a plain outlined MUI icon; the chip sizes it to 13px and applies the intent colour. Supersedes `dot`.' },
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
          <div>{`import PersonOutline from '@mui/icons-material/PersonOutline';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import SmartToyOutlined from '@mui/icons-material/SmartToyOutlined';
import { StatusChip } from '@ds/components';`}</div>
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
