import Link from 'next/link';
import { PageHeader, Section, Card } from '@/components/docs/primitives';

/**
 * The component index, grouped by the job a component does — the same grouping the
 * sidebar uses, so the two never disagree about where something lives. Every entry
 * here has a documented page; when a component ships, it lands in both places.
 */
const groups: { title: string; description: string; items: [string, string, string][] }[] = [
  {
    title: 'Core',
    description: 'The pieces almost every screen is built from.',
    items: [
      ['Button', '/components/button', 'Action trigger — 4 variants, sizes, loading, icons.'],
      ['Card', '/components/card', 'Border-first content container with header/footer slots.'],
      ['Avatar', '/components/avatar', 'Rounded identity mark — initials or image, groups.'],
      ['App Icon', '/components/app-icon', 'Application mark — real logo, or a first-letter tile.'],
      ['Info Row', '/components/info-row', 'Label/value rows that share one column, for detail rails.'],
      ['Overflow Chips', '/components/overflow-chips', 'A few named things plus a +n that reveals the rest.'],
      ['Status Chip', '/components/status-chip', 'Status & risk pills — one intent→color mapping.'],
      ['Meter', '/components/meter', 'Slim proportion bar for completion and coverage.'],
    ],
  },
  {
    title: 'Forms & Input',
    description: 'Every control shares one height scale, so a toolbar row lines up without adjustment.',
    items: [
      ['Input', '/components/input', 'Text field — labels, states, adornments.'],
      ['Select', '/components/select', 'Single-choice dropdown, matched to Input.'],
      ['Checkbox', '/components/checkbox', 'The 18px box — checked, mixed, brand or danger tone.'],
      ['Radio', '/components/radio', 'The 18px dot — single choice, in lists and table rows.'],
      ['Switch', '/components/switch', 'On/off toggle — contained thumb inside a pill track.'],
      ['Date Picker', '/components/date-picker', 'Themed month grid — replaces the native date input.'],
      ['Time Picker', '/components/time-picker', '12-hour field over a 24-hour value, three columns.'],
      ['Rich Text Editor', '/components/rich-text-editor', 'Lightweight formatted text for justifications and notes.'],
    ],
  },
  {
    title: 'Selection',
    description: 'Choosing one thing, choosing many, and showing what was chosen.',
    items: [
      ['Radio Card Group', '/components/radio-card-group', 'Single-choice selector as icon + label cards.'],
      ['Selectable List', '/components/selectable-list', 'Multi-select rows with descriptions and trailing content.'],
      ['Selection Panel', '/components/selection-panel', 'The “what you selected” side panel for multi-select drawers.'],
      ['Picker Slot', '/components/picker-slot', 'One row standing in for a collection chosen in a drawer.'],
      ['Segmented Control', '/components/segmented-control', 'Connected toggle where one segment is always on.'],
      ['Quick Filter', '/components/quick-filter', 'Standalone filter chips where cleared is a real state.'],
    ],
  },
  {
    title: 'Navigation',
    description: 'Moving between views, sections, and steps.',
    items: [
      ['Tabs', '/components/tabs', 'Detail-page section nav with the brand underline.'],
      ['Nav List', '/components/nav-list', 'Vertical in-panel section switcher with counts.'],
      ['Nav Card', '/components/nav-card', 'Launcher card for landing pages that route into a section.'],
      ['Destination List', '/components/destination-list', 'Two-column destination cards — icon, title, muted description.'],
      ['Menu', '/components/menu', 'Dropdown action menu — the ⋮ row actions.'],
      ['Stepper', '/components/stepper', 'Numbered progress for short linear flows.'],
      ['Setup Bar', '/components/setup-bar', 'Floating strip under a draft — Next, Back, Activate.'],
      ['Step Tracker', '/components/step-tracker', 'Vertical progress rail beside a multi-step form.'],
    ],
  },
  {
    title: 'Data Display',
    description: 'Reading a lot of records, and summarising them.',
    items: [
      ['Data Table', '/components/data-table', 'Sortable, selectable, paginated list with states.'],
      ['Stat Tile', '/components/stat-tile', 'KPI tile — label, value, tinted icon.'],
      ['Donut Chart', '/components/donut-chart', 'SVG part-to-whole breakdown.'],
      ['Bar Chart', '/components/bar-chart', 'Horizontal ranked comparison — which of these is biggest.'],
    ],
  },
  {
    title: 'Canvas',
    description: 'Derived-layout graphs. Nodes are never dragged — position comes from the data.',
    items: [
      ['Flow Canvas', '/components/flow-canvas', 'Builder graph for a sequence — fan-out/merge, quick-insert.'],
      ['Relationship Canvas', '/components/relationship-canvas', 'Layered relationship graph — typed edges, focus dimming.'],
    ],
  },
  {
    title: 'Overlays',
    description: 'Four surfaces, four jobs. Picking the wrong one is the most common overlay mistake.',
    items: [
      ['Drawer', '/components/drawer', 'Right-side panel for long forms and browsing.'],
      ['Filter Drawer', '/components/filter-drawer', 'Two-pane filtering — categories left, options right, staged until Apply.'],
      ['Modal', '/components/modal', 'Centered panel for a short form or a rich decision.'],
      ['Dialog', '/components/dialog', 'Focused prompt for confirmations and consequences.'],
      ['Toast', '/components/toast', 'Transient feedback with a depleting progress bar.'],
      ['Tooltip', '/components/tooltip', 'Contextual label on hover/focus — label or rich card.'],
    ],
  },
];

const planned = ['Badge', 'Breadcrumbs', 'Pagination', 'Empty State', 'Skeleton'];

export default function ComponentsOverview() {
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Components"
        description={`Reusable building blocks, extended from MUI wherever possible and themed by our tokens. All ${total} are documented end-to-end — variants, states, props, guidelines, accessibility — and grouped below by the job they do.`}
      />

      {groups.map((group) => (
        <Section key={group.title} title={group.title} description={group.description}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map(([label, href, desc]) => (
              <Link key={href} href={href} className="group">
                <Card className="h-full p-5 transition-shadow group-hover:shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-h5 text-text-primary">{label}</span>
                    <span className="shrink-0 text-text-brand transition-transform group-hover:translate-x-0.5">→</span>
                  </div>
                  <p className="mt-1.5 text-body-sm leading-5 text-text-secondary">{desc}</p>
                </Card>
              </Link>
            ))}
          </div>
        </Section>
      ))}

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
