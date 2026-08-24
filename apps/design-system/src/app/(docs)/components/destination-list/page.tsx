'use client';

import * as React from 'react';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined';
import SecurityOutlined from '@mui/icons-material/SecurityOutlined';
import { PageHeader, Section, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { DestinationList, useToast } from '@ds/components';

export default function DestinationListDocs() {
  const toast = useToast();
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Destination List"
        description="A two-column grid of destination cards. Each card is one place to go: icon, title, and a muted line of what lives there."
      />

      <Section
        title="Two-column catalog"
        description="Title in body-medium, description in caption. Cards in a row share height. The whole card is the target."
      >
        <DestinationList
          aria-label="Example settings"
          items={[
            {
              id: 'mfa',
              title: 'MFA Settings',
              description: 'Second-factor requirements for end users and reviewers.',
              icon: <SecurityOutlined />,
              onClick: () => toast.info('Would open MFA Settings'),
            },
            {
              id: 'access',
              title: 'Access Request Settings',
              description: 'General, application, entitlement, role, and notification defaults.',
              icon: <AssignmentOutlined />,
              onClick: () => toast.info('Would open Access Request Settings'),
            },
            {
              id: 'micro',
              title: 'Micro Certification Settings',
              description: 'When daily events become a micro certification.',
              icon: <FactCheckOutlined />,
              onClick: () => toast.info('Would open Micro Certification Settings'),
            },
          ]}
        />
      </Section>

      <Section title="Empty" description="One empty card. The caller writes why it is empty.">
        <DestinationList
          items={[]}
          empty={
            <div>
              <p className="text-body-sm-strong text-text-primary">No settings match</p>
              <p className="mt-1 text-caption text-text-secondary">Try a different name or keyword.</p>
            </div>
          }
        />
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'items', type: 'DestinationListItem[]', description: 'Destinations, in scan order.' },
            { name: 'empty', type: 'ReactNode', description: 'Shown when items is empty.' },
            { name: 'aria-label', type: 'string', description: 'Name of the list for assistive tech. Default: Destinations.' },
            { name: 'items[].id', type: 'string', description: 'Stable key.' },
            { name: 'items[].title', type: 'string', description: 'The destination name, rendered as body-medium.' },
            { name: 'items[].description', type: 'string', description: 'One or two lines on what lives there, in caption.' },
            { name: 'items[].icon', type: 'ReactNode', description: 'Bare glyph — rendered through Avatar’s 40px entity tile, same as PickerSlot.' },
            { name: 'items[].disabled', type: 'boolean', description: 'Present but not yet available — no arrow, recedes.' },
            { name: 'items[].onClick', type: '() => void', description: 'Navigate. The whole card is the target.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Keep the title short and the description one sentence.',
            'Pass a bare icon — DestinationList sizes it through Avatar. Do not set sx.',
            'Put a search field above the list when the set can grow past a glance.',
          ]}
          donts={[
            'Don’t add a category or eyebrow above the title — the title is the header.',
            'Don’t wrap the icon yourself — Avatar is the tile.',
            'Don’t use it for in-panel section switching — that is NavList.',
            'Don’t nest buttons or links inside a card; the card is already one target.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { DestinationList } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
