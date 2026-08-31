'use client';

import * as React from 'react';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { Button, SelectionDock } from '@ds/components';

export default function SelectionDockDocs() {
  const [count, setCount] = React.useState(3);
  const total = 12;

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Selection Dock"
        description="A compact inverse toolbar for bulk work. It sits on the same sidebar colour as the navbar so it does not merge with the table. Count in a badge, hairline separators, tertiary buttons — the table height does not change."
      />

      <Section
        title="Count, select all, then act"
        description="The card appears when something is selected. Select all expands the set and becomes Deselect all; the actions apply to it; clear dismisses the card."
      >
        <Example label="over a list">
          <div className="relative h-56 overflow-hidden rounded-lg border border-border bg-subtle">
            <div className="px-4 py-3 text-body-sm text-text-secondary">A list sits behind the card.</div>
            <SelectionDock
              open
              count={count}
              total={total}
              noun="account"
              allSelected={count === total}
              onSelectAll={() => setCount(total)}
              onClear={() => setCount(0)}
            >
              <Button variant="tertiary" size="xs" startIcon={<CheckCircleOutline />}>
                Certify
              </Button>
              <Button variant="tertiary" size="xs" startIcon={<CancelOutlined />}>
                Revoke
              </Button>
            </SelectionDock>
          </div>
          <p className="mt-3 text-body-sm text-text-secondary">
            Demo count: {count} of {total}. Click Select all (it becomes Deselect all), an action, or the close control.
          </p>
        </Example>
      </Section>

      <Section title="When to use">
        <DoDont
          dos={[
            'A selectable table whose bulk actions used to live in the first row or next to Filter.',
            'Place the dock in a `relative` work surface so it stays inside the content column.',
            'Tertiary (text) `xs` buttons on the card — icon + label, no fill or outline.',
          ]}
          donts={[
            'The in-table selection banner (DataTable `selectionToolbar`) on the same screen.',
            'Filled or outlined buttons on the dock. The chrome is a compact toolbar.',
            'A full-bleed bar. This is a card, not a second footer.',
            'Padding or a reserved strip under the table. The card overlays; table height must not change.',
            'SetupBar. That parked strip walks a draft; this walks a selection.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { SelectionDock } from '@ds/components';`}</Code>
        </p>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'open', type: 'boolean', description: 'When false the card is not rendered.' },
            { name: 'count', type: 'number', description: 'How many rows in the current set are selected.' },
            { name: 'total', type: 'number', description: 'How many rows the current set has — used for Select all N.' },
            { name: 'noun', type: 'string', description: 'Singular, e.g. account or entitlement.' },
            { name: 'nounPlural', type: 'string', description: 'Defaults to noun + s.' },
            { name: 'allSelected', type: 'boolean', description: 'Switches Select all N to Deselect all N.' },
            { name: 'onSelectAll', type: '() => void', description: 'Selects every row in the current set.' },
            { name: 'onClear', type: '() => void', description: 'Clears the selection and dismisses the card.' },
            { name: 'children', type: 'ReactNode', description: 'Bulk actions — tertiary xs Buttons.' },
          ]}
        />
      </Section>
    </>
  );
}
