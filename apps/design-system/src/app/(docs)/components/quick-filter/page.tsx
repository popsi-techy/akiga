'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { QuickFilter } from '@ds/components';

type Status = 'active' | 'pending' | 'revoked';

export default function QuickFilterDocs() {
  const [status, setStatus] = React.useState<Status | null>(null);
  const [risk, setRisk] = React.useState<string | null>('critical');

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Quick Filter"
        description="A row of standalone single-select filter chips for lightweight list filtering. The active chip takes a brand outline and grows a clear affordance; null means no filter applied, so “show everything” is a real, reachable state."
      />

      <Section
        title="Cleared is a state"
        description="Clicking the active chip clears it. That is the difference from a Segmented Control, where one option is always on — here, nothing selected is the default and the way back."
      >
        <Example label="Nothing selected — all rows shown">
          <QuickFilter<Status>
            ariaLabel="Filter by status"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'active', label: 'Active', count: 128 },
              { value: 'pending', label: 'Pending', count: 14 },
              { value: 'revoked', label: 'Revoked', count: 6 },
            ]}
          />
        </Example>
        <Example label="One selected — note the ✕ on the active chip">
          <QuickFilter
            size="md"
            ariaLabel="Filter by risk"
            value={risk}
            onChange={setRisk}
            options={[
              { value: 'critical', label: 'Critical', count: 8 },
              { value: 'high', label: 'High', count: 23 },
              { value: 'medium', label: 'Medium' },
            ]}
          />
        </Example>
      </Section>

      <Section
        title="Chips sit on the control scale"
        description="Chip height follows the shared control scale — sm 36px, md 40px — so a Quick Filter lines up with the Input and Button beside it in a table toolbar without hand-tuning."
      >
        <PropsTable
          rows={[
            { name: 'options', type: 'QuickFilterOption<T>[]', description: 'The chips: value, label, and an optional count shown after the label.' },
            { name: 'value', type: 'T | null', description: 'The selected value, or null when nothing is filtered.' },
            { name: 'onChange', type: '(value: T | null) => void', description: 'Fires with the chosen value, or null when the active chip is cleared.' },
            { name: 'size', type: "'sm' | 'md'", default: "'sm'", description: 'Matches the shared control heights: sm 36px, md 40px.' },
            { name: 'ariaLabel', type: 'string', description: 'Names the group. The chips report aria-pressed individually.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Show counts when you have them — a chip that says how many rows it will leave is worth two that don’t.',
            'Keep the set short; these are shortcuts, not the full filter surface.',
            'Put it in the table toolbar beside search, at size sm.',
            'Move rarely used facets into a Filters drawer instead of adding chips.',
          ]}
          donts={[
            'Don’t use it for multi-select — this control is single-choice by contract.',
            'Don’t use it where one option must always be on; that is SegmentedControl.',
            'Don’t hide the cleared state behind a separate “All” chip — clicking the active chip already clears.',
            'Don’t exceed one row of chips at the narrowest supported width.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { QuickFilter } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
