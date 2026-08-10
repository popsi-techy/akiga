'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { SegmentedControl } from '@ds/components';

export default function SegmentedControlDocs() {
  const [view, setView] = React.useState<'map' | 'explorer'>('map');
  const [density, setDensity] = React.useState<'outline' | 'detailed'>('detailed');
  const [range, setRange] = React.useState<'7d' | '30d' | '90d'>('30d');

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Segmented Control"
        description="A compact single-choice toggle: a pill of connected segments where exactly one is always on. For a small set of mutually exclusive options where a dropdown would be heavier than the choice itself."
      />

      <Section
        title="Sizes"
        description="md is the default. sm sits inside dense chrome — a canvas header band, a side panel."
      >
        <Example label="md — two segments">
          <SegmentedControl<'map' | 'explorer'>
            ariaLabel="View"
            value={view}
            onChange={setView}
            options={[
              { value: 'map', label: 'Map' },
              { value: 'explorer', label: 'Explorer' },
            ]}
          />
        </Example>
        <Example label="sm — three segments">
          <SegmentedControl<'7d' | '30d' | '90d'>
            size="sm"
            ariaLabel="Time range"
            value={range}
            onChange={setRange}
            options={[
              { value: '7d', label: '7 days' },
              { value: '30d', label: '30 days' },
              { value: '90d', label: '90 days' },
            ]}
          />
        </Example>
        <Example label="fullWidth — fills its container">
          <div className="w-[320px]">
            <SegmentedControl<'outline' | 'detailed'>
              size="sm"
              fullWidth
              ariaLabel="Density"
              value={density}
              onChange={setDensity}
              options={[
                { value: 'outline', label: 'Outline' },
                { value: 'detailed', label: 'Detailed' },
              ]}
            />
          </div>
        </Example>
      </Section>

      <Section
        title="Not the same thing as a Quick Filter"
        description="A Segmented Control is a connected track where one segment is always selected — there is no “off”. A Quick Filter is a row of standalone chips where null means no filter. If your control needs a cleared state, it is a Quick Filter."
      >
        <PropsTable
          rows={[
            { name: 'options', type: 'SegmentedOption<T>[]', description: 'The segments: value + label. Keep it to two to four.' },
            { name: 'value', type: 'T', description: 'The selected value. Always one — this control has no empty state.' },
            { name: 'onChange', type: '(value: T) => void', description: 'Fires with the chosen value.' },
            { name: 'size', type: "'sm' | 'md'", default: "'md'", description: 'sm for dense chrome; md for standalone use.' },
            { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Stretch to the container, segments sharing the width equally.' },
            { name: 'ariaLabel', type: 'string', description: 'Names the radiogroup — required, since segments only label themselves.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Keep labels to one or two words so segments stay balanced.',
            'Use it for view switches, density toggles, and short time ranges.',
            'Always pass ariaLabel — the group needs a name, not just its segments.',
            'Use fullWidth when it sits above the thing it controls in a panel.',
          ]}
          donts={[
            'Don’t exceed four segments — past that it is a Select.',
            'Don’t use it where “none selected” is valid; use QuickFilter.',
            'Don’t use it for actions — segments express state, not commands.',
            'Don’t mix widely different label lengths; the track will look broken.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { SegmentedControl } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
