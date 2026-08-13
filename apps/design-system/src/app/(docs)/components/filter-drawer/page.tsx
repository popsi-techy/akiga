'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { Button, FilterDrawer, type FilterGroup, type FilterSelection } from '@ds/components';

const APPS = ['Okta', 'Salesforce', 'GitHub', 'AWS', 'Workday', 'Zoom', 'Tableau', 'Freshdesk'];

const GROUPS: FilterGroup[] = [
  {
    id: 'application',
    label: 'Application',
    options: APPS.map((a) => ({ id: a.toLowerCase(), label: a })),
  },
  {
    id: 'status',
    label: 'Status',
    optionHeader: 'Status',
    options: [
      { id: 'active', label: 'Active' },
      { id: 'inactive', label: 'Inactive' },
      { id: 'suspended', label: 'Suspended' },
    ],
  },
];

export default function FilterDrawerDocs() {
  const [open, setOpen] = React.useState(false);
  const [selection, setSelection] = React.useState<FilterSelection>({});
  const count = Object.values(selection).reduce((n, ids) => n + ids.length, 0);

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Filter Drawer"
        description="The product's one filtering surface. Categories in a left rail, the selected category's options as a searchable, paginated checkbox table on the right."
      />

      <Section
        title="Basic"
        description="A drawer, like every other pick-from-a-catalog surface in the product: filtering is browsing a list to make a selection, which is the drawer's job."
      >
        <Example label="open the filter">
          <Button variant="secondary" onClick={() => setOpen(true)}>
            Filter{count > 0 ? ` (${count})` : ''}
          </Button>
          <FilterDrawer
            open={open}
            onClose={() => setOpen(false)}
            groups={GROUPS}
            value={selection}
            onApply={setSelection}
            subtitle="Filter as per your requirement."
          />
        </Example>
      </Section>

      <Section
        title="Staged, not live"
        description="Ticking a box changes nothing until Apply. A list that re-queried on every tick would reorder itself under the cursor mid-decision, and Cancel would have nothing to undo. Re-opening always re-stages from the applied value, so a cancelled edit never survives into the next open."
      >
        <Example label="the only live feedback is the footer count">
          <p className="text-body-sm text-text-secondary">
            Pass <Code>renderStatus</Code> to say what Apply would leave — e.g.{' '}
            <Code>3 of 40 match</Code>. It receives the staged selection, not the applied one.
          </p>
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'open / onClose', type: 'boolean / () => void', description: 'Standard overlay control.' },
            { name: 'groups', type: 'FilterGroup[]', description: 'Categories for the left rail. Each carries its own options, optional column header and search placeholder.' },
            { name: 'value', type: 'FilterSelection', description: 'The applied selection — option ids keyed by group id. The modal stages its own copy.' },
            { name: 'onApply', type: '(next: FilterSelection) => void', description: 'Fires on Apply with the staged selection. Never fires on Cancel.' },
            { name: 'renderStatus', type: '(staged) => ReactNode', description: 'Footer-left status. Receives the staged selection so it can report what Apply would leave.' },
            { name: 'title / subtitle', type: 'string', default: "'Filter'", description: 'Modal header copy.' },
            { name: 'width', type: 'number', default: '860', description: 'Panel width. The two-pane layout needs the room.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Show the applied count on the trigger button — a filtered list must never look like the whole list.',
            'Use renderStatus to say what Apply would leave, so the decision is made before it is committed.',
            'Give every group a count in the rail, so filters set in a collapsed category are still visible.',
            'Keep the selection in the page and pass it back as value — the modal is controlled.',
          ]}
          donts={[
            'Don’t apply on tick. Staging is the point; live filtering makes Cancel meaningless.',
            'Don’t use it for one short list of choices — that is a QuickFilter or a Select.',
            'Don’t put a category in the rail with no options; an empty pane reads as broken.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { FilterDrawer } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
