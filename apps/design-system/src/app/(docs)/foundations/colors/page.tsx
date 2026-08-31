import { PageHeader, Section, Swatch, Ramp, Code, Card } from '@/components/docs/primitives';
import { palette } from '@ds/tokens/palette';
import { color } from '@ds/tokens/tokens';

export default function ColorsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Foundations"
        title="Colors"
        description="Two layers: brand-derived PRIMITIVE palettes (raw values) and SEMANTIC tokens (roles). Components consume only semantic tokens — never raw palette values or hex literals."
      />

      {/* Semantic — the layer components use */}
      <Section
        title="Semantic tokens"
        description="Roles mapped from primitives. This is what you use in code."
      >
        <div className="mb-6">
          <h3 className="mb-3 text-body-strong text-text-primary">Text</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            <Swatch value={color.text.primary} name="text.primary" ring />
            <Swatch value={color.text.secondary} name="text.secondary" ring />
            <Swatch value={color.text.tertiary} name="text.tertiary" ring />
            <Swatch value={color.text.disabled} name="text.disabled" ring />
            <Swatch value={color.text.link} name="text.link" ring />
            <Swatch value={color.text.brand} name="text.brand" ring />
          </div>
        </div>

        <div className="mb-6">
          <h3 className="mb-3 text-body-strong text-text-primary">Surface, background & border</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            <Swatch value={color.background.canvas} name="background.canvas" ring />
            <Swatch value={color.background.subtle} name="background.subtle" ring />
            <Swatch value={color.background.sidebar} name="background.sidebar" />
            <Swatch value={color.surface.hover} name="surface.hover" ring />
            <Swatch value={color.surface.selected} name="surface.selected" ring />
            <Swatch value={color.surface.selectedHover} name="surface.selectedHover" ring />
            <Swatch value={color.border.default} name="border.default" ring />
            <Swatch value={color.border.strong} name="border.strong" ring />
          </div>
        </div>

        <div className="mb-6">
          <h3 className="mb-3 text-body-strong text-text-primary">Brand</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            <Swatch value={color.brand.primary} name="brand.primary" sub="Orange 700" />
            <Swatch value={color.brand.primaryHover} name="brand.primaryHover" />
            <Swatch value={color.brand.primaryActive} name="brand.primaryActive" />
            <Swatch value={color.brand.subtle} name="brand.subtle" ring />
            <Swatch value={color.brand.subtleHover} name="brand.subtleHover" ring />
            <Swatch value={color.brand.border} name="brand.border" ring />
          </div>
        </div>
      </Section>

      {/* Status */}
      <Section
        title="Status & risk"
        description="Every status, severity, and risk-score chip maps onto these five roles — one mapping, product-wide (risk tiers: Critical→danger, High→warning, Medium→info, Low→neutral)."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(['info', 'success', 'warning', 'danger', 'neutral'] as const).map((k) => {
            const s = color.status[k];
            return (
              <Card key={k} className="overflow-hidden">
                <div className="flex h-14 items-center justify-center" style={{ background: s.solid }}>
                  <span className="text-body-sm-strong" style={{ color: s.onSolid }}>
                    {k}
                  </span>
                </div>
                <div className="p-3">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-caption-medium"
                    style={{ background: s.subtle, color: s.fg, border: `1px solid ${s.border}` }}
                  >
                    <span className="h-1.5 w-1.5 rounded-pill" style={{ background: s.solid }} />
                    {k}
                  </span>
                  <div className="mt-2 font-mono text-caption text-text-secondary">status.{k}</div>
                </div>
              </Card>
            );
          })}
        </div>

      </Section>

      {/* Primitives */}
      <Section
        title="Primitive palettes"
        description="Raw brand values. Reference only — never consume directly in components."
      >
        <Ramp name="Orange (brand)" ramp={palette.orange} />
        <Ramp name="Ink (text & slate)" ramp={palette.ink} />
        <Ramp name="Neutral (surfaces & borders)" ramp={palette.neutral} />
        <Ramp name="Blue (info / link)" ramp={palette.blue} />
        <Ramp name="Green (success)" ramp={palette.green} />
        <Ramp name="Red (danger)" ramp={palette.red} />
        <Ramp name="Yellow (warning)" ramp={palette.yellow} />
      </Section>

      <Section title="Usage">
        <Card className="p-5 text-body-sm leading-6 text-text-secondary">
          <p>
            In components, reach for semantic tokens: <Code>color.text.primary</Code>,{' '}
            <Code>color.brand.primary</Code>, <Code>color.status.success.fg</Code>. In markup you
            can use the Tailwind aliases: <Code>text-text-primary</Code>, <Code>bg-brand</Code>,{' '}
            <Code>border-border</Code>. Never write a hex literal.
          </p>
        </Card>
        <Card className="mt-3 p-5 text-body-sm leading-6 text-text-secondary">
          <p className="mb-1 font-emphasis text-text-primary">Contrast is enforced, not assumed</p>
          <p>
            Every pairing is validated by <Code>npm run check:contrast</Code> against WCAG (text AA
            4.5:1, graphical 3:1). One documented exception: <strong>brand orange (#EB5424) with
            white</strong> is 3.60:1 — compliant only as <em>large text</em>. Use brand-orange +
            white on the primary CTA and at <Code>&ge;24px</Code> (or <Code>&ge;18.66px</Code>{' '}
            bold); for smaller brand-colored text use a darker orange. See ADR-0005.
          </p>
        </Card>
      </Section>
    </>
  );
}
