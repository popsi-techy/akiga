import { PageHeader, Section, Card, TokenTable, Code } from '@/components/docs/primitives';
import { typography, fontWeight } from '@ds/tokens/tokens';

const scale: [string, string][] = [
  ['display', 'Govern access across the organization'],
  ['h1', 'Emergency Access'],
  ['h2', 'Certifications approaching deadline'],
  ['h3', 'Recent sessions'],
  ['h4', 'Access request details'],
  ['h5', 'Owners'],
  ['bodyLg', 'Track and manage your applications from one central table.'],
  ['body', 'Track and manage your applications from one central table.'],
  ['bodySm', 'SDE 1 · WordPress — last active 2 hours ago'],
  ['caption', 'Rows per page · 1–10 of 10'],
  ['overline', 'Risk score'],
];

export default function TypographyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Foundations"
        title="Typography"
        description="One typeface — DM Sans — across the entire product. A tight, purposeful scale with a 14px base optimized for dense enterprise data screens."
      />

      <Section title="Type scale" description="Each style is a token. Use the token, not raw sizes.">
        <Card className="divide-y divide-border">
          {scale.map(([key, sample]) => {
            const t = typography[key as keyof typeof typography] as React.CSSProperties & {
              textTransform?: string;
            };
            return (
              <div key={key} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-baseline">
                <div className="w-28 shrink-0 font-mono text-caption text-text-secondary">{key}</div>
                <div className="flex-1 text-text-primary" style={t}>
                  {sample}
                </div>
                <div className="shrink-0 font-mono text-caption text-text-tertiary">
                  {t.fontSize} / {t.lineHeight} · {t.fontWeight}
                </div>
              </div>
            );
          })}
        </Card>
      </Section>

      <Section title="Weights" description="DM Sans variable — four weights in use.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(fontWeight).map(([name, w]) => (
            <Card key={name} className="p-4">
              <div className="text-stat text-text-primary" style={{ fontWeight: w }}>
                Aa
              </div>
              <div className="mt-1 text-body-sm font-medium capitalize text-text-primary">{name}</div>
              <div className="font-mono text-caption text-text-tertiary">{w}</div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Reference">
        <TokenTable
          head={['Token', 'Size', 'Line height', 'Weight', 'Use']}
          rows={[
            [<Code key="1">display</Code>, '32px', '40px', '700', 'Hero / welcome headings'],
            [<Code key="2">h1</Code>, '28px', '36px', '700', 'Page titles'],
            [<Code key="3">h2</Code>, '24px', '32px', '700', 'Section titles'],
            [<Code key="4">h3</Code>, '20px', '28px', '600', 'Card titles'],
            [<Code key="5">h4/h5</Code>, '18/16px', '26/24px', '600', 'Sub-headings'],
            [<Code key="6">body</Code>, '14px', '20px', '400', 'Default body (base)'],
            [<Code key="7">bodySm</Code>, '13px', '18px', '400', 'Secondary / meta'],
            [<Code key="8">caption</Code>, '12px', '16px', '400', 'Captions, pagination'],
            [<Code key="9">overline</Code>, '12px', '16px', '600', 'Labels (uppercase)'],
          ]}
        />
      </Section>
    </>
  );
}
