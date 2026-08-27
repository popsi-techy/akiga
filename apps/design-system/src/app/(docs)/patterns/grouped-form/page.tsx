import Link from 'next/link';
import { PageHeader, Section, DoDont } from '@/components/docs/primitives';

export default function GroupedFormPattern() {
  return (
    <>
      <PageHeader
        eyebrow="Patterns"
        title="Grouped form"
        description="How a long create/edit form in a Drawer or Modal is split into jobs. Add authorization is the reference. The next connector form assembles from the same primitive so the headings cannot drift."
      />

      <Section
        title="Anatomy"
        description="The overlay title names the object. Groups name the jobs. Fields stay inside a group."
      >
        <ol className="list-decimal space-y-2 pl-5 text-body text-text-secondary">
          <li>
            <span className="text-body-medium text-text-primary">Drawer or Modal</span> — one
            title, one footer Save. The body scrolls (<code className="text-caption">ds-scroll</code>
            ).
          </li>
          <li>
            Method or type switcher first, if the form replaces itself (Basic vs
            OAuth). That is a{' '}
            <span className="text-body-medium text-text-primary">ModeBar</span> in{' '}
            <code className="text-caption">Drawer.subheader</code> — chrome, not a
            field group, so it cannot scroll away.
          </li>
          <li>
            Tabs only when the same job has two times (request vs response). Pin
            them in <code className="text-caption">Drawer.toolbar</code> so they
            stay under the ModeBar while the groups scroll. Not inside a FormSection.
          </li>
          <li>
            One <span className="text-body-medium text-text-primary">FormSection</span> per job
            — outlined icon plus the title, no caption. Pass{' '}
            <code className="text-caption">divided</code> on every section after the first.
          </li>
          <li>
            Hide fields the current choice does not use (Redirect URL on Client Credentials) —
            do not disable them in place.
          </li>
        </ol>
        <p className="mt-4 text-body-sm text-text-secondary">
          Live building blocks:{' '}
          <Link href="/components/mode-bar" className="text-text-brand hover:underline">
            Mode Bar
          </Link>
          {' · '}
          <Link href="/components/form-section" className="text-text-brand hover:underline">
            Form Section
          </Link>
          . Decisions in{' '}
          <code className="text-caption">docs/architecture/decisions/0013-form-section-in-overlays.md</code>
          {' '}and{' '}
          <code className="text-caption">docs/architecture/decisions/0014-mode-bar-in-drawer-subheader.md</code>.
        </p>
      </Section>

      <Section title="When to use">
        <DoDont
          dos={[
            'Create/edit drawers whose fields fall into more than one job (flow, credentials, endpoints, request shape).',
            'One field, one group. Scope is a request parameter — it belongs with how the token request is shaped, not with the URLs.',
          ]}
          donts={[
            'System Settings pages — those are Settings page (ADR-0012).',
            'A second Grant type or a second Scope. If two groups want the same field, the grouping is wrong, not the field.',
            'A Card or grey well around a group.',
            'A FormSection of radios as the method switcher — that is ModeBar in the Drawer subheader.',
          ]}
        />
      </Section>
    </>
  );
}
