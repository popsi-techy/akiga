'use client';

import * as React from 'react';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { Drawer, Button, Input, useToast } from '@ds/components';

export default function DrawerDocs() {
  const [open, setOpen] = React.useState(false);
  const toast = useToast();
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Drawer"
        description="A right-side panel for create and edit flows — the product's “basic details” pattern. Extends MUI Drawer (overlay, focus trap, Esc to close). Header with an icon tile, a scrollable body, and a right-aligned footer for actions."
      />

      <Section title="Create flow" description="Open a drawer with a form and footer actions.">
        <Example label="click to open">
          <Button startIcon={<VpnKeyOutlined />} onClick={() => setOpen(true)}>
            Create Emergency Access
          </Button>
        </Example>

        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          title="Emergency access basic details"
          subtitle="Provide name and description."
          icon={<VpnKeyOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setOpen(false);
                  toast.success('Emergency access created');
                }}
              >
                Continue
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input label="Name" required placeholder="role_name" size="sm" />
            <Input label="Description" required placeholder="description" size="sm" multiline minRows={3} />
          </div>
        </Drawer>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'open / onClose', type: 'boolean / () => void', description: 'Controlled visibility.' },
            { name: 'title / subtitle', type: 'ReactNode', description: 'Header text.' },
            { name: 'icon', type: 'ReactNode', description: 'Leading icon in a brand-tint tile.' },
            { name: 'footer', type: 'ReactNode', description: 'Right-aligned footer actions.' },
            { name: 'width', type: 'number', default: '480', description: 'Panel width (px).' },
            { name: 'children', type: 'ReactNode', description: 'Scrollable body content.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Use for create/edit flows and multi-field forms.',
            'Keep the primary action in the footer, right-aligned.',
            'Let the body scroll; keep header/footer fixed.',
            'Use a wizard inside for multi-step flows.',
          ]}
          donts={[
            'Don’t use a drawer for a simple confirm — use a Dialog.',
            'Don’t hide the close affordance.',
            'Don’t make it so wide it becomes a page.',
            'Don’t lose form state on accidental close (confirm if dirty).',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { Drawer } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
