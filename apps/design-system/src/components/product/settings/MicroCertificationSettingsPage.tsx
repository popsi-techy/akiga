'use client';

import * as React from 'react';
import {
  RadioCardGroup,
  Select,
  SettingsInfoBanner,
  SettingsPage,
  SettingsRow,
  SettingsSection,
  SettingsStack,
  Switch,
  TimePicker,
  formatTime12,
  useToast,
} from '@ds/components';
import {
  MICRO_CERT_PENDING_EVENTS,
  SYSTEM_SETTING_TIMEZONES,
  getSystemSettings,
  saveMicroCertificationSettings,
  timezoneLabel,
  type MicroCertDisableAction,
  type MicroCertificationSettings,
} from '@/data/system-settings';
import { getSystemSettingsSection } from '@/data/system-settings-catalog';
import {
  SettingsDenied,
  same,
  useAdminSettings,
  useSettingsCrumbs,
} from './SettingsChrome';

const SECTION = getSystemSettingsSection('micro-certification')!;

const DISABLE_OPTIONS = [
  {
    value: 'create-and-disable',
    label: 'Create and disable',
    description: 'Process pending events into micro certifications before turning this off.',
  },
  {
    value: 'delete-pending',
    label: 'Delete pending events',
    description: 'Discard pending events without creating micro certifications. This cannot be undone.',
  },
];

export function MicroCertificationSettingsPage() {
  useSettingsCrumbs(SECTION.title);
  const allowed = useAdminSettings();
  const toast = useToast();
  const [value, setValue] = React.useState<MicroCertificationSettings | null>(null);
  const [saved, setSaved] = React.useState<MicroCertificationSettings | null>(null);
  const [disableAction, setDisableAction] = React.useState<MicroCertDisableAction>('create-and-disable');

  React.useEffect(() => {
    const next = getSystemSettings().microCertification;
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
  const turningOff = saved.enabled && !value.enabled;
  const zone = timezoneLabel(value.timezone);

  const save = () => {
    setSaved(saveMicroCertificationSettings(value));
    if (turningOff) {
      toast.success(
        disableAction === 'delete-pending'
          ? 'Micro certification disabled. Pending events were discarded.'
          : 'Micro certification disabled. Pending events will be processed.',
      );
    } else {
      toast.success('Micro certification settings saved');
    }
  };

  const reset = () => {
    setValue(saved);
    setDisableAction('create-and-disable');
  };

  return (
    <SettingsPage title={SECTION.title} description={SECTION.pageDescription}>
      <SettingsSection
        id="micro-certification"
        title="Configure Micro certification"
        onReset={reset}
        resetDisabled={!dirty}
        onSave={save}
        saveDisabled={!dirty}
      >
        <SettingsStack>
          <SettingsRow
            surface="subtle"
            title="Enable Micro certification"
            description="Automatically create micro certifications from daily events."
            nested={
              turningOff ? (
                <div className="rounded-md border border-[var(--ds-color-status-warning-border)] bg-surface px-4 py-3">
                  <p className="mb-3 text-body-sm-medium text-text-primary">
                    Choose how to handle {MICRO_CERT_PENDING_EVENTS.toLocaleString()} pending events
                    before disabling.
                  </p>
                  <RadioCardGroup
                    appearance="outlined"
                    ariaLabel="How to handle pending events"
                    options={DISABLE_OPTIONS}
                    value={disableAction}
                    onChange={(next) => setDisableAction(next as MicroCertDisableAction)}
                  />
                </div>
              ) : null
            }
          >
            <Switch
              checked={value.enabled}
              onChange={(_, checked) => {
                setValue({ ...value, enabled: checked });
                if (checked) setDisableAction('create-and-disable');
              }}
              inputProps={{ 'aria-label': 'Enable Micro certification' }}
            />
          </SettingsRow>
          <SettingsRow
            surface="subtle"
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
        </SettingsStack>
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
              Micro certifications are off. Daily events are still collected; nothing is launched
              until you enable this.
            </SettingsInfoBanner>
          )}
        </div>
      </SettingsSection>
    </SettingsPage>
  );
}
