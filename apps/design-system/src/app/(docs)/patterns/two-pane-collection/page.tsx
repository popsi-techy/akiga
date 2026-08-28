import Link from 'next/link';
import { PageHeader, Section, DoDont } from '@/components/docs/primitives';

export default function TwoPaneCollectionPattern() {
  return (
    <>
      <PageHeader
        eyebrow="Patterns"
        title="Two-pane collection"
        description="A 240px rail of kinds beside a table of what is chosen, with an optional peek that takes width from the table. Emergency Access Owners and Assignments are the reference."
      />

      <Section
        title="Anatomy"
        description="The collection is the subject. The rail names the kinds; the table lists the members of the current kind."
      >
        <ol className="list-decimal space-y-2 pl-5 text-body text-text-secondary">
          <li>
            <span className="text-body-medium text-text-primary">NavList</span> at 240px —
            one item per kind, with a count. Not Tabs, not a SegmentedControl.
          </li>
          <li>
            <span className="text-body-medium text-text-primary">DataTable</span> of the
            current kind. Search sits above it. Add opens a Table Select Drawer
            (or EntityCatalogDrawer when the catalog is applications).
          </li>
          <li>
            <span className="text-body-medium text-text-primary">RowActions</span> on every
            row — peek and remove, not a kebab.
          </li>
          <li>
            <span className="text-body-medium text-text-primary">PeekSlot + PeekPanel</span>{' '}
            at 320px. The table drops columns the panel already states so Actions
            stay reachable.
          </li>
        </ol>
        <p className="mt-4 text-body-sm text-text-secondary">
          Live building blocks:{' '}
          <Link href="/components/nav-list" className="text-text-brand hover:underline">
            Nav List
          </Link>
          {' · '}
          <Link href="/components/row-actions" className="text-text-brand hover:underline">
            Row Actions
          </Link>
          {' · '}
          <Link href="/components/peek-panel" className="text-text-brand hover:underline">
            Peek Panel
          </Link>
          {' · '}
          <Link href="/components/table-select-drawer" className="text-text-brand hover:underline">
            Table Select Drawer
          </Link>
          . Decision in{' '}
          <code className="text-caption">docs/architecture/decisions/0015-promote-object-setup-compositions.md</code>.
        </p>
      </Section>

      <Section title="When to use">
        <DoDont
          dos={[
            'Owners, assignments, or any collection split by kind on an object detail.',
            'Drop columns the peek already shows so the Actions cell cannot scroll away.',
          ]}
          donts={[
            'Squeezing this into a wizard column. That is PickerSlot plus a drawer.',
            'A SegmentedControl above the table. The rail is the kind switcher.',
            'A Drawer for the peek. The table must stay usable.',
          ]}
        />
      </Section>
    </>
  );
}
