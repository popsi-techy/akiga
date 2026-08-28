'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { ClickToEditText, StatusChip } from '@ds/components';

export default function ClickToEditDocs() {
  const [name, setName] = React.useState('GitLab Testing Env');
  const [description, setDescription] = React.useState(
    'Break-glass access to the GitLab testing environment when production on-call needs it.',
  );

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Click to Edit"
        description="The visible line is the only thing in flow. The field is an overlay on that same box — the Draft chip and the description do not move when editing starts."
      />

      <Section
        title="The header does not reflow"
        description="Click the title or the description. Enter or blur commits; Escape cancels. A required title that is cleared snaps back."
      >
        <Example label="object title and description">
          <div className="max-w-xl space-y-2">
            <div className="flex items-center gap-2">
              <ClickToEditText
                as="h1"
                className="text-h4 text-text-primary"
                value={name}
                onCommit={setName}
                ariaLabel="name"
                required
              />
              <StatusChip intent="warning" label="Draft" />
            </div>
            <ClickToEditText
              as="p"
              className="text-body text-text-secondary"
              value={description}
              onCommit={setDescription}
              ariaLabel="description"
              multiline
              placeholder="Add a description"
            />
          </div>
        </Example>
      </Section>

      <Section title="When to use">
        <DoDont
          dos={[
            'An object-detail title or description that is edited in place.',
            'Pass the typography class the resting line already uses — the field inherits it.',
            'Keep `required` on the name so an empty commit cannot blank the header.',
          ]}
          donts={[
            'An Input in the header. It occupies its own box and shoves the chip.',
            'A pencil beside the text. The line itself is the control.',
            'A form field that is not a title or description. That is Input.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { ClickToEditText } from '@ds/components';`}</Code>
        </p>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'value / onCommit', type: 'string / (next) => void', description: 'Committed text. Draft is local until Enter, blur, or Escape.' },
            { name: 'as', type: "'h1' | 'p'", default: "'p'", description: 'The sizer element. Title hugs the text; description is a block.' },
            { name: 'className', type: 'string', description: 'Typography for the resting line. Required — this is not a styled primitive of its own.' },
            { name: 'ariaLabel', type: 'string', description: 'Names the field, e.g. “name”. The overlay button is “Edit {ariaLabel}”.' },
            { name: 'multiline', type: 'boolean', default: 'false', description: 'Textarea that grows over the content below. Shift+Enter keeps a newline.' },
            { name: 'required', type: 'boolean', default: 'false', description: 'An empty commit restores the previous value.' },
            { name: 'placeholder', type: 'string', description: 'Shown when the value is blank.' },
          ]}
        />
      </Section>
    </>
  );
}
