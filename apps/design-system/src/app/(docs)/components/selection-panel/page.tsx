'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { SelectionPanel, DataTable, Avatar, type Column } from '@ds/components';

type Person = { id: string; name: string; email: string };

const PEOPLE: Person[] = [
  { id: 'p1', name: 'Nathan Green', email: 'nathan.green@acme.com' },
  { id: 'p2', name: 'Priya Sharma', email: 'priya.sharma@acme.com' },
  { id: 'p3', name: 'Liam Turner', email: 'liam.turner@acme.com' },
  { id: 'p4', name: 'Sofia Rossi', email: 'sofia.rossi@acme.com' },
];

export default function SelectionPanelDocs() {
  const [selected, setSelected] = React.useState<string[]>(['p1']);

  const columns: Column<Person>[] = [
    {
      id: 'name',
      header: 'Name',
      sortable: true,
      value: (p) => p.name,
      render: (p) => (
        <div className="flex items-center gap-3">
          <Avatar name={p.name} size="sm" />
          <span className="font-medium text-text-primary">{p.name}</span>
        </div>
      ),
    },
    { id: 'email', header: 'Email', value: (p) => p.email, render: (p) => <span className="text-text-secondary">{p.email}</span> },
  ];

  const items = PEOPLE.filter((p) => selected.includes(p.id)).map((p) => ({
    id: p.id,
    label: p.name,
    sublabel: p.email,
    icon: <Avatar name={p.name} size="sm" />,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Selection Panel"
        description="The “what you’ve selected” side panel used inside selection drawers — Add Owners, Select Accounts, and similar multi-select flows. Shows a count and Clear all, one removable chip per selected item, and an empty state when nothing is selected. Pair it with a DataTable using controlled selectedIds."
      />

      <Section
        title="With a table"
        description="Selecting rows on the left keeps the panel in sync; removing a chip or Clear all updates the table. The panel reads from the full candidate list, so a selected item stays visible even when a search hides its row."
      >
        <Example label="select rows to sync the panel">
          <div className="flex h-[360px] w-full gap-0 rounded-lg border border-border bg-surface p-4">
            <div className="min-w-0 flex-1 pr-5">
              <DataTable<Person>
                columns={columns}
                rows={PEOPLE}
                selectable
                selectedIds={selected}
                onSelectionChange={setSelected}
                fillHeight
              />
            </div>
            <div className="w-[248px] shrink-0 border-l border-border pl-5">
              <SelectionPanel
                title="Selected People"
                items={items}
                onRemove={(id) => setSelected((prev) => prev.filter((x) => x !== id))}
                onClearAll={() => setSelected([])}
                countLabel={(n) => `${n} ${n === 1 ? 'person' : 'people'} selected`}
              />
            </div>
          </div>
        </Example>
      </Section>

      <Section title="Empty state" description="When nothing is selected, the panel guides the user to pick from the list.">
        <Example label="nothing selected">
          <div className="h-[240px] w-[280px] rounded-lg border border-border bg-surface p-4">
            <SelectionPanel
              title="Selected People"
              items={[]}
              onRemove={() => {}}
              onClearAll={() => {}}
              emptyTitle="No people selected"
              emptyMessage="Select people from the list and they’ll appear here."
            />
          </div>
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'title', type: 'string', description: 'Panel heading (e.g. “Selected Owners”).' },
            { name: 'items', type: 'SelectionItem[]', description: '{ id, label (ReactNode), sublabel?, icon? } per selected item.' },
            { name: 'onRemove', type: '(id: string) => void', description: 'Remove a single item (chip ×).' },
            { name: 'onClearAll', type: '() => void', description: 'Clear the whole selection.' },
            { name: 'countLabel', type: '(n: number) => string', default: '“N selected”', description: 'Builds the count line.' },
            { name: 'emptyTitle / emptyMessage', type: 'string', description: 'Empty-state copy when nothing is selected.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Pair it with a DataTable using controlled selectedIds.',
            'Feed items from the full candidate list, not the filtered rows.',
            'Include an avatar or icon so chips are scannable.',
            'Keep it on the right, separated by a border divider.',
          ]}
          donts={[
            'Don’t hide the count or Clear all when items exist.',
            'Don’t let chips drive selection without syncing the table.',
            'Don’t use it for single-select — a Select fits better.',
            'Don’t omit the empty state; a blank panel reads as broken.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { SelectionPanel } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
