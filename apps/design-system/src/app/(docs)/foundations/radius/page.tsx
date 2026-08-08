import { PageHeader, Section, Card, Code } from '@/components/docs/primitives';
import { radius } from '@ds/tokens/tokens';

export default function RadiusPage() {
  return (
    <>
      <PageHeader
        eyebrow="Foundations"
        title="Radius"
        description="Corner radii scale with component size: small for controls, larger for cards and modals, pill for chips and avatars-as-badges."
      />

      <Section title="Scale">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Object.entries(radius).map(([key, value]) => (
            <Card key={key} className="flex flex-col items-center gap-3 p-5">
              <div
                className="h-16 w-16 border-2 border-brand bg-brand-subtle"
                style={{ borderRadius: value }}
              />
              <div className="text-center">
                <div className="text-body-sm-strong text-text-primary">{key}</div>
                <div className="font-mono text-caption text-text-tertiary">{value}</div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Where each is used">
        <Card className="divide-y divide-border text-body-sm">
          {[
            [<Code key="a">md</Code>, 'Buttons, inputs, selects, small menus'],
            [<Code key="b">lg</Code>, 'Cards, list rows, table containers'],
            [<Code key="c">xl</Code>, 'Modals, drawers, large surfaces'],
            [<Code key="d">avatar</Code>, 'Rounded-square avatars with initials'],
            [<Code key="e">pill</Code>, 'Status chips, risk badges, toggles'],
          ].map(([t, use], i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3">
              <div className="w-16 shrink-0">{t}</div>
              <div className="text-text-secondary">{use}</div>
            </div>
          ))}
        </Card>
      </Section>
    </>
  );
}
