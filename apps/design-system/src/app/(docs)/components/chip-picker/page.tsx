'use client';

import * as React from 'react';
import { PageHeader, Section, PropsTable, DoDont, Example } from '@/components/docs/primitives';
import { ChipPicker, SettingsRow, SettingsStack } from '@ds/components';

const TYPES = [
  { id: 'contractor', name: 'Contractor (External)' },
  { id: 'partner', name: 'Partner' },
  { id: 'service', name: 'Service account' },
];

export default function ChipPickerDocs() {
  const [types, setTypes] = React.useState<typeof TYPES>([]);
  const [policy, setPolicy] = React.useState<{ id: string; name: string } | null>({
    id: 'joiner',
    name: 'Joiner Access Approval',
  });

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Chip Picker"
        description="The settings-row control for a set chosen elsewhere. Empty is Add. Filled is one capsule — the first name, a +n, and a pencil — that opens the same drawer."
      />

      <Section
        title="Add, then edit"
        description="Press Add Types, then the capsule. The control does not change width or jump — Add and the filled capsule are the same 12rem field as the Select beside them on a grey well."
      >
        <Example label="empty, then one, then several">
          <SettingsStack>
            <SettingsRow
              surface="subtle"
              title="Additional identity types"
              description="Classify some identities differently based on an application field."
            >
              <ChipPicker
                items={types}
                addLabel="Add Types"
                editLabel={
                  types.length > 0
                    ? `Additional types: ${types.map((t) => t.name).join(', ')}. Edit rules.`
                    : 'Add type rules'
                }
                tooltip="Edit type rules"
                onClick={() => setTypes((current) => (current.length === 0 ? TYPES : []))}
              />
            </SettingsRow>
            <SettingsRow
              surface="subtle"
              title="Approval policy"
              description="Choose which policy routes access requests for this application."
            >
              <ChipPicker
                items={policy ? [policy] : []}
                addLabel="Add policy"
                editLabel={
                  policy
                    ? `Approval policy: ${policy.name}. Edit.`
                    : 'Add approval policy'
                }
                onClick={() =>
                  setPolicy((current) =>
                    current ? null : { id: 'joiner', name: 'Joiner Access Approval' },
                  )
                }
              />
            </SettingsRow>
          </SettingsStack>
        </Example>
      </Section>

      <Section
        title="Why not OverflowChips plus a pencil?"
        description="A named chip and a separate icon are two controls for one job. The reader has to decide which one edits, and the chip truncates without saying that clicking it does anything. Identity classification already solved this: Add until something is chosen, then one capsule that is the edit affordance."
      >
        <DoDont
          dos={[
            'Use ChipPicker on a SettingsRow whenever the right-hand control adds a set and later edits it.',
            'Name the Add button after what will appear — “Add Types”, “Add policy”.',
            'Put the chosen names in editLabel, then the verb, so a screen reader hears what is there and that the capsule changes it.',
            'Open a Drawer from onClick. This control is the answer, not the editor.',
          ]}
          donts={[
            'Do not sit OverflowChips next to a bare pencil on a grey well. That pairing is ChipPicker.',
            'Do not use this where the set is only being named, not edited — a table cell or an InfoRow is OverflowChips.',
            'Do not use this as a full wizard row. That is PickerSlot (icon, title, hint, Add or a bare pencil).',
            'Do not grow the filled state into a list of what was picked. The list belongs in the Drawer.',
          ]}
        />
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'items', type: '{ id: string; name: string }[]', description: 'The chosen set. Empty renders Add; anything else renders the capsule.' },
            { name: 'addLabel', type: 'string', description: 'Empty-state button label. Names what will be added.' },
            { name: 'editLabel', type: 'string', description: 'Accessible name for the filled capsule. Include what is chosen, then the verb.' },
            { name: 'onClick', type: '() => void', description: 'Opens the editor in both states.' },
            { name: 'max', type: 'number', default: '1', description: 'How many to name before collapsing the rest into +n.' },
            { name: 'tooltip', type: 'string', default: "'Edit'", description: 'Hover/focus label on the filled capsule. Does not replace editLabel.' },
            { name: 'disabled', type: 'boolean', default: 'false', description: 'Blocks Add and the capsule. Capsule stays in the tab order.' },
          ]}
        />
      </Section>
    </>
  );
}
