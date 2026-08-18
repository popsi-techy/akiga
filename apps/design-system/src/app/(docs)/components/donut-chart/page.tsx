import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { DonutChart, Card } from '@ds/components';

export default function DonutChartDocs() {
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Donut Chart"
        description="A lightweight SVG donut (no chart library) for part-to-whole breakdowns — certification status, policy states. Segment colors are passed as tokens; the center shows a total and an optional legend lists the parts."
      />

      <Section title="Basic">
        <Example label="with center + legend">
          <div className="w-64">
            <Card className="p-5">
              <DonutChart
                segments={[
                  { label: 'Completed', value: 1180, color: 'var(--ds-color-status-success-solid)' },
                  { label: 'In Progress', value: 520, color: 'var(--ds-color-status-info-solid)' },
                  { label: 'Ready to launch', value: 460, color: 'var(--ds-color-brand-primary)' },
                  { label: 'Others', value: 240, color: 'var(--ds-color-border-strong)' },
                ]}
                centerValue="2,400"
                centerLabel="Total"
                ariaLabel="Certification status breakdown"
              />
            </Card>
          </div>
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'segments', type: 'DonutSegment[]', description: '{ label, value, color, href? } — color is a token; href makes that legend row link to the rows behind the slice.' },
            { name: 'centerValue / centerLabel', type: 'ReactNode', description: 'Center overlay (e.g. total).' },
            { name: 'size / thickness', type: 'number', default: '180 / 22', description: 'Donut geometry (px).' },
            { name: 'legend', type: 'boolean', default: 'true', description: 'Show the 2-column legend.' },
            { name: 'ariaLabel', type: 'string', description: 'Accessible description of the data.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={['Use token colors for segments.', 'Keep to ≤5 segments for legibility.', 'Provide an ariaLabel describing the data.', 'Show the total in the center.', 'Give each segment an href when the rows behind it exist somewhere — a legend is the natural place to open them.']}
          donts={['Don’t use for time series (use a line/bar later).', 'Don’t rely on color alone — the legend carries labels.', 'Don’t pass raw hex — use tokens.', 'Don’t cram many tiny slices.', 'Don’t re-tint a linked legend row blue — the row is the target, and the swatch already owns the colour in it.']}
        />
        <p className="mt-3 text-body-sm text-text-tertiary"><Code>{`import { DonutChart } from '@ds/components';`}</Code></p>
      </Section>
    </>
  );
}
