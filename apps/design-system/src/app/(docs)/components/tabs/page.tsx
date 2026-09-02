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
        description="Section navigation for detail pages — an orange underline indicator with the active label in brand orange (an AA-safe darker orange as text; the vibrant underline is a UI graphic). A tab is 32px tall and owns its own height, so a tab band reads as a thin strip rather than a second header."
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
                { value: 'grp', label: 'Governance Teams', count: 4 },
              ]}
              value="ind"
              onChange={() => {}}
            />
          </div>
        </Example>
      </Section>

      <Section
        title="Overflow"
        description="Tabs that do not fit collapse into a More menu, which states how many are hidden and lists them. Nothing is done by the caller — the strip measures itself and re-decides on every resize. The narrow frame below holds the same six tabs as the first example."
      >
        <Example label="Same items, 360px of room">
          <div className="w-[360px] rounded-lg border border-border bg-surface px-5">
            <Tabs items={items} value={tab} onChange={setTab} aria-label="Overflow demo" />
          </div>
        </Example>
        <p className="mt-3 text-body-sm text-text-secondary">
          Choosing a hidden section leaves no tab selected, so More takes the underline and marks
          the section inside its menu — a strip showing no selection at all would read as a page
          with nothing open.
        </p>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'items', type: 'TabItem[]', description: '{ value, label, count?, status?, disabled? }.' },
            {
              name: 'items[].count',
              type: 'number',
              default: '—',
              description:
                'Rendered as “label (n)”. Pass it rather than writing the brackets into the label, so the formatting stays one decision. `0` renders “(0)”; omit it for a tab with nothing to count.',
            },
            {
              name: 'items[].status',
              type: "'pending' | 'complete'",
              default: '—',
              description:
                'Optional setup hint before the label. Same filled CheckCircle as the setup checklist — green when complete, grey when still open. Omit it for a step that is satisfied without anyone deciding (Advanced’s factory defaults).',
            },
            { name: 'value / onChange', type: 'string / (v) => void', description: 'Controlled active tab.' },
            { name: 'aria-label', type: 'string', description: 'Accessible name for the tablist.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Use for switching sections within one object/page.',
            'Count everything behind the tab, not the pane that opens first — an Owners tab holding people and teams counts both, or a profile owned only by a team reads “Owners (0)”.',
            'Show the zero. “Owners (0)” answers the question; a missing count reads as “not counted yet” and makes the reader open the tab to find out it was empty.',
            'Derive the count from whatever the page already uses to decide the section is empty, so the tab and that other surface cannot disagree.',
            'Keep labels short; order by importance.',
            'Pair with an aria-label.',
          ]}
          donts={[
            'Don’t write the brackets into the `label` — pass `count` and let the component format it, or two tab strips will disagree about the punctuation.',
            'Don’t count a tab that holds no collection. A count on “Overview” is a number with no referent.',
            'Don’t use tabs for primary app navigation (that’s the sidebar).',
            'Don’t exceed ~7 tabs — reconsider the IA. The More menu keeps a long strip usable at any width; it does not make a long strip a good idea.',
            'Don’t hide destructive actions behind a tab.',
            'Don’t recolor the indicator — it’s the brand accent.',
            'Don’t pad the band to change the tab height — a tab is 32px and owns it.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { Tabs } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
