'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { Avatar, Button, InfoRow, InfoRowGroup, PeekPanel, PeekSlot } from '@ds/components';

export default function PeekPanelDocs() {
  const [open, setOpen] = React.useState(true);

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Peek Panel"
        description="A side-read that takes width from the table beside it, rather than covering the page. PeekSlot animates width; PeekPanel is the chrome."
      />

      <Section
        title="The table stays usable"
        description="Width, not a transform: the table reflows as the panel opens. 320px is the default — narrow enough that the table stays the protagonist."
      >
        <Example label="master–detail">
          <div className="flex h-[280px] rounded-lg border border-border bg-canvas p-4">
            <div className="min-w-0 flex-1 rounded-lg border border-border bg-surface p-4">
              <p className="text-body-sm-strong text-text-primary">AdministratorAccess</p>
              <p className="mt-1 text-caption text-text-secondary">The table reflows when the panel opens.</p>
              <Button className="mt-3" size="sm" variant="secondary" onClick={() => setOpen((v) => !v)}>
                {open ? 'Close peek' : 'Open peek'}
              </Button>
            </div>
            <PeekSlot open={open}>
              <PeekPanel
                avatar={<Avatar name="AdministratorAccess" initials="A" size="sm" />}
                title="AdministratorAccess"
                subtitle="Entitlement"
                onClose={() => setOpen(false)}
              >
                <InfoRowGroup>
                  <InfoRow label="Application" value="Okta" />
                  <InfoRow label="Type" value="Role" />
                  <InfoRow label="Risk" value="72" />
                </InfoRowGroup>
              </PeekPanel>
            </PeekSlot>
          </div>
        </Example>
      </Section>

      <Section title="When to use">
        <DoDont
          dos={[
            'A row’s details beside the table that listed it. Pair with RowActions.',
            'Render body rows bare — this panel is already the box.',
            'Keep the default 320px unless the peek is genuinely denser.',
          ]}
          donts={[
            'A Drawer. Drawer covers the page; this must leave the table usable.',
            'A Dialog. That is a decision, not a side-read.',
            'A card inside the body. The panel already has a border.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { PeekPanel, PeekSlot } from '@ds/components';`}</Code>
        </p>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'PeekSlot.open', type: 'boolean', description: 'Animates width to `width` or 0.' },
            { name: 'PeekSlot.width', type: 'number', default: '320', description: 'Fixed inner width while the slot is open.' },
            { name: 'title', type: 'string', description: 'The row’s name. Truncates.' },
            { name: 'subtitle', type: 'string', description: 'What kind of thing this is.' },
            { name: 'avatar', type: 'ReactNode', description: 'Optional mark in the header.' },
            { name: 'onClose', type: '() => void', description: 'The header close control.' },
            { name: 'footer', type: 'ReactNode', description: 'Optional actions under the scrolling body.' },
            { name: 'children', type: 'ReactNode', description: 'The scrolling middle — usually InfoRowGroup.' },
          ]}
        />
      </Section>
    </>
  );
}
