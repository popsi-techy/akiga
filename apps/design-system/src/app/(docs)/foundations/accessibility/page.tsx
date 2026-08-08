import { PageHeader, Section, Card, Code } from '@/components/docs/primitives';

export default function AccessibilityPage() {
  return (
    <>
      <PageHeader
        eyebrow="Foundations"
        title="Accessibility"
        description="WCAG 2.1 AA is the floor, not a goal. Governance tools are used by everyone; an inaccessible screen is a broken screen. Accessibility is part of every component's definition of done."
      />

      <Section title="Non-negotiables">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['Color contrast', 'Text meets AA (4.5:1 body, 3:1 large). Never encode meaning in color alone — pair with icon, text, or shape (e.g. status chips have a dot + label).'],
            ['Keyboard', 'Everything operable without a mouse. Logical tab order, no traps, visible focus.'],
            ['Focus', 'A consistent brand focus ring (2px, offset) on every interactive element via :focus-visible.'],
            ['Semantics', 'Correct roles/landmarks; MUI components provide ARIA — don’t break it with div soup.'],
            ['Forms', 'Every field has a visible label; errors are announced and tied to the field.'],
            ['Motion', 'Respect prefers-reduced-motion; disable non-essential animation.'],
          ].map(([t, d]) => (
            <Card key={t} className="p-4">
              <div className="text-body-strong text-text-primary">{t}</div>
              <p className="mt-1 text-body-sm leading-5 text-text-secondary">{d}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Focus ring demo" description="Tab to the buttons below to see the standard ring.">
        <div className="flex flex-wrap gap-3">
          <button className="rounded-md bg-brand px-4 py-2 text-body-sm-strong text-brand-on">
            Primary action
          </button>
          <button className="rounded-md border border-border bg-surface px-4 py-2 text-body-sm-strong text-text-primary">
            Secondary action
          </button>
          <a href="#" className="rounded-md px-2 py-2 text-body-sm-strong text-text-link">
            A link
          </a>
        </div>
      </Section>

      <Section title="How it's enforced">
        <Card className="p-5 text-body-sm leading-6 text-text-secondary">
          Contrast is <span className="font-emphasis text-text-primary">verified mechanically</span>,
          not by eye: <Code>npm run check:contrast</Code> validates every semantic token pairing
          (text on backgrounds, status <Code>fg</Code> on <Code>subtle</Code>, <Code>onSolid</Code>{' '}
          on <Code>solid</Code>, risk badges, focus ring) against WCAG — text at AA (4.5:1),
          graphical/UI at 3:1 — and exits non-zero on any failure. A new color token must be added
          to the check, and a token that fails AA for its use is a defect. This exists because
          "AA is the floor" as prose once wasn't enough — a low-contrast token shipped unnoticed.
          Now it can't. Components also ship correct ARIA and keyboard support as part of their
          definition of done.
        </Card>
      </Section>
    </>
  );
}
