'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { RowActions } from '@ds/components';

export default function RowActionsDocs() {
  const [last, setLast] = React.useState('Nothing yet');

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Row Actions"
        description="The two things a table row usually offers: see it, or take it out. Both sit on the surface — a kebab that hides one or two items charges a click to discover how little was in it."
      />

      <Section
        title="Details first, remove last"
        description="Neither icon is coloured at rest. Remove finds its danger colour on hover, once the pointer has committed to it."
      >
        <Example label="in a row">
          <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
            <span className="text-body-sm-strong text-text-primary">AdministratorAccess</span>
            <RowActions
              onInfo={() => setLast('Opened details')}
              infoLabel="View details for AdministratorAccess"
              onRemove={() => setLast('Removed')}
              removeLabel="Remove AdministratorAccess"
            />
          </div>
          <p className="mt-3 text-body-sm text-text-secondary">{last}</p>
        </Example>
      </Section>

      <Section title="When to use">
        <DoDont
          dos={[
            'Owners, assignments, and catalog lists where the row offers peek and remove.',
            'Name the row in both aria-labels — eight identical “Remove” buttons are not navigable.',
            'Pair `onInfo` with PeekPanel. The info icon is how the panel opens.',
          ]}
          donts={[
            'A kebab Menu for one or two actions. Surface them.',
            'A red bin at rest. A column of red icons reads as a warning about the data.',
            'Four or five actions — that is still a Menu.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { RowActions } from '@ds/components';`}</Code>
        </p>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'onInfo', type: '() => void', description: 'Opens details — usually a PeekPanel.' },
            { name: 'infoLabel', type: 'string', description: 'Accessible name that includes the row, e.g. “View details for AdministratorAccess”.' },
            { name: 'infoTooltip', type: 'string', default: "'View details'", description: 'Hover label.' },
            { name: 'onRemove', type: '() => void', description: 'Takes the row out of the collection.' },
            { name: 'removeLabel', type: 'string', description: 'Accessible name that includes the row.' },
            { name: 'removeTooltip', type: 'string', default: "'Remove'", description: 'Hover label.' },
          ]}
        />
      </Section>
    </>
  );
}
