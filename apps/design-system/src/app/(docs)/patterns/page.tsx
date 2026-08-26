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
        </div>
      </Section>
    </>
  );
}
