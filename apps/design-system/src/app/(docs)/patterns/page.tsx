import Link from 'next/link';
import { PageHeader, Section, Card } from '@/components/docs/primitives';

export default function PatternsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Patterns"
        title="Patterns"
        description="Composed, reusable solutions to recurring problems. A pattern is how the same job is done everywhere — not a new visual language."
      />

      <Section title="Available" description="Each pattern names the components it is built from.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/patterns/settings-page" className="group">
            <Card className="h-full p-5 transition-shadow group-hover:shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-h5 text-text-primary">Settings page</span>
                <span className="shrink-0 text-text-brand transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </div>
              <p className="mt-1.5 text-body-sm leading-5 text-text-secondary">
                Tenant-admin configuration: 900px column, section saves, stacked grey wells.
              </p>
            </Card>
          </Link>
          <Link href="/patterns/grouped-form" className="group">
            <Card className="h-full p-5 transition-shadow group-hover:shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-h5 text-text-primary">Grouped form</span>
                <span className="shrink-0 text-text-brand transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </div>
              <p className="mt-1.5 text-body-sm leading-5 text-text-secondary">
                Long Drawer or Modal form split into jobs — heading and a hairline, one footer Save.
              </p>
            </Card>
          </Link>
          <Link href="/patterns/catalog-list" className="group">
            <Card className="h-full p-5 transition-shadow group-hover:shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-h5 text-text-primary">Catalog list</span>
                <span className="shrink-0 text-text-brand transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </div>
              <p className="mt-1.5 text-body-sm leading-5 text-text-secondary">
                Searchable table of records — DirectoryListPage, optional hideTitle for Settings.
              </p>
            </Card>
          </Link>
          <Link href="/patterns/two-pane-collection" className="group">
            <Card className="h-full p-5 transition-shadow group-hover:shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-h5 text-text-primary">Two-pane collection</span>
                <span className="shrink-0 text-text-brand transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </div>
              <p className="mt-1.5 text-body-sm leading-5 text-text-secondary">
                240px rail, table, peek — Owners and Assignments.
              </p>
            </Card>
          </Link>
          <Link href="/patterns/table-select-drawer" className="group">
            <Card className="h-full p-5 transition-shadow group-hover:shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-h5 text-text-primary">Table select drawer</span>
                <span className="shrink-0 text-text-brand transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </div>
              <p className="mt-1.5 text-body-sm leading-5 text-text-secondary">
                Catalog pick: table on the left, running selection on the right.
              </p>
            </Card>
          </Link>
          <Link href="/patterns/object-detail-setup" className="group">
            <Card className="h-full p-5 transition-shadow group-hover:shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-h5 text-text-primary">Object-detail setup</span>
                <span className="shrink-0 text-text-brand transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </div>
              <p className="mt-1.5 text-body-sm leading-5 text-text-secondary">
                Draft edited on its tabs; a right-hand dock names what still gates Activate.
              </p>
            </Card>
          </Link>
        </div>
      </Section>
    </>
  );
}
