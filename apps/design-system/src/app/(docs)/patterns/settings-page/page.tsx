import Link from 'next/link';
import { PageHeader, Section, DoDont } from '@/components/docs/primitives';

export default function SettingsPagePattern() {
  return (
    <>
      <PageHeader
        eyebrow="Patterns"
        title="Settings page"
        description="How a tenant-admin configuration screen is built. MFA Settings is the reference implementation. New System Settings pages assemble from the same primitives so they cannot drift."
      />

      <Section
        title="Anatomy"
        description="Top-down: page column (name is the breadcrumb), then sections that save themselves, then wells."
      >
        <ol className="list-decimal space-y-2 pl-5 text-body text-text-secondary">
          <li>
            <span className="text-body-medium text-text-primary">SettingsPage</span> — 900px
            max, full width below that. The page name is the breadcrumb, not a second h1.
          </li>
          <li>
            <span className="text-body-medium text-text-primary">SettingsSection</span> — h2,
            optional Reset icon, extra-small Save. Pass <code className="text-caption">divided</code> on
            every section after the first.
          </li>
          <li>
            <span className="text-body-medium text-text-primary">SettingsStack</span> of{' '}
            <span className="text-body-medium text-text-primary">SettingsRow surface=&quot;subtle&quot;</span>{' '}
            for settings that belong to one configuration.
          </li>
          <li>
            Standalone subtle rows in a grid when the wells are peers (roles), not a stack.
          </li>
          <li>
            <span className="text-body-medium text-text-primary">SettingsInfoBanner</span> under
            the section when a rule is always on.
          </li>
          <li>
            A chosen set on a grey well uses{' '}
            <span className="text-body-medium text-text-primary">OverflowChips tone=&quot;onSubtle&quot;</span>
            , then a bare pencil if it is editable.
          </li>
          <li>
            When a control reveals a dependent field — or when a well is a heading
            with no control —{' '}
            <span className="text-body-medium text-text-primary">SettingsNested</span> opens
            inside that grey well. Put{' '}
            <span className="text-body-medium text-text-primary">SettingsNestedRow</span>{' '}
            inside it (one field, or several). The panel is white, not a second well.
          </li>
        </ol>
        <p className="mt-4 text-body-sm text-text-secondary">
          Live building blocks:{' '}
          <Link href="/components/settings" className="text-text-brand hover:underline">
            Settings
          </Link>
          . Decision:{' '}
          <Link href="/components/settings" className="text-text-brand hover:underline">
            ADR-0012
          </Link>{' '}
          in <code className="text-caption">docs/architecture/decisions/0012-settings-page-anatomy.md</code>.
        </p>
      </Section>

      <Section title="When to use">
        <DoDont
          dos={[
            'New System Settings detail pages (anything that would otherwise copy MFA).',
            'Section-scoped Save so one dirty group does not enable another section’s Save.',
          ]}
          donts={[
            'A catalog of records (Custom Attributes, User Identity Correlation, Entitlement Types) — those use DirectoryListPage and a Drawer.',
            'Entity detail rails — those are InfoRow.',
          ]}
        />
      </Section>
    </>
  );
}
