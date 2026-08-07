'use client';

import EditOutlined from '@mui/icons-material/EditOutlined';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { Menu, Button, useToast } from '@ds/components';

export default function MenuDocs() {
  const toast = useToast();
  const items = [
    { label: 'Edit', icon: <EditOutlined sx={{ fontSize: 18 }} />, onClick: () => toast.info('Edit') },
    { label: 'Duplicate', icon: <ContentCopyOutlined sx={{ fontSize: 18 }} />, onClick: () => toast.info('Duplicated'), divider: true },
    { label: 'Delete', icon: <DeleteOutline sx={{ fontSize: 18 }} />, danger: true, onClick: () => toast.error('Deleted') },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Menu"
        description="A dropdown action menu — the ⋮ row-actions pattern. Extended from MUI Menu. Danger items render in the danger color; it stops click propagation so it works inside clickable table rows."
      />

      <Section title="Default (⋮ trigger)">
        <Example label="row actions with a danger item">
          <Menu items={items} />
        </Example>
      </Section>

      <Section title="Custom trigger">
        <Example label="any element as the trigger">
          <Menu trigger={<Button variant="secondary" size="sm">Actions ▾</Button>} items={items} />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'items', type: 'MenuActionItem[]', description: '{ label, icon?, onClick?, danger?, disabled?, divider? }.' },
            { name: 'trigger', type: 'ReactElement', description: 'Custom trigger; defaults to a ⋮ icon button.' },
            { name: 'ariaLabel', type: 'string', default: "'Actions'", description: 'Accessible name for the default trigger.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Use for secondary/row actions (Edit, Duplicate, Delete).',
            'Put destructive actions last, marked danger, after a divider.',
            'Keep labels to a verb + object.',
            'Confirm destructive actions with a Dialog.',
          ]}
          donts={[
            'Don’t hide the primary action in a menu.',
            'Don’t overload with 10+ items — group or split.',
            'Don’t use for navigation (that’s the sidebar/tabs).',
            'Don’t delete immediately — confirm first.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { Menu } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
