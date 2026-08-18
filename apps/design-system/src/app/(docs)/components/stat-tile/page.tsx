import AppsOutlined from '@mui/icons-material/AppsOutlined';
import PeopleOutlined from '@mui/icons-material/PeopleOutlined';
import PersonOffOutlined from '@mui/icons-material/PersonOffOutlined';
import VerifiedUserOutlined from '@mui/icons-material/VerifiedUserOutlined';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { StatTile } from '@ds/components';

export default function StatTileDocs() {
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Stat Tile"
        description="A KPI tile — label, large value, and an icon in a tinted rounded square. The dashboard's headline metrics. The icon is graphical (WCAG 3:1), so brand-orange on tint is fine."
      />

      <Section
        title="Every listable number should open"
        description="Pass `href` (or `onClick`) and the whole tile becomes one link. A tile answers “how many”; the reader's next question is always “which ones”, and a tile that cannot answer it makes them rebuild the same filter by hand somewhere else. The affordance is the tile's own hover, not a “View all” link in the corner — a second target inside a card that is already one target gives two places to aim for one outcome. Omit it only when there is nothing to list, like a percentage."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <StatTile label="External identities" value={6} tone="warning" hint="Contractors, vendors, partners" href="/iga/directory/external-identities" />
          <StatTile label="Ownership coverage" value="86%" tone="info" hint="Nothing to list — no href" />
        </div>
      </Section>

      <Section title="Tones" description="Color the icon tile by tone. Every metric definition lives in the PKB (metrics.json).">
        <Example label="brand · info · success · warning">
          <div className="w-56"><StatTile label="Applications" value="234" tone="brand" icon={<AppsOutlined sx={{ fontSize: 22 }} />} /></div>
          <div className="w-56"><StatTile label="Workforce" value="3,413" tone="info" icon={<PeopleOutlined sx={{ fontSize: 22 }} />} /></div>
          <div className="w-56"><StatTile label="Entitlements" value="34,123" tone="success" icon={<VerifiedUserOutlined sx={{ fontSize: 22 }} />} /></div>
          <div className="w-56"><StatTile label="Orphan Accounts" value="32" tone="warning" icon={<PersonOffOutlined sx={{ fontSize: 22 }} />} hint="+4 this week" /></div>
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'label', type: 'string', description: 'Metric name (from metrics.json).' },
            { name: 'value', type: 'ReactNode', description: 'The formatted value.' },
            { name: 'icon', type: 'ReactNode', description: 'A MUI icon; the tile colors it.' },
            { name: 'tone', type: "'brand'|'info'|'success'|'warning'|'danger'|'neutral'", default: "'brand'", description: 'Icon tile color.' },
            { name: 'hint', type: 'ReactNode', description: 'Optional trend/subtext under the value.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={['Use for defined KPIs (metrics.json).', 'Keep the value formatted and scannable.', 'Pick a tone that matches the metric’s meaning.', 'Link the tile to the filtered list it summarizes.']}
          donts={['Don’t invent metrics without a definition.', 'Don’t crowd with long labels.', 'Don’t use color as the only signal.', 'Don’t hardcode colors — use tone.']}
        />
        <p className="mt-3 text-body-sm text-text-tertiary"><Code>{`import { StatTile } from '@ds/components';`}</Code></p>
      </Section>
    </>
  );
}
