'use client';

import * as React from 'react';
import FactCheck from '@mui/icons-material/FactCheck';
import { Card, Select, Switch, TimePicker, formatTime12, useToast } from '@ds/components';
import {
  SYSTEM_SETTING_TIMEZONES,
  getSystemSettings,
  saveMicroCertificationSettings,
  timezoneLabel,
  type MicroCertificationSettings,
} from '@/data/system-settings';
import { SettingsInfoBanner, SettingsRow } from './SettingsRow';
import {
  SettingsActions,
  SettingsDenied,
  SettingsLoading,
  same,
  useAdminSettings,
  useSettingsCrumbs,
} from './SettingsChrome';

export function MicroCertificationSettingsPage() {
  useSettingsCrumbs('Micro Certification Settings');
  const allowed = useAdminSettings();
  const toast = useToast();
  const [value, setValue] = React.useState<MicroCertificationSettings | null>(null);
  const [saved, setSaved] = React.useState<MicroCertificationSettings | null>(null);

  React.useEffect(() => {
    const next = getSystemSettings().microCertification;
    setValue(next);
    setSaved(next);
  }, []);

  if (!allowed) return <SettingsDenied />;
  if (!value || !saved) {
    return (
      <SettingsLoading
        title="Micro Certification"
        description="System events are collected throughout the day and processed at your scheduled time."
      />
    );
  }

  const zone = timezoneLabel(value.timezone);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h2 text-text-primary">Micro Certification</h1>
          <p className="mt-1 text-body text-text-secondary">
            System events are collected throughout the day and processed at your scheduled time.
          </p>
        </div>
        <SettingsActions
          dirty={!same(value, saved)}
          onSave={() => {
            setSaved(saveMicroCertificationSettings(value));
            toast.success('Micro certification settings saved');
          }}
        />
      </div>

      <Card icon={<FactCheck />} title="Configure Micro certification" padding="md">
        <div className="divide-y divide-border">
          <SettingsRow
            title="Enable Micro certification"
            description="Automatically create micro certifications from daily events."
          >
            <Switch
              checked={value.enabled}
              onChange={(_, checked) => setValue({ ...value, enabled: checked })}
              inputProps={{ 'aria-label': 'Enable Micro certification' }}
            />
          </SettingsRow>
          <SettingsRow
            title="Timezone and Time"
            description="Set your preferred timezone and time for micro certification creation."
          >
            <div className="w-[220px]">
              <Select
                size="sm"
                fullWidth
                disabled={!value.enabled}
                ariaLabel="Timezone"
                options={[...SYSTEM_SETTING_TIMEZONES]}
                value={value.timezone}
                onChange={(timezone) => setValue({ ...value, timezone })}
              />
            </div>
            <div className="w-[140px]">
              <TimePicker
                size="sm"
                minuteStep={1}
                disabled={!value.enabled}
                ariaLabel="Launch time"
                value={value.time}
                onChange={(time) => setValue({ ...value, time })}
              />
            </div>
          </SettingsRow>
        </div>
        <div className="mt-4">
          {value.enabled ? (
            <SettingsInfoBanner>
              Micro certifications will launch daily at{' '}
              <span className="font-emphasis">
                {formatTime12(value.time)} ({zone})
              </span>
              .
            </SettingsInfoBanner>
          ) : (
            <SettingsInfoBanner>
              Micro certifications are off. Daily events are still collected; nothing
              is launched until you enable this.
            </SettingsInfoBanner>
          )}
        </div>
      </Card>
    </div>
  );
}
