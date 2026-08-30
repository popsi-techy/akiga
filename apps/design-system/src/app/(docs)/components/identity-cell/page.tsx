'use client';

import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { IdentityCell, StatusChip, DataTable, type Column } from '@ds/components';

type Person = { id: string; name: string; email: string };

const PEOPLE: Person[] = [
  { id: 'p1', name: 'Liam Turner', email: 'liam.turner@acme.com' },
  { id: 'p2', name: 'Marcus Lee', email: 'marcus.lee@acme.com' },
  { id: 'p3', name: 'Priya Sharma', email: '' },
];

const columns: Column<Person>[] = [
  {
    id: 'name',
    header: 'Name',
    sortable: true,
    wrap: true,
    value: (p) => p.name,
    render: (p) => <IdentityCell name={p.name} email={p.email} />,
  },
];

export default function IdentityCellDocs() {
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Identity Cell"
        description="The table treatment for a person or an account: a 28px avatar, the name, and the email on the line under it. There is no Email column — that column is a second scan target for the same fact, and the first thing a drawer or Peek has to hide."
      />

      <Section
        title="In a table"
        description="The column that holds this cell must set wrap. Two lines, and the default clip would shave them."
      >
        <Example label="name over email, no Email column">
          <div className="w-full max-w-md">
            <DataTable<Person> columns={columns} rows={PEOPLE} />
          </div>
        </Example>
      </Section>

      <Section
        title="Kind"
        description="A person is round; an account is a rounded square — the same meaning Avatar.kind carries. Size is not a prop: tables always use s (28px)."
      >
        <Example label="person · account · account with a trailing chip">
          <IdentityCell name="Liam Turner" email="liam.turner@acme.com" />
          <IdentityCell name="svc-okta-provisioning" email="okta-bot@acme.com" kind="entity" />
          <IdentityCell
            name="legacy-admin"
            email=""
            kind="entity"
            trailing={<StatusChip intent="warning" label="Orphan" />}
          />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'name', type: 'string', description: 'Shown on the first line and used for the avatar letter.' },
            {
              name: 'email',
              type: 'string',
              description:
                'Second line. Pass it (including an empty string) so every row keeps the same height; omit it for a name-only cell. Empty renders as an em dash.',
            },
            { name: 'kind', type: "'person' | 'entity'", default: "'person'", description: 'Round for a person; rounded square for an account.' },
            { name: 'trailing', type: 'ReactNode', description: 'A chip that belongs to the identity — Orphan on an account.' },
            { name: 'className', type: 'string', description: 'On the outer flex row.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Use this in every table of people or accounts.',
            'Set Column.wrap on the column that holds it.',
            'Keep email searchable even though it is no longer its own column.',
          ]}
          donts={[
            'Don’t add a dedicated Email column beside it.',
            'Don’t hand-roll Avatar + name + email in a cell — that is this component.',
            'Don’t pass a size. Tables use s (28px); a header or a profile card is Avatar md, not this.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { IdentityCell } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
