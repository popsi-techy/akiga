'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { RichTextEditor, plainText } from '@ds/components';

export default function RichTextEditorDocs() {
  const [html, setHtml] = React.useState('<p>Approved for the quarter-end close. <b>Revoke on 30 Sep.</b></p>');
  const text = plainText(html).trim();

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Rich Text Editor"
        description="A lightweight formatted-text field for justifications and notes. Enough formatting to structure a paragraph of reasoning — not a document editor."
      />

      <Section
        title="Uncontrolled by design"
        description="The field holds its own DOM and emits HTML through onChange. Writing the value back on every keystroke would reset the caret to the start of the field on each character — the classic contentEditable bug — so the component sets its initial content once and stays uncontrolled thereafter."
      >
        <Example label="Try it">
          <div className="w-full max-w-xl">
            <RichTextEditor ariaLabel="Justification" value={html} onChange={setHtml} placeholder="Why this access is needed…" />
          </div>
        </Example>
        <div className="mt-3 rounded-lg border border-border bg-sunken p-3">
          <div className="text-caption text-text-tertiary">plainText(value) — {text.length} characters</div>
          <div className="mt-1 text-body-sm text-text-primary">{text || '(empty)'}</div>
        </div>
      </Section>

      <Section
        title="Validate on the text, not the markup"
        description="An “empty” editor still contains markup — a stray <p><br></p> is not empty to a length check but is empty to a reader. plainText strips tags and normalises non-breaking spaces, so use it for required-field and character-count validation."
      >
        <PropsTable
          rows={[
            { name: 'value', type: 'string', default: "''", description: 'Initial HTML. Read once on mount; the field is uncontrolled after that.' },
            { name: 'onChange', type: '(html: string) => void', description: 'Fires with the current HTML on every edit.' },
            { name: 'placeholder', type: 'string', default: "'Write here…'", description: 'Shown while the field has no text content.' },
            { name: 'minHeight', type: 'number', default: '160', description: 'Minimum body height in px; the field grows past it.' },
            { name: 'ariaLabel', type: 'string', description: 'Accessible name — required when there is no visible label.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Use plainText() for emptiness and length validation.',
            'Reach for it only where formatting genuinely helps — a justification, a policy note.',
            'Give it an ariaLabel; it is a contenteditable, not a labelled input.',
            'Sanitise on the way in if the HTML ever comes from another user.',
          ]}
          donts={[
            'Don’t drive value on every keystroke — it is uncontrolled on purpose.',
            'Don’t use it for a single-line field; that is Input.',
            'Don’t use it for anything needing tables, images or embeds — it is not a document editor.',
            'Don’t render stored HTML back to other users without sanitising it first.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { RichTextEditor, plainText } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
