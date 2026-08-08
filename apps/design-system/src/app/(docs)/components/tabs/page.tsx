'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code, Card } from '@/components/docs/primitives';
import { Tabs } from '@ds/components';

const items = [
  { value: 'overview', label: 'Overview' },
  { value: 'owners', label: 'Owners', count: 4 },
  { value: 'eligibility', label: 'Eligibility Criteria' },
  { value: 'sessions', label: 'Sessions' },
  { value: 'assignments', label: 'Assignments' },
  { value: 'advanced', label: 'Advanced Configuration' },
];

export default function TabsDocs() {
  const [tab, setTab] = React.useState('overview');
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Tabs"
        description="Section navigation for detail pages — an orange underline indicator with the active label in brand orange (an AA-safe darker orange as text; the vibrant underline is a UI graphic). Matches the product's detail-page tabs."
      />

      <Section title="Basic" description="Controlled value with optional counts.">
        <div className="rounded-lg border border-border bg-surface">
          <div className="px-5">
            <Tabs items={items} value={tab} onChange={setTab} aria-label="Emergency access details" />
          </div>
          <div className="px-5 py-6 text-body text-text-secondary">
            Active tab: <span className="font-emphasis text-text-primary">{tab}</span>
          </div>
        </div>
      </Section>

      <Section title="With counts">
        <Example label="label + (count)">
          <div className="w-full">
            <Tabs
              items={[
                { value: 'ind', label: 'Individual Owners', count: 4 },
                { value: 'grp', label: 'Governance Groups', count: 4 },
              ]}
              value="ind"
              onChange={() => {}}
            />
          </div>
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'items', type: 'TabItem[]', description: '{ value, label, count?, disabled? }.' },
            { name: 'value / onChange', type: 'string / (v) => void', description: 'Controlled active tab.' },
            { name: 'aria-label', type: 'string', description: 'Accessible name for the tablist.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Use for switching sections within one object/page.',
            'Show counts where they help (Owners (4)).',
            'Keep labels short; order by importance.',
            'Pair with an aria-label.',
          ]}
          donts={[
            'Don’t use tabs for primary app navigation (that’s the sidebar).',
            'Don’t exceed ~7 tabs — reconsider the IA.',
            'Don’t hide destructive actions behind a tab.',
            'Don’t recolor the indicator — it’s the brand accent.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { Tabs } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
