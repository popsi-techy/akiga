'use client';

import * as React from 'react';
import {
  Input,
  SettingsInfoBanner,
  SettingsPage,
  SettingsRow,
  SettingsSection,
  SettingsStack,
  useToast,
} from '@ds/components';
import {
  ISO_USAGE_LOCATION,
  getSystemSettings,
  normalizeUsageLocation,
  saveLocaleSettings,
  type TenantLocale,
} from '@/data/system-settings';
import { getSystemSettingsSection } from '@/data/system-settings-catalog';
import {
  SettingsDenied,
  same,
  useAdminSettings,
  useSettingsCrumbs,
} from './SettingsChrome';

const SECTION = getSystemSettingsSection('locale-regional')!;

export function LocaleRegionalSettingsPage() {
  useSettingsCrumbs(SECTION.title);
  const allowed = useAdminSettings();
  const toast = useToast();
  const [value, setValue] = React.useState<TenantLocale | null>(null);
  const [saved, setSaved] = React.useState<TenantLocale | null>(null);

  React.useEffect(() => {
    const next = getSystemSettings().locale;
    setValue(next);
    setSaved(next);
  }, []);

  if (!allowed) return <SettingsDenied />;
  if (!value || !saved) {
    return (
      <SettingsPage title={SECTION.title} description={SECTION.pageDescription}>
        <p className="text-body-sm text-text-secondary">Loading settings…</p>
      </SettingsPage>
    );
  }

  const dirty = !same(value, saved);
  const valid = ISO_USAGE_LOCATION.test(value.usageLocation);

  const save = () => {
    if (!valid) return;
    setSaved(saveLocaleSettings(value));
    toast.success(`Default usage location is now ${value.usageLocation}`);
  };

  return (
    <SettingsPage title={SECTION.title} description={SECTION.pageDescription}>
      <SettingsSection
        id="locale-regional"
        title="Locale & Regional Settings"
        onReset={() => setValue(saved)}
        resetDisabled={!dirty}
        onSave={save}
        saveDisabled={!dirty || !valid}
      >
        <SettingsStack>
          <SettingsRow
            surface="subtle"
            align="start"
            title="Default Usage Location"
            description="ISO 3166-1 alpha-2 country code (e.g. US, GB, IN) assigned to users that do not have a usage location set. Required by Microsoft 365 before license assignment."
          >
            <div className="w-[72px]">
              <Input
                size="sm"
                value={value.usageLocation}
                onChange={(e) =>
                  setValue({
                    ...value,
                    usageLocation: normalizeUsageLocation(e.target.value),
                  })
                }
                inputProps={{
                  maxLength: 2,
                  autoComplete: 'off',
                  autoCapitalize: 'characters',
                  spellCheck: false,
                  'aria-label': 'Default usage location',
                  'aria-invalid': !valid,
                }}
              />
            </div>
          </SettingsRow>
        </SettingsStack>
        <div className="mt-4">
          <SettingsInfoBanner>
            {valid
              ? `Users without a usage location inherit ${value.usageLocation} before Microsoft 365 license assignment.`
              : 'Enter a two-letter ISO 3166-1 alpha-2 country code (e.g. US, GB, IN).'}
          </SettingsInfoBanner>
        </div>
      </SettingsSection>
    </SettingsPage>
  );
}
