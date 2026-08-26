'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont } from '@/components/docs/primitives';
import {
  Input,
  OverflowChips,
  Select,
  SettingsInfoBanner,
  SettingsNested,
  SettingsNestedRow,
  SettingsPage,
  SettingsRow,
  SettingsSection,
  SettingsStack,
  Switch,
} from '@ds/components';

const METHODS = [
  { id: 'email', name: 'Email OTP' },
  { id: 'auth', name: 'Authenticator' },
  { id: 'sms', name: 'SMS OTP' },
];

export default function SettingsDocs() {
  const [on, setOn] = React.useState(false);
  const [role, setRole] = React.useState(false);
  const [periodic, setPeriodic] = React.useState(true);
  const [frequency, setFrequency] = React.useState('monthly');

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Settings"
        description="The tenant-admin settings column: a 900px page, a section that saves itself, and grey wells that stack as one block. The page name lives in the breadcrumb. Assemble a new System Settings screen from these — do not wrap a grey well in a Card."
      />

      <Section
        title="A settings screen"
        description="SettingsPage is the 900px column. SettingsSection is the first visible heading, plus Reset and extra-small Save. SettingsStack joins wells into one configuration."
      >
        <Example label="page + stacked wells + a grid of standalone wells">
          <SettingsPage
            title="Example settings"
            description="A page title, then sections that save independently."
          >
            <SettingsSection title="Configuration" onReset={() => undefined} onSave={() => undefined} saveDisabled>
              <SettingsStack>
                <SettingsRow
                  surface="subtle"
                  title="Enforce for all users"
                  description="Require every user to complete this check when logging in."
                >
                  <Switch
                    checked={on}
                    onChange={(_, checked) => setOn(checked)}
                    inputProps={{ 'aria-label': 'Enforce for all users' }}
                  />
                </SettingsRow>
                <SettingsRow
                  surface="subtle"
                  title="Allowed methods"
                  description="Select which methods are available."
                >
                  <OverflowChips items={METHODS} max={1} tone="onSubtle" />
                </SettingsRow>
              </SettingsStack>
            </SettingsSection>
            <SettingsSection title="By role" divided onSave={() => undefined} saveDisabled>
              <div className="grid gap-3 md:grid-cols-2">
                <SettingsRow surface="subtle" title="End User">
                  <Switch
                    checked={role}
                    onChange={(_, checked) => setRole(checked)}
                    inputProps={{ 'aria-label': 'Enable for End User' }}
                  />
                </SettingsRow>
                <SettingsRow surface="subtle" title="Reviewer">
                  <Switch
                    checked={false}
                    inputProps={{ 'aria-label': 'Enable for Reviewer' }}
                  />
                </SettingsRow>
              </div>
              <div className="mt-4">
                <SettingsInfoBanner>
                  Administrators always have this check on.
                </SettingsInfoBanner>
              </div>
            </SettingsSection>
          </SettingsPage>
        </Example>
      </Section>

      <Section
        title="Dependent nested field"
        description="When a switch or choice requires another field, open a white SettingsNested inside that grey well. A well with no control uses the same panel for a group of fields. It is not a second well in the stack and not a Card."
      >
        <Example label="grey well reveals a white frequency panel">
          <SettingsStack>
            <SettingsRow
              surface="subtle"
              title="Enable periodic mining"
              description="Run discovery on a schedule."
              nested={
                periodic ? (
                  <SettingsNested>
                    <SettingsNestedRow title="Frequency" description="How often this job runs.">
                      <div className="w-[220px]">
                        <Select
                          size="sm"
                          fullWidth
                          ariaLabel="Frequency"
                          options={[
                            { value: 'weekly', label: 'Weekly' },
                            { value: 'monthly', label: 'Monthly' },
                            { value: 'quarterly', label: 'Quarterly' },
                          ]}
                          value={frequency}
                          onChange={setFrequency}
                        />
                      </div>
                    </SettingsNestedRow>
                  </SettingsNested>
                ) : null
              }
            >
              <Switch
                checked={periodic}
                onChange={(_, checked) => setPeriodic(checked)}
                inputProps={{ 'aria-label': 'Enable periodic mining' }}
              />
            </SettingsRow>
            <SettingsRow
              surface="subtle"
              title="Role Criteria"
              description="Higher values produce fewer, higher-quality roles."
              nested={
                <SettingsNested>
                  <SettingsNestedRow
                    title="Min. Coverage (%)"
                    description="How consistently an entitlement must appear across accounts in a role."
                  >
                    <div className="w-[120px]">
                      <Input
                        type="number"
                        size="sm"
                        fullWidth
                        value="74"
                        inputProps={{ 'aria-label': 'Min. Coverage (%)' }}
                        endAdornment={<span className="text-body-sm text-text-secondary">%</span>}
                        onChange={() => undefined}
                      />
                    </div>
                  </SettingsNestedRow>
                </SettingsNested>
              }
            />
          </SettingsStack>
        </Example>
      </Section>

      <Section
        title="The stack"
        description="4px between wells. Radius only on the outer corners. A well in the middle is square, so inserting a third setting later does not invent a new shape."
      >
        <Example label="three wells — the middle has no radius">
          <SettingsStack>
            <SettingsRow surface="subtle" title="First">
              <Switch checked={false} inputProps={{ 'aria-label': 'First' }} />
            </SettingsRow>
            <SettingsRow surface="subtle" title="Middle — square corners">
              <Switch checked={false} inputProps={{ 'aria-label': 'Middle' }} />
            </SettingsRow>
            <SettingsRow surface="subtle" title="Last">
              <Switch checked={false} inputProps={{ 'aria-label': 'Last' }} />
            </SettingsRow>
          </SettingsStack>
        </Example>
      </Section>

      <Section title="Guidance">
        <DoDont
          dos={[
            'Use SettingsPage for every new System Settings detail screen.',
            'Give each section its own Save. Dirty in one section must not enable Save in another.',
            'Put sibling grey wells in SettingsStack.',
            'Open SettingsNested inside the parent grey well when a control has a dependent field, or when the well is a heading and the fields live in the white panel.',
            'Use OverflowChips tone="onSubtle" for a chosen set on a grey well.',
          ]}
          donts={[
            'Wrap a subtle SettingsRow in a Card — that is two frames for one setting.',
            'Add a second grey well or a Card for a field that only exists when a parent is on.',
            'Copy the 900px column, Reset icon, or stack radius as one-off classes.',
            'Use SettingsRow on a detail rail — that is InfoRow.',
          ]}
        />
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'SettingsPage.title', type: 'string', description: 'Accessible page name (visually hidden). The breadcrumb already shows it.' },
            { name: 'SettingsPage.description', type: 'string', description: 'Unused visually. Kept so existing callers do not break.' },
            { name: 'SettingsSection.title', type: 'string', description: 'The section h2.' },
            { name: 'SettingsSection.divided', type: 'boolean', default: 'false', description: 'Hairline above this section, for every section after the first.' },
            { name: 'SettingsSection.onSave / onReset', type: '() => void', description: 'Omit either to hide that control.' },
            { name: 'SettingsRow.surface', type: "'plain' | 'subtle'", default: "'plain'", description: 'subtle is the grey well. plain is a divided row inside a Card.' },
            { name: 'SettingsRow.align', type: "'center' | 'start'", default: "'center'", description: 'start pins the title to the top of a tall control (textarea). Compact controls stay center.' },
            { name: 'SettingsRow.nested', type: 'ReactNode', description: 'White follow-up inside this grey well. Pass SettingsNested, or null when a parent control is off.' },
            { name: 'SettingsRow.children', type: 'ReactNode', description: 'The control on the right. Omit when the well is a heading and the fields live in nested.' },
            { name: 'SettingsRow.description', type: 'string', description: 'Why the setting exists. Optional; role wells often skip it.' },
            { name: 'SettingsNested', type: 'ReactNode children', description: 'The white panel. One SettingsNestedRow, or several for a field group.' },
            { name: 'SettingsNestedRow.title', type: 'string', description: 'Name of the nested field. Same left/right layout as a row.' },
            { name: 'SettingsNestedRow.align', type: "'center' | 'start'", default: "'center'", description: 'start pins a long description to the top of the control.' },
          ]}
        />
      </Section>
    </>
  );
}
