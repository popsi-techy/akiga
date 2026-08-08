import { PageHeader, Section, Card, Code } from '@/components/docs/primitives';

export default function VisualLanguagePage() {
  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Visual Language"
        description="How the system's look was derived from the miniOrange brand palette, DM Sans, and screenshots of the existing product. This is the reasoning behind the tokens."
      />

      <Section title="The essence" description="Five words that describe the intended feel.">
        <div className="flex flex-wrap gap-2">
          {['Enterprise', 'Professional', 'Minimal', 'Calm density', 'Trustworthy'].map((w) => (
            <span key={w} className="rounded-pill border border-border bg-surface px-3 py-1 text-body-sm-strong text-text-primary">
              {w}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Color decisions">
        <Card className="divide-y divide-border text-body-sm">
          {[
            ['Brand / primary', 'Orange 700 #EB5424 — buttons, active tabs, avatars, icon tiles.'],
            ['Text', 'Ink — deep navy #172B4D for primary, #44546F for secondary and icons.'],
            ['Links & info', 'Blue 800 #1976D2.'],
            ['Status', 'Green = active/success, Yellow = draft/warning, Red = critical/error.'],
            ['Surfaces', 'White cards on white canvas, separated by neutral hairline borders.'],
            ['Product nav', 'Dark slate #1E2C38 sidebar (in the IGA product shell).'],
          ].map(([k, v], i) => (
            <div key={i} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:gap-4">
              <div className="w-40 shrink-0 font-emphasis text-text-primary">{k}</div>
              <div className="text-text-secondary">{v}</div>
            </div>
          ))}
        </Card>
      </Section>

      <Section title="Form & shape">
        <Card className="p-5 text-body-sm leading-6 text-text-secondary">
          Low elevation: cards are a hairline border plus a faint shadow, with{' '}
          <Code>lg</Code> (12px) corners. Controls use <Code>md</Code> (8px); chips and badges are{' '}
          pills; avatars are rounded squares with a brand tint and an initial. Spacing is generous
          but disciplined on a 4px scale, producing the scannable rhythm the product's dense data
          screens need.
        </Card>
      </Section>

      <Section title="From screenshot to token">
        <Card className="divide-y divide-border text-body-sm">
          {[
            ['Orange “+ Create” button', 'brand.primary + radius.md + button styles'],
            ['“Active” / “Draft” chips', 'status.success / status.warning + pill + dot'],
            ['“Critical (94)” badge', 'status.danger (fg + subtle bg + border), no dot'],
            ['“High (68)” badge', 'status.caution — the orange step between warning and danger'],
            ['Stat tiles (Applications 234…)', 'surface + border + elevation.xs, icon tile in brand.subtle'],
            ['Tabs with orange underline', 'brand.primary active indicator'],
            ['Right-side create drawer', 'radius.xl + elevation.lg'],
          ].map(([shot, token], i) => (
            <div key={i} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="w-64 shrink-0 text-text-primary">{shot}</div>
              <div className="font-mono text-caption text-text-secondary">{token}</div>
            </div>
          ))}
        </Card>
      </Section>
    </>
  );
}
