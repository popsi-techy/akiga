'use client';

import * as React from 'react';
import {
  Input,
  Select,
  SettingsNested,
  SettingsNestedRow,
  SettingsPage,
  SettingsRow,
  SettingsSection,
  SettingsStack,
  Switch,
  useToast,
} from '@ds/components';
import {
  ROLE_MINING_FREQUENCIES,
  getSystemSettings,
  saveRoleMiningSettings,
  type RoleMiningFrequency,
  type RoleMiningSettings,
} from '@/data/system-settings';
import { getSystemSettingsSection } from '@/data/system-settings-catalog';
import {
  SettingsDenied,
  same,
  useAdminSettings,
  useSettingsCrumbs,
} from './SettingsChrome';

const SECTION = getSystemSettingsSection('role-mining')!;

function FrequencySelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: RoleMiningFrequency;
  onChange: (next: RoleMiningFrequency) => void;
}) {
  return (
    <div className="w-[220px]">
      <Select
        size="sm"
        fullWidth
        ariaLabel={label}
        options={ROLE_MINING_FREQUENCIES}
        value={value}
        onChange={(next) => onChange(next as RoleMiningFrequency)}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange: (next: number) => void;
}) {
  return (
    <div className="w-[120px]">
      <Input
        type="number"
        size="sm"
        fullWidth
        value={String(value)}
        inputProps={{ min, max, 'aria-label': label }}
        endAdornment={
          suffix ? <span className="text-body-sm text-text-secondary">{suffix}</span> : undefined
        }
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isNaN(n)) return;
          onChange(Math.min(max, Math.max(min, n)));
        }}
      />
    </div>
  );
}

export function RoleMiningSettingsPage() {
  useSettingsCrumbs(SECTION.title);
  const allowed = useAdminSettings();
  const toast = useToast();
  const [value, setValue] = React.useState<RoleMiningSettings | null>(null);
  const [saved, setSaved] = React.useState<RoleMiningSettings | null>(null);

  React.useEffect(() => {
    const next = getSystemSettings().roleMining;
    setValue(next);
    setSaved(next);
  }, []);

  if (!allowed) return <SettingsDenied />;
  if (!value || !saved) {
    return (
      <SettingsPage title="Role Mining Configurations" description={SECTION.pageDescription}>
        <p className="text-body-sm text-text-secondary">Loading settings…</p>
      </SettingsPage>
    );
  }

  const dirty = !same(value, saved);

  const save = () => {
    setSaved(saveRoleMiningSettings(value));
    toast.success('Role mining settings saved');
  };

  const reset = () => setValue(saved);

  return (
    <SettingsPage title="Role Mining Configurations" description={SECTION.pageDescription}>
      <SettingsSection
        id="role-mining"
        title="Role mining"
        onReset={reset}
        resetDisabled={!dirty}
        onSave={save}
        saveDisabled={!dirty}
      >
        <SettingsStack>
          <SettingsRow
            surface="subtle"
            title="Enable Role Mining"
            description="Turn automated discovery of candidate roles on for this tenant."
          >
            <Switch
              checked={value.enabled}
              onChange={(_, checked) => setValue({ ...value, enabled: checked })}
              inputProps={{ 'aria-label': 'Enable Role Mining' }}
            />
          </SettingsRow>
          <SettingsRow
            surface="subtle"
            title="Enable App-Level Periodic Mining"
            description="Run mining on a schedule for each application."
            nested={
              value.enabled && value.appLevelEnabled ? (
                <SettingsNested>
                  <SettingsNestedRow
                    title="Frequency"
                    description="How often app-level mining runs."
                  >
                    <FrequencySelect
                      label="App-level mining frequency"
                      value={value.appLevelFrequency}
                      onChange={(appLevelFrequency) => setValue({ ...value, appLevelFrequency })}
                    />
                  </SettingsNestedRow>
                </SettingsNested>
              ) : null
            }
          >
            <Switch
              checked={value.appLevelEnabled}
              disabled={!value.enabled}
              onChange={(_, checked) => setValue({ ...value, appLevelEnabled: checked })}
              inputProps={{ 'aria-label': 'Enable App-Level Periodic Mining' }}
            />
          </SettingsRow>
          <SettingsRow
            surface="subtle"
            title="Enable Tenant-Level Periodic Mining"
            description="Run mining across the tenant on a schedule."
            nested={
              value.enabled && value.tenantLevelEnabled ? (
                <SettingsNested>
                  <SettingsNestedRow
                    title="Frequency"
                    description="How often tenant-level mining runs."
                  >
                    <FrequencySelect
                      label="Tenant-level mining frequency"
                      value={value.tenantLevelFrequency}
                      onChange={(tenantLevelFrequency) =>
                        setValue({ ...value, tenantLevelFrequency })
                      }
                    />
                  </SettingsNestedRow>
                </SettingsNested>
              ) : null
            }
          >
            <Switch
              checked={value.tenantLevelEnabled}
              disabled={!value.enabled}
              onChange={(_, checked) => setValue({ ...value, tenantLevelEnabled: checked })}
              inputProps={{ 'aria-label': 'Enable Tenant-Level Periodic Mining' }}
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
                  hint="How consistently an entitlement must appear across user accounts to be included in a role. E.g. 70% means at least 70% of the accounts in the role must share that entitlement."
                >
                  <NumberField
                    label="Min. Coverage (%)"
                    value={value.minCoveragePercent}
                    min={1}
                    max={100}
                    suffix="%"
                    onChange={(minCoveragePercent) => setValue({ ...value, minCoveragePercent })}
                  />
                </SettingsNestedRow>
                <SettingsNestedRow
                  title="Min. Entitlements per Role"
                  description="Minimum entitlements a candidate role must contain."
                  hint="The minimum number of entitlements a candidate role must contain. Roles with fewer entitlements than this are discarded."
                >
                  <NumberField
                    label="Min. Entitlements per Role"
                    value={value.minEntitlementsPerRole}
                    min={1}
                    max={200}
                    onChange={(minEntitlementsPerRole) =>
                      setValue({ ...value, minEntitlementsPerRole })
                    }
                  />
                </SettingsNestedRow>
                <SettingsNestedRow
                  title="Min. Accounts per Role"
                  description="Minimum user accounts a candidate role must cover."
                  hint="The minimum number of user accounts a candidate role must cover. Roles that apply to fewer accounts than this are discarded."
                >
                  <NumberField
                    label="Min. Accounts per Role"
                    value={value.minAccountsPerRole}
                    min={1}
                    max={10000}
                    onChange={(minAccountsPerRole) => setValue({ ...value, minAccountsPerRole })}
                  />
                </SettingsNestedRow>
              </SettingsNested>
            }
          />
        </SettingsStack>
      </SettingsSection>
    </SettingsPage>
  );
}
