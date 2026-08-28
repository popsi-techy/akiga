'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { SegmentedDonut, SetupProgress } from '@ds/components';

export default function SetupProgressDocs() {
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Setup Progress"
        description="How close a draft is to being switchable on. A segmented donut — countable bites, not a 75% bar — sits beside the button that does the switching."
      />

      <Section
        title="Four things, three of them done"
        description="Gaps keep the bites countable. Green is the same success fill the checklist tick uses. The words say what is still in the way."
      >
        <Example label="beside Activate">
          <div className="flex flex-wrap items-center gap-8">
            <SetupProgress
              done={2}
              total={3}
              pendingDetails={['Eligibility']}
              className="flex"
            />
            <SetupProgress done={3} total={3} pendingDetails={[]} className="flex" />
          </div>
        </Example>
        <Example label="SegmentedDonut on a control">
          <span className="relative grid h-8 w-8 place-items-center">
            <span className="absolute inset-0">
              <SegmentedDonut done={1} total={3} size={32} thickness={2.5} />
            </span>
            <span className="text-caption text-text-secondary">1</span>
          </span>
        </Example>
      </Section>

      <Section title="When to use">
        <DoDont
          dos={[
            'Count only the steps that gate Activate or Connect.',
            'Pass `pendingDetails` when there is room for the info icon.',
            'Reuse `SegmentedDonut` on the setup-guide control so the two rings cannot drift.',
          ]}
          donts={[
            'A Meter. That is a continuous proportion, not a countable set.',
            'A DonutChart. That is a composition with a legend.',
            'Including optional steps. 4 of 5 next to a disabled Activate cannot be reconciled.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { SetupProgress, SegmentedDonut } from '@ds/components';`}</Code>
        </p>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'done / total', type: 'number', description: 'Required steps complete, and the count that gates the action.' },
            { name: 'pendingDetails', type: 'string[]', description: 'Unfinished step names for the info tooltip.' },
            { name: 'align', type: "'start' | 'end'", default: "'end'", description: 'Which edge the count hangs off.' },
            { name: 'className', type: 'string', description: 'Replaces the default `hidden sm:flex` when the count must always show.' },
            { name: 'SegmentedDonut.size', type: 'number', default: '18', description: 'Box size. The setup-guide book uses 32.' },
            { name: 'SegmentedDonut.thickness', type: 'number', default: '3', description: 'Stroke width.' },
          ]}
        />
      </Section>
    </>
  );
}
