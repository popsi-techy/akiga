'use client';

import * as React from 'react';
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { Modal, Button, Input } from '@ds/components';

export default function ModalDocs() {
  const [open, setOpen] = React.useState(false);
  const [wide, setWide] = React.useState(false);

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Modal"
        description="A centered dialog shell for short forms and rich decisions — the counterpart to Drawer, which anchors right. Header, a scrollable body, and a right-aligned footer for actions."
      />

      <Section
        title="Three overlays, three jobs"
        description="Dialog asks a question and states a consequence. Modal holds a short form or a decision that needs supporting content. Drawer holds a long form or a browsing surface where the page behind still matters. Reaching for the wrong one is the most common overlay mistake."
      >
        <Example label="Open the examples">
          <Button onClick={() => setOpen(true)}>Short form</Button>
          <Button variant="secondary" onClick={() => setWide(true)}>
            Wider panel, no close button
          </Button>
        </Example>

        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Add owner"
          subtitle="Owners approve access requests and attest to this application’s risk."
          icon={<PersonAddAltOutlined sx={{ fontSize: 20 }} />}
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Add owner</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input label="Search people" placeholder="Name or email" />
            <Input label="Reason" multiline minRows={3} placeholder="Why this person owns it" />
          </div>
        </Modal>

        <Modal
          open={wide}
          onClose={() => setWide(false)}
          title="Confirm activation"
          width={560}
          showClose={false}
          footer={
            <>
              <Button variant="secondary" onClick={() => setWide(false)}>
                Back
              </Button>
              <Button onClick={() => setWide(false)}>Activate</Button>
            </>
          }
        >
          <p className="text-body text-text-secondary">
            Once activated, this policy begins routing every matching request. Existing in-flight requests keep the
            route they started on.
          </p>
        </Modal>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'open', type: 'boolean', description: 'Visibility. Controlled — the parent owns it.' },
            { name: 'onClose', type: '() => void', description: 'Fired by the ✕, the backdrop and Escape.' },
            { name: 'title', type: 'ReactNode', description: 'Heading, rendered at h5 and wired to aria-labelledby.' },
            { name: 'subtitle', type: 'ReactNode', description: 'One supporting line under the title.' },
            { name: 'icon', type: 'ReactNode', description: 'Leading icon in a brand-tint tile.' },
            { name: 'footer', type: 'ReactNode', description: 'Right-aligned actions — secondary first, primary last.' },
            { name: 'width', type: 'number', default: '480', description: 'Panel width in px; caps at 94vw.' },
            { name: 'height', type: 'number | string', description: 'Fixed panel height. Body fills the leftover and does not scroll — for a canvas that pans itself. Omit for short forms (content-sized, cap 85vh, body scrolls).' },
            { name: 'showClose', type: 'boolean', default: 'true', description: 'Set false when the decision must be made in the footer.' },
            { name: 'children', type: 'ReactNode', description: 'Body content. Scrolls internally; the panel caps at 85vh.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Keep it to one question or one short form — if it needs sections, use a Drawer.',
            'Put the primary action last in the footer, after the secondary.',
            'Set showClose={false} when dismissing without deciding would leave things inconsistent.',
            'Let the body scroll on short forms; never let an unsized modal grow past 85vh. Pass height only for a self-panning canvas.',
          ]}
          donts={[
            'Don’t use a Modal for a simple confirm — that is Dialog.',
            'Don’t open a Modal from a Modal; redesign the flow.',
            'Don’t put a full data table inside — that is a page or a Drawer.',
            'Don’t hide the only way out; if showClose is false, the footer must offer a way back.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { Modal } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
