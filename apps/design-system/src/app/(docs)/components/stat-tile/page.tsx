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

      <Section title="Tones" description="Color the icon tile by tone. Every metric definition lives in the PKB (metrics.json).">
        <Example label="brand · info · success · warning">
          <div className="w-56"><StatTile label="Applications" value="234" tone="brand" icon={<AppsOutlined sx={{ fontSize: 22 }} />} /></div>
          <div className="w-56"><StatTile label="User Identities" value="3,413" tone="info" icon={<PeopleOutlined sx={{ fontSize: 22 }} />} /></div>
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
