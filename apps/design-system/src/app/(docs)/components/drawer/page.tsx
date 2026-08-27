'use client';

import * as React from 'react';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import PersonOutline from '@mui/icons-material/PersonOutline';
import LoginOutlined from '@mui/icons-material/LoginOutlined';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { Drawer, Button, Input, ModeBar, Tabs, useToast } from '@ds/components';

export default function DrawerDocs() {
  const [open, setOpen] = React.useState(false);
  const [modeOpen, setModeOpen] = React.useState(false);
  const [method, setMethod] = React.useState('basic');
  const [section, setSection] = React.useState('request');
  const toast = useToast();
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Drawer"
        description="A right-side panel for create and edit flows — the product's “basic details” pattern. Extends MUI Drawer (overlay, focus trap, Esc to close). Header, optional pinned subheader, a scrollable body, and a right-aligned footer."
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

      <Section
        title="Pinned mode"
        description="subheader and toolbar sit between the header and the scrolling body. A ModeBar and Tabs there stay visible while the form they chose scrolls."
      >
        <Example label="click to open">
          <Button onClick={() => setModeOpen(true)}>Add authorization</Button>
        </Example>
        <Drawer
          open={modeOpen}
          onClose={() => setModeOpen(false)}
          title="Add authorization"
          subtitle="How IGA signs in when it calls this application."
          icon={<VpnKeyOutlined sx={{ fontSize: 22 }} />}
          width={560}
          subheader={
            <ModeBar
              ariaLabel="Authentication method"
              value={method}
              onChange={setMethod}
              options={[
                { value: 'basic', label: 'Basic', icon: <PersonOutline sx={{ fontSize: 18 }} /> },
                { value: 'oauth2', label: 'OAuth 2.0', icon: <LoginOutlined sx={{ fontSize: 18 }} /> },
              ]}
            />
          }
          toolbar={
            method === 'oauth2' ? (
              <Tabs
                aria-label="OAuth configuration"
                items={[
                  { value: 'request', label: 'Request' },
                  { value: 'response', label: 'Response' },
                ]}
                value={section}
                onChange={setSection}
              />
            ) : undefined
          }
          footer={
            <Button variant="secondary" onClick={() => setModeOpen(false)}>
              Close
            </Button>
          }
        >
          <p className="text-body-sm text-text-secondary">
            {method === 'basic'
              ? 'Username and password. Scroll the filler below — the method tiles stay put.'
              : 'OAuth request fields. Scroll the filler below — the method tiles stay put.'}
          </p>
          <div className="mt-4 space-y-3">
            {Array.from({ length: 12 }, (_, i) => (
              <Input key={i} label={`Field ${i + 1}`} placeholder="Scroll past me" />
            ))}
          </div>
        </Drawer>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'open / onClose', type: 'boolean / () => void', description: 'Controlled visibility.' },
            { name: 'title / subtitle', type: 'ReactNode', description: 'Header text.' },
            { name: 'icon', type: 'ReactNode', description: 'Leading icon in a brand-tint tile.' },
            {
              name: 'subheader',
              type: 'ReactNode',
              description: 'Pinned band under the header. Put a ModeBar here when the body replaces itself.',
            },
            {
              name: 'toolbar',
              type: 'ReactNode',
              description: 'Pinned band under the subheader. Put Tabs here when the chosen form has facets (Request / Response).',
            },
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
            'Let the body scroll; keep header, subheader, toolbar, and footer fixed.',
            'Put a ModeBar in subheader when the body is a different form per choice.',
            'Put Tabs in toolbar when the chosen form has facets that must stay visible while it scrolls.',
            'Use a wizard inside for multi-step flows.',
          ]}
          donts={[
            'Don’t use a drawer for a simple confirm — use a Dialog.',
            'Don’t hide the close affordance.',
            'Don’t make it so wide it becomes a page.',
            'Don’t lose form state on accidental close (confirm if dirty).',
            'Don’t sticky a FormSection or Tabs inside the body to fake a pinned switcher.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { Drawer } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
