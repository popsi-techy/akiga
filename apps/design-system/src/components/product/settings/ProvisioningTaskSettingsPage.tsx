'use client';

import * as React from 'react';
import {
  SettingsInfoBanner,
  SettingsPage,
  SettingsRow,
  SettingsSection,
  SettingsStack,
  Switch,
  useToast,
} from '@ds/components';
import {
  getSystemSettings,
  saveProvisioningTaskSettings,
  type ProvisioningTaskSettings,
} from '@/data/system-settings';
import { getSystemSettingsSection } from '@/data/system-settings-catalog';
import {
  SettingsDenied,
  same,
  useAdminSettings,
  useSettingsCrumbs,
} from './SettingsChrome';

const SECTION = getSystemSettingsSection('provisioning-task')!;

export function ProvisioningTaskSettingsPage() {
  useSettingsCrumbs(SECTION.title);
  const allowed = useAdminSettings();
  const toast = useToast();
  const [value, setValue] = React.useState<ProvisioningTaskSettings | null>(null);
  const [saved, setSaved] = React.useState<ProvisioningTaskSettings | null>(null);

  React.useEffect(() => {
    const next = getSystemSettings().provisioningTask;
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

  const save = () => {
    setSaved(saveProvisioningTaskSettings(value));
    toast.success(
      value.requireEvidence
        ? 'Evidence is now required on manual provisioning tasks'
        : 'Evidence is optional on manual provisioning tasks',
    );
  };

  return (
    <SettingsPage title={SECTION.title} description={SECTION.pageDescription}>
      <SettingsSection
        id="provisioning-task"
        title="Provisioning Task Configurations"
        onReset={() => setValue(saved)}
        resetDisabled={!dirty}
        onSave={save}
        saveDisabled={!dirty}
      >
        <SettingsStack>
          <SettingsRow
            surface="subtle"
            title="Require Evidence Upload"
            description="When enabled, uploading evidence is mandatory for manual provisioning tasks. When disabled, evidence upload is optional."
          >
            <Switch
              checked={value.requireEvidence}
              onChange={(_, checked) => setValue({ ...value, requireEvidence: checked })}
              inputProps={{ 'aria-label': 'Require evidence upload' }}
            />
          </SettingsRow>
        </SettingsStack>
        <div className="mt-4">
          {value.requireEvidence ? (
            <SettingsInfoBanner>
              Admins must attach evidence before completing a manual grant or removal.
            </SettingsInfoBanner>
          ) : (
            <SettingsInfoBanner>
              Evidence can still be attached on a task; it is not required to complete it.
            </SettingsInfoBanner>
          )}
        </div>
      </SettingsSection>
    </SettingsPage>
  );
}
