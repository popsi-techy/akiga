import { PageHeader, Section, Card, TokenTable, Code } from '@/components/docs/primitives';
import { typography } from '@ds/tokens/tokens';

/** The full scale, in the order you'd reach for it, with a realistic sample. */
const scale: [string, string][] = [
  ['display', 'Govern access across the organization'],
  ['h1', 'Reserved — currently unused'],
  ['h2', 'SoD Policy Violations'],
  ['h3', 'Liam Turner'],
  ['h4', 'Access request details'],
  ['h5', 'Violated Access Combinations'],
  ['cardTitle', 'Violated by'],
  ['bodyLg', 'Track and manage your applications from one central table.'],
  ['body', 'Track and manage your applications from one central table.'],
  ['bodyMedium', 'Freshdesk Read Access'],
  ['bodyStrong', 'Freshdesk Read Access'],
  ['bodySm', 'SDE 1 · WordPress — last active 2 hours ago'],
  ['bodySmMedium', 'Data Scientist'],
  ['bodySmStrong', 'Data Scientist'],
  ['caption', 'Rows per page · 1–10 of 10'],
  ['captionMedium', '3 pending'],
  ['captionStrong', '3 pending'],
  ['overline', 'User access that will be revoked'],
  ['micro', 'LT'],
  ['stat', '3,413'],
];

/** "I am styling ___" → the token. This is the table to read first. */
const chooseByJob: [string, string, string][] = [
  ['Page title — list, landing', 'h2', '24 / 700'],
  ['Page title — object detail', 'h3', '20 / 600'],
  ['Page title — canvas (builder, workspace)', 'h5', '16 / 600'],
  ['Lead sentence under a page title', 'body', '14 / 400'],
  ['Section heading inside a page', 'h5', '16 / 600'],
  ['Card heading in a rail', 'cardTitle', '15 / 400'],
  ['Group label above a list ("USER ACCESS…")', 'overline', '12 / 600, upper'],
  ['Prose, descriptions, tab labels', 'body', '14 / 400'],
  ['A row’s primary line (name, title)', 'bodyStrong', '14 / 600'],
  ['A table cell’s primary line', 'bodySmStrong', '13 / 600'],
  ['A row’s secondary line (email, meta)', 'caption', '12 / 400'],
  ['Field label in a detail card', 'bodySm', '13 / 400'],
  ['Field value in a detail card', 'bodySmStrong', '13 / 600'],
  ['Chip and badge labels', 'captionStrong', '12 / 600'],
  ['Counts, timestamps, pagination', 'caption', '12 / 400'],
  ['Avatar initials, tiny badges', 'micro', '10 / 600'],
  ['A KPI numeral', 'stat', '24 / 700'],
];

const weights: [string, number, string][] = [
  ['Regular', 400, 'Everything that is not emphasised. The default.'],
  ['Medium', 500, 'The soft step. Reads at 15px and up; at 12–14px it barely registers, so prefer Strong for dense rows.'],
  ['Strong', 600, 'The firm step. The default choice for emphasis in dense UI, and what every heading uses.'],
];

export default function TypographyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Foundations"
        title="Typography"
        description="One typeface — DM Sans — across the entire product, on a compact scale with a 14px base built for dense data screens."
      />

      <Section
        title="How this works"
        description="Read this once and the rest of the page is a lookup table."
      >
        <Card className="space-y-3 p-5 text-body text-text-secondary">
          <p>
            <span className="text-body-strong text-text-primary">A token is a complete type style.</span>{' '}
            Size, line height, letter-spacing <em>and weight</em> all come from it. So{' '}
            <Code>text-h5</Code> is already 16px semibold — you never add a weight to it.
          </p>
          <p>
            <span className="text-body-strong text-text-primary">You pick by job, not by size.</span>{' '}
            Don’t ask “what size should this be?” — ask “what <em>is</em> this?”. A table cell’s name is{' '}
            <Code>bodySmStrong</Code> because that is what a table cell’s name is, everywhere in the product.
          </p>
          <p>
            <span className="text-body-strong text-text-primary">To emphasise, change the token.</span>{' '}
            Each body size has three: <Code>body</Code> → <Code>bodyMedium</Code> → <Code>bodyStrong</Code>{' '}
            (400 → 500 → 600). Switch tokens; never bolt a weight class onto a size class.{' '}
            <Code>npm run check:type</Code> fails the build if you do.
          </p>
        </Card>
      </Section>

      <Section
        title="Pick by job"
        description="What you are styling, and the token that answers it. If your case isn’t here, it is probably one of these in disguise."
      >
        <TokenTable
          head={['I am styling…', 'Token', 'Size / weight']}
          rows={chooseByJob.map(([job, token, spec]) => [
            job,
            <Code key={token + job}>{token}</Code>,
            <span key={spec} className="font-mono text-caption text-text-tertiary">{spec}</span>,
          ])}
        />
      </Section>

      <Section
        title="The three weights"
        description="Same size, three steps. The gap between 400 and 500 is deliberately small — that is why Strong, not Medium, is the default for emphasis in tables and rows."
      >
        {/* The three body tokens, used as classes so you can see the real rendered
            difference at 14px — which is smaller than the 20px demo above it. */}
        <Card className="mb-3 flex flex-wrap items-baseline gap-x-6 gap-y-2 p-4">
          <span className="text-body text-text-primary">body — Freshdesk Read Access</span>
          <span className="text-body-medium text-text-primary">bodyMedium — Freshdesk Read Access</span>
          <span className="text-body-strong text-text-primary">bodyStrong — Freshdesk Read Access</span>
        </Card>
        <div className="grid gap-3 sm:grid-cols-3">
          {weights.map(([name, w, when]) => (
            <Card key={name} className="p-4">
              <div className="text-h3 text-text-primary" style={{ fontWeight: w }}>
                Read Access
              </div>
              <div className="mt-2 text-body-strong text-text-primary">
                {name} · {w}
              </div>
              <p className="mt-1 text-body-sm text-text-secondary">{when}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title="The full scale"
        description="Every token, rendered at its own style. The value on the right is size / line-height · weight."
      >
        <Card className="divide-y divide-border">
          {scale.map(([key, sample]) => {
            const t = typography[key as keyof typeof typography] as React.CSSProperties & {
              textTransform?: string;
            };
            return (
              <div key={key} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-baseline">
                <div className="w-36 shrink-0 font-mono text-caption text-text-secondary">{key}</div>
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

      <Section title="Rules">
        <Card className="space-y-2 p-5 text-body text-text-secondary">
          <p>
            <span className="text-body-strong text-text-primary">Never invent a size.</span> If a design
            needs 15px it is <Code>cardTitle</Code>; if it needs something else, add a token and say why.
          </p>
          <p>
            <span className="text-body-strong text-text-primary">Two steps apart, or a weight change.</span>{' '}
            <Code>body</Code> above <Code>bodySm</Code> at the same weight is not a hierarchy. A row is{' '}
            <Code>bodyStrong</Code> over <Code>caption</Code>.
          </p>
          <p>
            <span className="text-body-strong text-text-primary">Three levels per region, maximum.</span> A
            card with a title, body, label, value, caption and chip has no hierarchy left to give.
          </p>
          <p>
            <span className="text-body-strong text-text-primary">Two weight utilities exist</span> —{' '}
            <Code>font-emphasis</Code> (600) for text whose size is inherited or set dynamically, and{' '}
            <Code>font-normal</Code> (400) to soften a run inside a stronger parent. Nothing else.
          </p>
        </Card>
      </Section>
    </>
  );
}
