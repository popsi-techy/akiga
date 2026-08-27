'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { AppIcon, resolveAppIcon } from '@ds/components';

const KNOWN = [
  'Google Workspace',
  'Adobe',
  'Salesforce',
  'AWS',
  'Microsoft Entra ID',
  'Active Directory',
  'Okta',
  'GitHub Enterprise',
  'Slack',
  'ServiceNow',
  'CyberArk',
  'HashiCorp Vault',
  'SAP S/4HANA Finance',
  'Workday',
  'Jira',
  'Snowflake',
];
const UNKNOWN = ['Custom Application', 'SCIM Application'];

export default function AppIconDocs() {
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="App Icon"
        description="A compact application mark. Renders the vendor’s current logo when the app name matches a known domain, and falls back to a first-letter tile when it does not — so a list of applications is scannable without every app needing a bundled asset."
      />

      <Section
        title="Catalogued apps get their live logo"
        description="Logos are fetched from the web at render time (the vendor’s current site icon). Matching is by name pattern, so “SAP S/4HANA Finance” and “SAP” both resolve to the same mark."
      >
        <Example label="Matched">
          {KNOWN.map((app) => (
            <span key={app} className="inline-flex items-center gap-2">
              <AppIcon app={app} size={32} />
              <span className="text-body-sm text-text-secondary">{app}</span>
            </span>
          ))}
        </Example>
        <Example label="Uncatalogued — first letter, same tile, same footprint">
          {UNKNOWN.map((app) => (
            <span key={app} className="inline-flex items-center gap-2">
              <AppIcon app={app} size={32} />
              <span className="text-body-sm text-text-secondary">{app}</span>
            </span>
          ))}
        </Example>
        <Example label="Custom instance name, catalogued type">
          <span className="inline-flex items-center gap-2">
            <AppIcon app="Northwind ERP" logoFrom="SAP" size={32} />
            <span className="text-body-sm text-text-secondary">Northwind ERP</span>
            <span className="text-caption text-text-tertiary">logoFrom=SAP</span>
          </span>
        </Example>
      </Section>

      <Section
        title="Size and variant"
        description="variant sets the tile fill: subtle on a canvas or surface, surface when the icon sits inside an already-tinted chip so it does not disappear into it."
      >
        <Example label="Sizes">
          {[20, 24, 28, 32, 40].map((s) => (
            <span key={s} className="inline-flex flex-col items-center gap-1">
              <AppIcon app="Salesforce" size={s} />
              <span className="text-caption text-text-tertiary">{s}px</span>
            </span>
          ))}
        </Example>
        <Example label="variant=surface, on a tinted background">
          <span className="inline-flex items-center gap-2 rounded-pill bg-subtle px-2 py-1">
            <AppIcon app="AWS" size={20} variant="surface" />
            <span className="text-caption text-text-secondary">AWS</span>
          </span>
        </Example>
      </Section>

      <Section
        title="Ask before you render"
        description="resolveAppIcon returns the catalog entry or null, so a caller can branch — showing a logo-led layout only when a logo actually exists, instead of discovering it after render."
      >
        <PropsTable
          rows={[
            { name: 'app', type: 'string', description: 'Application display name. Matched against the catalog by pattern. Used for the tooltip and the letter fallback.' },
            { name: 'logoFrom', type: 'string', description: 'Optional extra catalog key, tried before `app`. Pass the app type when the instance name is custom.' },
            { name: 'size', type: 'number', default: '24', description: 'Tile edge in px. The mark is drawn at 72% of it.' },
            { name: 'variant', type: "'subtle' | 'surface'", default: "'subtle'", description: 'Tile fill — subtle on canvas, surface inside tinted chips.' },
          ]}
        />
        <p className="mt-3 text-body-sm text-text-secondary">
          Currently catalogued: {KNOWN.filter((a) => resolveAppIcon(a)).length} patterns. Generic types (Custom, SCIM) stay letter-only.
        </p>
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Pass the application’s real display name; the component does the matching.',
            'When the instance name is custom, pass logoFrom with the app type so the vendor mark still resolves.',
            'Use variant="surface" when the icon sits on a tinted chip or row.',
            'Keep one size per list so rows align.',
            'Treat the letter fallback as a first-class state — unknown apps will use it.',
          ]}
          donts={[
            'Don’t bundle a logo file for a catalogued vendor — the live fetch is the source.',
            'Don’t use it as a person’s avatar — that is Avatar.',
            'Don’t scale it past 40px; it is a mark, not a hero image.',
            'Don’t hand-build a letter tile beside it; the fallback already is one.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { AppIcon, resolveAppIcon } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
