import Link from 'next/link';
import { PageHeader, Section, DoDont } from '@/components/docs/primitives';

export default function TableSelectDrawerPattern() {
  return (
    <>
      <PageHeader
        eyebrow="Patterns"
        title="Table select drawer"
        description="How a catalog is picked: search and a paginated table on the left, the running selection on the right. One footer Apply. Used for roles, people, connections, and (single) a reviewer."
      />

      <Section
        title="Anatomy"
        description="The slot or the empty table asks; the drawer is where searching and multi-select belong."
      >
        <ol className="list-decimal space-y-2 pl-5 text-body text-text-secondary">
          <li>
            Trigger is an Add button on a collection, or a{' '}
            <span className="text-body-medium text-text-primary">PickerSlot</span> on a
            narrow step.
          </li>
          <li>
            <span className="text-body-medium text-text-primary">TableSelectDrawer</span> at
            820px, padding off, so the two panes meet the edges.
          </li>
          <li>
            Left: search + DataTable (selectable). Right: SelectionPanel.
          </li>
          <li>
            Risk is optional and painted by the caller (`renderRisk`). The Design
            System does not own a risk chip.
          </li>
        </ol>
        <p className="mt-4 text-body-sm text-text-secondary">
          Live building blocks:{' '}
          <Link href="/components/table-select-drawer" className="text-text-brand hover:underline">
            Table Select Drawer
          </Link>
          {' · '}
          <Link href="/components/selection-panel" className="text-text-brand hover:underline">
            Selection Panel
          </Link>
          {' · '}
          <Link href="/components/picker-slot" className="text-text-brand hover:underline">
            Picker Slot
          </Link>
          .
        </p>
      </Section>

      <Section title="When to use">
        <DoDont
          dos={[
            'Choosing named records from a catalog onto an object.',
            '`selectionMode="single"` when only one row can be chosen.',
          ]}
          donts={[
            'FilterDrawer. That stages filters on a list that already exists.',
            'A transfer list or Autocomplete for more than a handful of records.',
          ]}
        />
      </Section>
    </>
  );
}
