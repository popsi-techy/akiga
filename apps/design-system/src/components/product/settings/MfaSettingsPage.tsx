'use client';

import * as React from 'react';
import GppGood from '@mui/icons-material/GppGood';
import { Button, Card, StatusChip, Switch, useToast } from '@ds/components';
import { getSystemSettings, saveMfaSettings, type MfaSettings } from '@/data/system-settings';
import { SettingsInfoBanner, SettingsRow } from './SettingsRow';
import {
  SettingsActions,
  SettingsDenied,
  SettingsLoading,
  same,
  useAdminSettings,
  useSettingsCrumbs,
} from './SettingsChrome';

export function MfaSettingsPage() {
  useSettingsCrumbs('MFA Settings');
  const allowed = useAdminSettings();
  const toast = useToast();
  const [value, setValue] = React.useState<MfaSettings | null>(null);
  const [saved, setSaved] = React.useState<MfaSettings | null>(null);

  React.useEffect(() => {
    const next = getSystemSettings().mfa;
    setValue(next);
    setSaved(next);
  }, []);

  if (!allowed) return <SettingsDenied />;
  if (!value || !saved) {
    return (
      <SettingsLoading
        title="Multi-Factor Authentication (MFA)"
        description="Enforce extra security checks during login and customize authentication requirements by user role."
      />
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h2 text-text-primary">Multi-Factor Authentication (MFA)</h1>
          <p className="mt-1 text-body text-text-secondary">
            Enforce extra security checks during login and customize authentication
            requirements by user role.
          </p>
        </div>
        <SettingsActions
          dirty={!same(value, saved)}
          onSave={() => {
            setSaved(saveMfaSettings(value));
            toast.success('MFA settings saved');
          }}
        />
      </div>

      <div className="space-y-4">
        <Card icon={<GppGood />} title="MFA Configuration" padding="md">
          <div className="divide-y divide-border">
            <SettingsRow
              title="Enforce MFA for all users"
              description="Require all users to complete MFA when logging in. Default method is email."
            >
              <Switch
                checked={value.enforceForAllUsers}
                onChange={(_, checked) => setValue({ ...value, enforceForAllUsers: checked })}
                inputProps={{ 'aria-label': 'Enforce MFA for all users' }}
              />
            </SettingsRow>
            <SettingsRow
              title="Allowed MFA methods"
              description="Select which authentication methods are available for users."
            >
              <StatusChip intent="info" label="Email OTP" dot={false} />
              <Button
                variant="tertiary"
                size="xs"
                onClick={() => toast.info('Additional MFA methods are not available in this prototype')}
              >
                Edit
              </Button>
            </SettingsRow>
          </div>
        </Card>

        <Card
          icon={<GppGood />}
          title="MFA Configuration for roles"
          subtitle="Bulk enable or disable MFA for specific user roles."
          padding="md"
          footer={
            <SettingsInfoBanner>
              MFA is mandatory for Tenant Administrator and Additional Administrator
              and is always on.
            </SettingsInfoBanner>
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            <RoleCard
              title="End User"
              enabled={value.endUserEnabled}
              onChange={(endUserEnabled) => setValue({ ...value, endUserEnabled })}
            />
            <RoleCard
              title="Reviewer"
              enabled={value.reviewerEnabled}
              onChange={(reviewerEnabled) => setValue({ ...value, reviewerEnabled })}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function RoleCard({
  title,
  enabled,
  onChange,
}: {
  title: string;
  enabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-body-sm-strong text-text-primary">{title}</p>
        <Switch
          checked={enabled}
          onChange={(_, checked) => onChange(checked)}
          inputProps={{ 'aria-label': `Enable MFA for ${title}` }}
        />
      </div>
    </div>
  );
}
