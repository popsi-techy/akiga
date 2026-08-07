import Link from 'next/link';
import { PageHeader, Section, Card } from '@/components/docs/primitives';

const foundations = [
  { label: 'Colors', href: '/foundations/colors', desc: 'Palettes & semantic roles' },
  { label: 'Typography', href: '/foundations/typography', desc: 'DM Sans type scale' },
  { label: 'Spacing', href: '/foundations/spacing', desc: '4px base scale' },
  { label: 'Radius', href: '/foundations/radius', desc: 'Corner tokens' },
  { label: 'Elevation', href: '/foundations/elevation', desc: 'Shadows & depth' },
  { label: 'Iconography', href: '/foundations/iconography', desc: 'MUI icon usage' },
  { label: 'Grid & Layout', href: '/foundations/grid', desc: 'Breakpoints & shell' },
  { label: 'Motion', href: '/foundations/motion', desc: 'Duration & easing' },
  { label: 'Accessibility', href: '/foundations/accessibility', desc: 'WCAG 2.1 AA floor' },
];

export default function Home() {
  return (
    <>
      <PageHeader
        eyebrow="Living Product"
        title="The akiga Design System"
        description="The single source of truth for how the IGA product looks and behaves. Built from brand tokens, powered by DM Sans, and extended from MUI. Foundations first — components and enterprise IGA patterns follow, and every product screen is assembled from what lives here."
      />

      <Section
        title="Principles"
        description="What this system optimizes for, in order."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ['Consistency > novelty', 'One token, one component, one pattern — everywhere.'],
            ['Reuse > reinvention', 'Extend MUI; build custom only when necessary.'],
            ['Tokens are the atoms', 'Nothing visual is hardcoded — it comes from a token.'],
          ].map(([t, d]) => (
            <Card key={t} className="p-5">
              <div className="text-body font-semibold text-text-primary">{t}</div>
              <p className="mt-1.5 text-body-sm leading-5 text-text-secondary">{d}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Foundations" description="The visual language, derived from the brand palette and product screenshots.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {foundations.map((f) => (
            <Link key={f.href} href={f.href} className="group">
              <Card className="p-5 transition-shadow group-hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-body font-semibold text-text-primary">{f.label}</span>
                  <span className="text-text-brand transition-transform group-hover:translate-x-0.5">→</span>
                </div>
                <p className="mt-1 text-body-sm text-text-secondary">{f.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="How this evolves">
        <Card className="p-5">
          <p className="text-body leading-6 text-text-secondary">
            The Design System and the IGA Product evolve together. When a screen needs a new
            component, pattern, token, or guideline, it is{' '}
            <span className="font-medium text-text-primary">added here first</span>, documented,
            and then used in the product — never the other way around.
          </p>
        </Card>
      </Section>
    </>
  );
}
