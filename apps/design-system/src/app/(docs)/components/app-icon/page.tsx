'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { AppIcon, resolveAppIcon } from '@ds/components';

const KNOWN = ['SAP S/4HANA Finance', 'Salesforce', 'AWS', 'Google Workspace', 'GitHub Enterprise', 'Slack', 'Okta', 'Jira', 'Snowflake', 'HashiCorp Vault'];
const UNKNOWN = ['Workday', 'ServiceNow', 'NetSuite', 'Active Directory', 'CyberArk'];

export default function AppIconDocs() {
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="App Icon"
        description="A compact application mark. Renders a real brand logo when the app name matches the catalog, and falls back to a first-letter tile when it does not — so a list of applications is scannable without every app needing an asset."
      />

      <Section
        title="Catalogued apps get their logo"
        description="Logos come from Simple Icons (CC0). Matching is by name pattern, so “SAP S/4HANA Finance” and “SAP” both resolve to the same mark."
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
            { name: 'app', type: 'string', description: 'Application display name. Matched against the catalog by pattern.' },
            { name: 'size', type: 'number', default: '24', description: 'Tile edge in px. The mark is drawn at 58% of it.' },
            { name: 'variant', type: "'subtle' | 'surface'", default: "'subtle'", description: 'Tile fill — subtle on canvas, surface inside tinted chips.' },
          ]}
        />
        <p className="mt-3 text-body-sm text-text-secondary">
          Currently catalogued: {KNOWN.filter((a) => resolveAppIcon(a)).length} patterns — SAP, Salesforce, AWS, Google, GitHub, Slack, Okta, Jira, Snowflake, HashiCorp.
          Everything else is letter-only until a mark is added.
        </p>
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Pass the application’s real display name; the component does the matching.',
            'Use variant="surface" when the icon sits on a tinted chip or row.',
            'Keep one size per list so rows align.',
            'Treat the letter fallback as a first-class state — most apps will use it.',
          ]}
          donts={[
            'Don’t add a brand logo that is not CC0-licensed to the catalog.',
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
