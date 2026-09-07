'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { BlockEditor } from '@ds/components';

const SEED = '<h1>Welcome aboard</h1><p>Your account is ready. Press “/” on a new line to add a heading, a list or a divider.</p>';

export default function BlockEditorDocs() {
  const [html, setHtml] = React.useState(SEED);
  const [readOnly, setReadOnly] = React.useState('<p>A finished document, rendered without an editor around it.</p>');

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Block Editor"
        description="A block-style rich-text editor: type “/” for a command menu, select text for a formatting bar. For composing a document, where the unit is the block rather than the field."
      />

      <Section
        title="Editing"
        description="Type “/” at the start of a block for headings, lists, to-dos, quotes, code and dividers. Select a run of text for bold, italic, underline, strikethrough and inline code. Arrow keys move through the menu, Enter inserts, Escape dismisses."
      >
        <Example label="Default">
          <div className="rounded-lg border border-border bg-surface p-4">
            <BlockEditor value={SEED} onChange={setHtml} ariaLabel="Example document" />
          </div>
        </Example>
        <Example label="The HTML it reports">
          <Code>{html}</Code>
        </Example>
      </Section>

      <Section
        title="Read-only"
        description="`editable={false}` keeps the same rendering and drops the caret, the slash menu and the formatting bar. Use it to show a document that someone else composed."
      >
        <Example label="editable={false}">
          <div className="rounded-lg border border-border bg-surface p-4">
            <BlockEditor
              value={readOnly}
              onChange={setReadOnly}
              editable={false}
              ariaLabel="Read-only document"
            />
          </div>
        </Example>
      </Section>

      <Section
        title="Not the same thing as a Rich Text Editor"
        description="`RichTextEditor` is a form field: a short, bounded run of formatted text with a fixed toolbar — a description, a justification, a policy note. It has no document model, so it cannot know it is inside a to-do item or turn one block into another. Reach for it first. Reach for this one when the answer is a document."
      >
        <PropsTable
          rows={[
            {
              name: 'value',
              type: 'string',
              description:
                'HTML, read once on mount. Feeding it back on every keystroke would re-parse the document and drop the selection, so this is uncontrolled — to replace the content from outside, remount with a key.',
            },
            {
              name: 'onChange',
              type: '(html: string) => void',
              description:
                'Fires when the document actually differs. A re-serialisation of unchanged content is not reported, so "unsaved changes" cannot light up on a document that was only opened.',
            },
            {
              name: 'placeholder',
              type: 'string',
              default: "“Write something, or press '/' for commands”",
              description: 'Shown in the block the caret is in, not in every empty block.',
            },
            { name: 'editable', type: 'boolean', default: 'true', description: 'False renders the document without editing affordances.' },
            {
              name: 'ariaLabel',
              type: 'string',
              description:
                'Required. A bare contenteditable announces nothing, so the editing region has to be named.',
            },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Use it where the output is a document — an email body, a long policy note, published guidance.',
            'Give it a real width. Blocks, lists and quotes need a reading measure to read as structure.',
            'Keep the surrounding chrome yours: this renders the document, not the page around it.',
          ]}
          donts={[
            'Do not use it for a single-line or short field. That is Input, or RichTextEditor.',
            'Do not write value back to it on every change — it is uncontrolled on purpose.',
            'Do not add a Tiptap Pro extension (drag handles, comments, AI) without an ADR. Everything here is the MIT distribution, and a licence behind a design-system component the docs tell people to reuse freely is a decision, not a detail.',
          ]}
        />
      </Section>

      <Section title="Import">
        <Code>{`import { BlockEditor } from '@ds/components';`}</Code>
      </Section>
    </>
  );
}
