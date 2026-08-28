import Link from 'next/link';
import { PageHeader, Section, DoDont } from '@/components/docs/primitives';

export default function CatalogListPattern() {
  return (
    <>
      <PageHeader
        eyebrow="Patterns"
        title="Catalog list"
        description="A searchable table of records that open a detail or a 480px Drawer. DirectoryListPage is the frame so Directory, Emergency Access, certifications, SoD policies and System Settings catalogs share one chrome."
      />

      <Section
        title="Anatomy"
        description="The list is the page. Nothing wraps the table in a Card."
      >
        <ol className="list-decimal space-y-2 pl-5 text-body text-text-secondary">
          <li>
            <span className="text-body-medium text-text-primary">DirectoryListPage</span> —
            title, search, optional Filter, fill-height DataTable, row-click.
          </li>
          <li>
            System Settings catalogs pass <code className="text-caption">hideTitle</code>{' '}
            and usually <code className="text-caption">hideFilter</code> — the
            breadcrumb already names the screen.
          </li>
          <li>
            Create opens a 480px Drawer, not a full-page wizard, unless the
            object is large enough to need its own route after save.
          </li>
          <li>
            Row actions that are peek-and-remove use{' '}
            <span className="text-body-medium text-text-primary">RowActions</span>.
          </li>
        </ol>
        <p className="mt-4 text-body-sm text-text-secondary">
          Live building blocks:{' '}
          <Link href="/components/directory-list-page" className="text-text-brand hover:underline">
            Directory List Page
          </Link>
          {' · '}
          <Link href="/components/data-table" className="text-text-brand hover:underline">
            Data Table
          </Link>
          {' · '}
          <Link href="/components/filter-drawer" className="text-text-brand hover:underline">
            Filter Drawer
          </Link>
          .
        </p>
      </Section>

      <Section title="When to use">
        <DoDont
          dos={[
            'Any catalog of records with search and a row that opens something.',
            'Settings catalogs that look like Directory, not Settings page.',
          ]}
          donts={[
            'Settings page (ADR-0012). That is named settings with section saves.',
            'A Card around the grey well or the table.',
            'A visible page h1 under a Settings breadcrumb that already names it.',
          ]}
        />
      </Section>
    </>
  );
}
