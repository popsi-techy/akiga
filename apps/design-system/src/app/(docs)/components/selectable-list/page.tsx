'use client';

import * as React from 'react';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { SelectableList, StatusChip } from '@ds/components';

const ITEMS = [
  { id: 'a', label: 'AdministratorAccess', description: 'Full access to all AWS services.', trailing: <StatusChip intent="danger" dot={false} label="95" /> },
  { id: 'b', label: 'PowerUserAccess', description: 'Full access except IAM management.', trailing: <StatusChip intent="caution" dot={false} label="68" /> },
  { id: 'c', label: 'ReadOnlyAccess', description: 'View-only across AWS resources.', trailing: <StatusChip intent="warning" dot={false} label="22" /> },
];

export default function SelectableListDocs() {
  const [outlined, setOutlined] = React.useState<string[]>(['a']);
  const [plain, setPlain] = React.useState<string[]>(['b', 'c']);
  const toggle = (set: React.Dispatch<React.SetStateAction<string[]>>) => (id: string) =>
    set((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Selectable List"
        description="A multi-select list of rows, each with a check box, an optional leading visual, a primary label, a secondary description and trailing content. The multi-select counterpart to Radio Card Group."
      />

      <Section
        title="Variants"
        description="outlined gives each row its own bordered card — use it when rows are the content. plain drops the chrome to borderless rows with spacing — use it inside an already-bordered panel, where a second border would be a box inside a box."
      >
        <Example label="outlined (default)">
          <div className="w-full max-w-lg">
            <SelectableList
              ariaLabel="Entitlements"
              items={ITEMS.map((i) => ({ ...i, leading: <VpnKeyOutlined sx={{ fontSize: 18 }} /> }))}
              selected={outlined}
              onToggle={toggle(setOutlined)}
            />
          </div>
        </Example>
        <Example label="plain — inside a panel that already has a border">
          <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-3">
            <SelectableList ariaLabel="Entitlements" variant="plain" items={ITEMS} selected={plain} onToggle={toggle(setPlain)} />
          </div>
        </Example>
      </Section>

      <Section
        title="Tone carries the consequence"
        description="brand for additive picks — access you are about to grant. danger for destructive ones — access you are about to revoke. The accent runs through the check box, the border and the fill together, so the row reads as one decision."
      >
        <Example label="tone=danger">
          <div className="w-full max-w-lg">
            <SelectableList
              ariaLabel="Access to revoke"
              tone="danger"
              items={ITEMS.slice(0, 2)}
              selected={['a']}
              onToggle={() => {}}
            />
          </div>
        </Example>
        <Example label="Empty state">
          <div className="w-full max-w-lg">
            <SelectableList ariaLabel="Empty" items={[]} selected={[]} onToggle={() => {}} emptyMessage="No entitlements match this filter." />
          </div>
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'items', type: 'SelectableListItem[]', description: 'id, label, description, leading, trailing, disabled.' },
            { name: 'selected', type: 'Set<string> | string[]', description: 'Selected ids. Either shape — the component normalises.' },
            { name: 'onToggle', type: '(id: string) => void', description: 'Fires with the row toggled. The parent owns the set.' },
            { name: 'tone', type: "'brand' | 'danger'", default: "'brand'", description: 'Selected accent, matching the consequence of selecting.' },
            { name: 'variant', type: "'outlined' | 'plain'", default: "'outlined'", description: 'Bordered cards, or borderless rows for use inside a panel.' },
            { name: 'emptyMessage', type: 'ReactNode', description: 'Shown in place of the list when there are no items.' },
            { name: 'ariaLabel', type: 'string', description: 'Names the group for assistive technology.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Use trailing for the one number that decides the pick — a risk score, a user count.',
            'Use variant="plain" inside drawers and panels that already have a border.',
            'Always pass emptyMessage — a filtered list that empties should say so.',
            'Pair with SelectionPanel when the selection is long enough to lose track of.',
          ]}
          donts={[
            'Don’t nest an outlined list inside a bordered card — that is a card in a card.',
            'Don’t use it for single-choice; that is RadioCardGroup.',
            'Don’t put actions in trailing — the whole row is the toggle.',
            'Don’t rely on tone alone to communicate revocation; say it in the heading too.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { SelectableList } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
