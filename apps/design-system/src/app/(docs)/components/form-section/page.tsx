'use client';

import * as React from 'react';
import LoginOutlined from '@mui/icons-material/LoginOutlined';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import LinkOutlined from '@mui/icons-material/LinkOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import { PageHeader, Section, Example, PropsTable, DoDont } from '@/components/docs/primitives';
import { FormSection, Input, Select } from '@ds/components';

export default function FormSectionDocs() {
  const [grant, setGrant] = React.useState('authorization_code');

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Form Section"
        description="A named group of fields inside a Drawer or Modal. An outlined icon plus an h5 heading and a hairline do the grouping — not a card, not a grey well. SettingsSection is the page equivalent; it saves itself. This one does not."
      />

      <Section
        title="Groups in a long form"
        description="Four jobs, four headings. Tight inside each group, a hairline between them. The drawer title stays the only larger heading."
      >
        <Example label="authorization request, drawer width">
          <div className="max-w-[502px]">
            <FormSection title="Authorization flow" icon={<LoginOutlined sx={{ fontSize: 18 }} />}>
              <Select
                label="Grant type"
                options={[
                  { value: 'authorization_code', label: 'Authorization Code' },
                  { value: 'client_credentials', label: 'Client Credentials' },
                ]}
                value={grant}
                onChange={setGrant}
              />
              <Input
                label="Redirect URL"
                value="https://iga.example.com/api/provisioning/app/demo/callback"
                InputProps={{ readOnly: true }}
              />
            </FormSection>
            <FormSection title="Client credentials" icon={<VpnKeyOutlined sx={{ fontSize: 18 }} />} divided>
              <Input label="Client ID" required placeholder="Client ID" />
              <Input label="Client secret" required type="password" placeholder="Client secret" />
            </FormSection>
            <FormSection title="Endpoints" icon={<LinkOutlined sx={{ fontSize: 18 }} />} divided>
              <Input label="Authorization endpoint" required placeholder="https://provider.com/oauth/authorize" />
              <Input label="Token endpoint" required placeholder="https://provider.com/oauth/token" />
              <Input
                label="User information endpoint"
                hint="OIDC userinfo. Leave blank if the provider does not publish one."
                placeholder="https://provider.com/oauth/userinfo"
              />
            </FormSection>
            <FormSection
              title="Authentication configuration"
              icon={<TuneOutlined sx={{ fontSize: 18 }} />}
              divided
            >
              <Select
                label="Send client credentials in"
                options={[
                  { value: 'body', label: 'Request body' },
                  { value: 'header', label: 'Authorization header' },
                ]}
                value="body"
                onChange={() => undefined}
              />
              <Input label="Scope" required placeholder="users:read groups:write" />
            </FormSection>
          </div>
        </Example>
      </Section>

      <Section title="When to use">
        <DoDont
          dos={[
            'Long create/edit forms in a Drawer or Modal that have more than one job (credentials, then URLs, then how the request is shaped).',
            'Pass divided on every section after the first so the hairline is the only chrome.',
            'Pass an outlined 18px icon that names the job. The heading text is enough — no caption under it.',
          ]}
          donts={[
            'Tenant-admin settings pages — those are SettingsSection, and they save themselves.',
            'Wrap a group in a Card or a grey well. The heading and the hairline are the group.',
            'Put a description under the title. Field hints carry the why.',
            'Use it for a single field. A lone Input does not need a heading.',
            'Use it as a method switcher that replaces the form — that is ModeBar in Drawer.subheader.',
          ]}
        />
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'title', type: 'string', description: 'The group name. Rendered as an h3 in h5.' },
            {
              name: 'icon',
              type: 'ReactNode',
              description: 'Outlined MUI icon at 18px, uncoloured. Decorative — the title is the name.',
            },
            { name: 'id', type: 'string', description: 'Stable heading id. Generated when omitted.' },
            {
              name: 'divided',
              type: 'boolean',
              default: 'false',
              description: 'Hairline above this section. Pass on every section after the first.',
            },
          ]}
        />
      </Section>
    </>
  );
}
