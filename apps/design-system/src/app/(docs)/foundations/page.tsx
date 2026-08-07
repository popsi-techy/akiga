import Link from 'next/link';
import { PageHeader, Card } from '@/components/docs/primitives';

const items = [
  ['Colors', '/foundations/colors', 'Brand-derived palettes and the semantic roles (text, surface, border, status, risk) components consume.'],
  ['Typography', '/foundations/typography', 'The DM Sans type scale — headings, body, captions — with weights and line-heights.'],
  ['Spacing', '/foundations/spacing', 'A 4px base scale governing padding, gaps, and rhythm.'],
  ['Radius', '/foundations/radius', 'Corner radii from inputs to cards to pills.'],
  ['Elevation', '/foundations/elevation', 'Subtle, enterprise-grade shadows for depth and layering.'],
  ['Iconography', '/foundations/iconography', 'How we use MUI Icons — sizing, color, and consistency.'],
  ['Grid & Layout', '/foundations/grid', 'Breakpoints, the app shell, and layout primitives.'],
  ['Motion', '/foundations/motion', 'Durations and easing curves for calm, purposeful movement.'],
  ['Accessibility', '/foundations/accessibility', 'The WCAG 2.1 AA floor every component must meet.'],
];

export default function FoundationsOverview() {
  return (
    <>
      <PageHeader
        eyebrow="Foundations"
        title="Foundations"
        description="The lowest layer of the system: the visual language derived from the miniOrange brand palette and product screenshots. Everything above — components, patterns, screens — is built from these tokens."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(([label, href, desc]) => (
          <Link key={href} href={href} className="group">
            <Card className="h-full p-5 transition-shadow group-hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-h5 font-semibold text-text-primary">{label}</span>
                <span className="text-text-brand transition-transform group-hover:translate-x-0.5">→</span>
              </div>
              <p className="mt-1.5 text-body-sm leading-5 text-text-secondary">{desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
