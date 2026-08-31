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
        description="A floating card for bulk work. `bottom` is an inverse toolbar at the foot of the list. `header` is a light pill on the table header — drag handle, count, Select all N (Clear all when the set is full), icon actions — so the table height does not change. Drag the handle to move the pill inside the work surface."
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
        <Example label="on the table header">
          <div className="relative h-40 overflow-hidden rounded-lg border border-border bg-canvas">
            <div className="border-b border-border bg-sunken px-4 py-2.5 text-caption text-text-secondary">
              Header row
            </div>
            <SelectionDock
              open
              placement="header"
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
            </SelectionDock>
          </div>
        </Example>
      </Section>

      <Section title="When to use">
        <DoDont
          dos={[
            'A selectable table whose bulk actions used to live in the first row or next to Filter.',
            'Place the dock in a `relative` work surface so it stays inside the content column.',
            'Tertiary (text) `xs` buttons on the card — icon + label, no fill or outline.',
            'On `header`, drag the six-dot handle to park the pill where it is not covering the row you are reading.',
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
            { name: 'allSelected', type: 'boolean', description: 'header: Select all N becomes Clear all. bottom: Select all N becomes Deselect all N.' },
            { name: 'placement', type: "'bottom' | 'header'", default: "'bottom'", description: 'bottom: inverse card at the foot of the list. header: light Notion-style pill on the table header, with a drag handle to move it.' },
            { name: 'onSelectAll', type: '() => void', description: 'Selects every row in the current set.' },
            { name: 'onClear', type: '() => void', description: 'Clears the selection and dismisses the card.' },
            { name: 'children', type: 'ReactNode', description: 'Bulk actions — tertiary xs Buttons.' },
          ]}
        />
      </Section>
    </>
  );
}
