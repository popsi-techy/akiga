import { PageHeader, Section, Card, Code } from '@/components/docs/primitives';
import { spacing } from '@ds/tokens/tokens';

export default function SpacingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Foundations"
        title="Spacing"
        description="A 4px base scale governs all padding, margins, and gaps. Consistent spacing creates the calm, scannable rhythm enterprise data screens need."
      />

      <Section title="Scale" description="Token → value. Use tokens (or Tailwind spacing aliases), never arbitrary px.">
        <Card className="divide-y divide-border">
          {Object.entries(spacing).map(([key, value]) => (
            <div key={key} className="flex items-center gap-4 px-5 py-2.5">
              <div className="w-16 shrink-0 font-mono text-caption text-text-secondary">{key}</div>
              <div className="w-16 shrink-0 font-mono text-caption text-text-tertiary">{value}</div>
              <div className="h-4 rounded-xs bg-brand" style={{ width: value }} />
            </div>
          ))}
        </Card>
      </Section>

      <Section title="Applied conventions" description="How the scale maps to real UI (from the product screenshots).">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['Card padding', '24px', <Code key="a">spacing.6</Code>],
            ['Gap between cards', '20–24px', <Code key="b">spacing.5–6</Code>],
            ['Form field gap', '16px', <Code key="c">spacing.4</Code>],
            ['Inline icon ↔ text', '8px', <Code key="d">spacing.2</Code>],
            ['Table cell padding', '12–16px', <Code key="e">spacing.3–4</Code>],
            ['Section rhythm', '32–48px', <Code key="f">spacing.8–12</Code>],
          ].map(([label, val, token]) => (
            <Card key={label as string} className="flex items-center justify-between p-4">
              <div>
                <div className="text-body-sm font-medium text-text-primary">{label}</div>
                <div className="text-caption text-text-tertiary">{val}</div>
              </div>
              {token}
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}
