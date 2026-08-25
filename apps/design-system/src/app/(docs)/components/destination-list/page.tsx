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
        description="Destinations you go to. Card is a two-column catalog. Plain is icon + label. List is a single column of icon, title, and description."
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

      <Section
        title="List, one column"
        description="Icon, title, and a caption. Hairlines divide the rows. Use it when each destination needs a sentence, not a tile."
      >
        <DestinationList
          appearance="list"
          aria-label="Example settings, list"
          items={[
            {
              id: 'mfa',
              title: 'MFA',
              description: 'Second-factor requirements for end users and reviewers.',
              actionLabel: 'Manage',
              icon: <SecurityOutlined />,
              tone: 'info',
              onClick: () => toast.info('Would open MFA Settings'),
            },
            {
              id: 'access',
              title: 'Access Request',
              description: 'General, application, entitlement, role, and notification defaults.',
              actionLabel: 'Manage defaults',
              icon: <AssignmentOutlined />,
              tone: 'warning',
              onClick: () => toast.info('Would open Access Request Settings'),
            },
            {
              id: 'micro',
              title: 'Micro Certification',
              description: 'When daily events become a micro certification.',
              actionLabel: 'Configure',
              icon: <FactCheckOutlined />,
              onClick: () => toast.info('Would open Micro Certification Settings'),
            },
          ]}
        />
      </Section>

      <Section
        title="Plain, three columns"
        description="Outlined icon well, title, and an optional two-line caption. Colour follows tone (default text-icon, ink 500). Three items per row from md."
      >
        <DestinationList
          appearance="plain"
          columns={3}
          aria-label="Example settings, plain"
          items={[
            {
              id: 'mfa',
              title: 'MFA',
              description: 'Second-factor requirements for end users and reviewers.',
              icon: <SecurityOutlined />,
              onClick: () => toast.info('Would open MFA Settings'),
            },
            {
              id: 'access',
              title: 'Access Request',
              description: 'General, application, entitlement, role, and notification defaults.',
              icon: <AssignmentOutlined />,
              onClick: () => toast.info('Would open Access Request Settings'),
            },
            {
              id: 'micro',
              title: 'Micro Certification',
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
            { name: 'appearance', type: "'card' | 'plain' | 'list'", description: 'card is the Avatar tile. plain is outlined icon well + title + optional caption. list is a single column of icon, title, and description. Default: card.' },
            { name: 'columns', type: '2 | 3 | 4', description: 'Columns from the breakpoint up. Default: 2 for card, 3 for plain. Ignored for list.' },
            { name: 'aria-label', type: 'string', description: 'Name of the list for assistive tech. Default: Destinations.' },
            { name: 'items[].id', type: 'string', description: 'Stable key.' },
            { name: 'items[].title', type: 'string', description: 'The destination name. card and list use body-medium; plain uses card-title (same as a Card header).' },
            { name: 'items[].description', type: 'string', description: 'One or two lines on what lives there, in caption. Shown in card, list, and plain (line-clamp-2).' },
            { name: 'items[].actionLabel', type: 'string', description: 'Optional right-side verb on list rows, in body-medium text-link. Not a second target.' },
            { name: 'items[].icon', type: 'ReactNode', description: 'Bare glyph. Card sizes it through Avatar; plain sits it in a 36px outlined well at 20px; list sizes it to 24px.' },
            { name: 'items[].tone', type: "'neutral' | 'brand' | 'info' | 'success' | 'warning'", description: 'Icon colour on plain and list. Omit for the appearance default: text-icon (ink 500) on plain, text-icon-subtle on list. Ignored on card — Avatar owns that tile.' },
            { name: 'items[].disabled', type: 'boolean', description: 'Present but not yet available — no arrow, recedes.' },
            { name: 'items[].onClick', type: '() => void', description: 'Navigate. The whole item is the target.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Keep the title short and the description one sentence.',
            'Pass a bare icon — do not set sx. Card sizes it through Avatar; plain and list size it to 24px. Use tone to colour the glyph.',
            'Put a search field above the list when the set can grow past a glance.',
            'Use plain for a three-column scan with an outlined icon and a short caption. Use list when each name needs a sentence in one column.',
          ]}
          donts={[
            'Don’t add a category or eyebrow above the title — the title is the header.',
            'Don’t wrap the icon yourself in card appearance — Avatar is the tile.',
            'Don’t wrap or recolour the icon — the appearance owns the tile. Pass tone instead.',
            'Don’t use it for in-panel section switching — that is NavList.',
            'Don’t nest buttons or links inside an item; the item is already one target.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { DestinationList } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
