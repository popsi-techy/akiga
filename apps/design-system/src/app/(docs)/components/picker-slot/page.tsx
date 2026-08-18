'use client';

import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import AppsOutlined from '@mui/icons-material/Apps';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import { PageHeader, Section, PropsTable, DoDont } from '@/components/docs/primitives';
import { Button, OverflowChips, PickerSlot } from '@ds/components';

const APPS = [
  { id: 'okta', name: 'Okta' },
  { id: 'sf', name: 'Salesforce' },
  { id: 'gh', name: 'GitHub' },
  { id: 'aws', name: 'AWS' },
];

export default function PickerSlotDocs() {
  const [chosen, setChosen] = React.useState<typeof APPS>([]);

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Picker Slot"
        description="One row standing in for a collection chosen elsewhere. States what is chosen and offers the one control that changes it; the choosing happens in a Drawer."
      />

      <Section
        title="One row in both states"
        description="Press the button and back again: the count and the chips replace the “nothing chosen” copy in place. The row does not change shape under the reader the moment they pick something — no card growing into a table, no control moving. That is the property to protect when extending this."
      >
        <div className="max-w-2xl space-y-4">
          <PickerSlot
            icon={<AppsOutlined />}
            title={
              chosen.length === 0
                ? 'No applications chosen'
                : `${chosen.length} application${chosen.length === 1 ? '' : 's'} selected`
            }
            hint={
              chosen.length === 0
                ? 'The review covers the access people hold in these systems.'
                : 'Edit which systems this review covers.'
            }
            summary={chosen.length > 0 ? <OverflowChips items={chosen} /> : undefined}
            {...(chosen.length === 0
              ? {
                  action: (
                    <Button variant="secondary" startIcon={<AddIcon />} onClick={() => setChosen(APPS)}>
                      Add applications
                    </Button>
                  ),
                }
              : { onEdit: () => setChosen([]), editLabel: 'Edit applications' })}
          />
          <PickerSlot
            icon={<VpnKeyOutlined />}
            title="No entitlements granted"
            hint="Single permissions, handed over for one session then taken back."
            action={
              <Button variant="secondary" startIcon={<AddIcon />}>
                Add Entitlements
              </Button>
            }
          />
        </div>
      </Section>

      <Section
        title="Why not just show the table?"
        description="Because a two-pane rail-and-table editor squeezed into a wizard column scrolls sideways and clips its own empty-state copy — and none of that detail is what the step is asking. The step asks “what does this hand over”, and a count with the first name in it answers that. Use the real table on a detail page, where the collection is the subject rather than one answer among six."
      >
        <DoDont
          dos={[
            'Pair it with a Drawer. The slot is the answer; the Drawer is where searching, paging and multi-select belong.',
            'Name what is chosen with OverflowChips in the `summary` — a bare count makes the reader open the drawer to see whether it picked the right things.',
            'Say what editing will change in the filled state’s hint, not what the field is. The reader already knows what it is; they are deciding whether to touch it.',
            'Use it for the same collection the detail page shows as a table, reading and writing the same store, so the two can never drift apart.',
          ]}
          donts={[
            'Don’t pass both `action` and `onEdit` — an empty slot needs a control that says how to start, a filled one needs a way to change what is there, and two controls make the reader work out which applies.',
            'Don’t put a second outlined Button in the filled state; `onEdit` renders a bare pencil precisely so it does not compete with the step’s own primary action.',
            'Don’t let the filled state grow into a list of what was picked. That is the shape change this exists to avoid — put the list in the Drawer.',
            'Don’t use it when the collection IS the page. A slot summarising the one thing a screen is about hides its own subject.',
          ]}
        />
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'icon', type: 'ReactNode', description: 'Outlined, bare — no sx. Rendered through Avatar’s icon tile (40px, glyph at half the box), the same mark the exception queue uses.' },
            { name: 'title', type: 'string', description: 'What is here, or what is missing. The line the reader scans.' },
            { name: 'hint', type: 'string', description: 'Why it matters, or what editing will change. Never a restatement of the title.' },
            { name: 'action', type: 'ReactNode', default: '—', description: 'The control for an empty slot — normally a `secondary` Button naming what will be added. Pass this OR `onEdit`.' },
            { name: 'onEdit', type: '() => void', default: '—', description: 'The control for a filled slot. Renders the standard bare pencil, so every filled slot offers editing the same way.' },
            { name: 'editLabel', type: 'string', default: '—', description: 'Accessible name for the pencil, e.g. “Edit applications”. Required with `onEdit`.' },
            { name: 'summary', type: 'ReactNode', default: '—', description: 'What has been chosen, named beside the control — usually `OverflowChips`. Hidden below `sm`, where keeping the row one line is worth more.' },
          ]}
        />
      </Section>
    </>
  );
}
