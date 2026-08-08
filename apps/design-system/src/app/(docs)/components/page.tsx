import Link from 'next/link';
import { PageHeader, Section, Card } from '@/components/docs/primitives';

const ready = [
  ['Button', '/components/button', 'Action trigger — 4 variants, sizes, loading, icons.'],
  ['Card', '/components/card', 'Border-first content container with header/footer slots.'],
  ['Avatar', '/components/avatar', 'Rounded identity mark — initials or image, groups.'],
  ['Input', '/components/input', 'Text field — labels, states, adornments.'],
  ['Select', '/components/select', 'Single-choice dropdown, matched to Input.'],
  ['Switch', '/components/switch', 'On/off toggle — contained thumb inside a pill track.'],
  ['Tabs', '/components/tabs', 'Detail-page section nav with the brand underline.'],
  ['Status Chip', '/components/status-chip', 'Status & risk pills — one intent→color mapping.'],
  ['Data Table', '/components/data-table', 'Sortable, selectable, paginated list with states.'],
  ['Selection Panel', '/components/selection-panel', 'The “what you selected” side panel for multi-select drawers.'],
  ['Flow Canvas', '/components/flow-canvas', 'Derived-layout builder graph — fan-out/merge, quick-insert, zoom.'],
  ['Radio Card Group', '/components/radio-card-group', 'Single-choice selector as icon + label cards.'],
  ['Drawer', '/components/drawer', 'Right-side panel for create/edit flows.'],
  ['Dialog', '/components/dialog', 'Focused modal for confirmations.'],
  ['Toast', '/components/toast', 'Transient feedback with a depleting progress bar.'],
  ['Menu', '/components/menu', 'Dropdown action menu — the ⋮ row actions.'],
  ['Stat Tile', '/components/stat-tile', 'KPI tile — label, value, tinted icon.'],
  ['Donut Chart', '/components/donut-chart', 'SVG part-to-whole breakdown.'],
];

const planned = ['Badge', 'Checkbox / Radio', 'Breadcrumbs', 'Pagination', 'Wizard / Stepper'];

export default function ComponentsOverview() {
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Components"
        description="Reusable building blocks, extended from MUI wherever possible and themed by our tokens. This spike ships three foundational components end-to-end; the rest follow the same doc format and quality bar."
      />

      <Section title="Available">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ready.map(([label, href, desc]) => (
            <Link key={href} href={href} className="group">
              <Card className="h-full p-5 transition-shadow group-hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-h5 text-text-primary">{label}</span>
                  <span className="text-text-brand transition-transform group-hover:translate-x-0.5">→</span>
                </div>
                <p className="mt-1.5 text-body-sm leading-5 text-text-secondary">{desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Planned next" description="Same doc format — variants, states, props, guidelines, accessibility.">
        <div className="flex flex-wrap gap-2">
          {planned.map((c) => (
            <span key={c} className="rounded-pill border border-border bg-surface px-3 py-1 text-body-sm text-text-secondary">
              {c}
            </span>
          ))}
        </div>
      </Section>
    </>
  );
}
