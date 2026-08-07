'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { Dialog, Button, useToast } from '@ds/components';

export default function DialogDocs() {
  const [save, setSave] = React.useState(false);
  const [revoke, setRevoke] = React.useState(false);
  const toast = useToast();

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Dialog"
        description="A focused modal for confirmations and short decisions. Extends MUI Dialog (overlay, focus trap, Esc). Follows the product's copy rules: the title states the action, the body states the consequence, and buttons are verbs. Use the danger tone for destructive actions."
      />

      <Section title="Confirmation" description="Default and destructive (danger) confirmations.">
        <Example label="default · danger">
          <Button variant="secondary" onClick={() => setSave(true)}>Save changes</Button>
          <Button variant="danger" onClick={() => setRevoke(true)}>Revoke access</Button>
        </Example>

        <Dialog
          open={save}
          onClose={() => setSave(false)}
          title="Save changes?"
          confirmLabel="Save"
          onConfirm={() => {
            setSave(false);
            toast.success('Changes saved');
          }}
        >
          Your changes will be applied immediately across the organization.
        </Dialog>

        <Dialog
          open={revoke}
          onClose={() => setRevoke(false)}
          tone="danger"
          title="Revoke 3 entitlements?"
          confirmLabel="Revoke Access"
          onConfirm={() => {
            setRevoke(false);
            toast.success('3 entitlements revoked');
          }}
        >
          These users will lose access immediately. This action is logged and cannot be undone from
          here.
        </Dialog>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'open / onClose', type: 'boolean / () => void', description: 'Controlled visibility.' },
            { name: 'title', type: 'ReactNode', description: 'States the action/question.' },
            { name: 'children', type: 'ReactNode', description: 'The consequence / body text.' },
            { name: 'onConfirm', type: '() => void', description: 'Primary action handler.' },
            { name: 'confirmLabel / cancelLabel', type: 'string', default: "'Confirm' / 'Cancel'", description: 'Verb labels.' },
            { name: 'tone', type: "'default' | 'danger'", default: "'default'", description: 'Danger = red confirm.' },
            { name: 'loading', type: 'boolean', description: 'Spinner on confirm during async.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Title = the question: “Revoke 3 entitlements?”',
            'Body = the specific, honest consequence.',
            'Buttons = verbs: “Revoke Access”, not “Yes”.',
            'Use tone="danger" for destructive, irreversible actions.',
          ]}
          donts={[
            'Don’t use Yes/No buttons when a verb fits.',
            'Don’t use a Dialog for long forms — use a Drawer.',
            'Don’t make “Cancel” the visually dominant action.',
            'Don’t hide what will happen behind vague copy.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { Dialog } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
