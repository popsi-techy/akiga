import { PageHeader, Section, Card, Code } from '@/components/docs/primitives';
import { elevation } from '@ds/tokens/tokens';

export default function ElevationPage() {
  return (
    <>
      <PageHeader
        eyebrow="Foundations"
        title="Elevation"
        description="Depth is subtle and enterprise — mostly a hairline border plus a faint shadow. Reserve stronger shadows for floating surfaces (menus, popovers, modals)."
      />

      <Section title="Shadow tokens">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {Object.entries(elevation)
            .filter(([k]) => k !== 'none')
            .map(([key, value]) => (
              <div key={key} className="flex flex-col items-center gap-3">
                <div
                  className="h-24 w-full rounded-lg border border-border bg-surface"
                  style={{ boxShadow: value }}
                />
                <div className="text-center">
                  <div className="text-body-sm font-medium text-text-primary">{key}</div>
                </div>
              </div>
            ))}
        </div>
      </Section>

      <Section title="Usage">
        <Card className="divide-y divide-border text-body-sm">
          {[
            [<Code key="a">xs / sm</Code>, 'Resting cards, list rows, stat tiles (with a border)'],
            [<Code key="b">md</Code>, 'Dropdowns, popovers, hover-raised cards'],
            [<Code key="c">lg</Code>, 'Drawers and side panels'],
            [<Code key="d">xl</Code>, 'Modals / dialogs'],
          ].map(([t, use], i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3">
              <div className="w-24 shrink-0">{t}</div>
              <div className="text-text-secondary">{use}</div>
            </div>
          ))}
        </Card>
        <p className="mt-3 text-body-sm text-text-tertiary">
          Shadows use an ink-based color at low alpha so they read as depth, not gray haze. Prefer a
          border + <Code>xs</Code> over a heavy shadow for resting surfaces.
        </p>
      </Section>
    </>
  );
}
