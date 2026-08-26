'use client';

import * as React from 'react';
import EditOutlined from '@mui/icons-material/EditOutlined';
import {
  OverflowChips,
  SettingsInfoBanner,
  SettingsPage,
  SettingsRow,
  SettingsSection,
  SettingsStack,
  Switch,
  Tooltip,
  useToast,
} from '@ds/components';
import {
  getSystemSettings,
  saveMfaSettings,
  MFA_METHOD_LABELS,
  type MfaSettings,
} from '@/data/system-settings';
import {
  SettingsDenied,
  same,
  useAdminSettings,
  useSettingsCrumbs,
} from './SettingsChrome';

function configSlice(m: MfaSettings) {
  return { enforceForAllUsers: m.enforceForAllUsers, methods: m.methods };
}

function rolesSlice(m: MfaSettings) {
  return { endUserEnabled: m.endUserEnabled, reviewerEnabled: m.reviewerEnabled };
}

const PAGE_TITLE = 'Multi-Factor Authentication (MFA)';
const PAGE_DESCRIPTION =
  'Enforce extra security checks during login and customize authentication requirements by user role.';

export function MfaSettingsPage({
  hub,
}: {
  hub?: { label: string; href: string };
} = {}) {
  useSettingsCrumbs('MFA Settings', hub);
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
      <SettingsPage title={PAGE_TITLE} description={PAGE_DESCRIPTION}>
        <p className="text-body-sm text-text-secondary">Loading settings…</p>
      </SettingsPage>
    );
  }

  const configDirty = !same(configSlice(value), configSlice(saved));
  const rolesDirty = !same(rolesSlice(value), rolesSlice(saved));

  const saveConfig = () => {
    setSaved(
      saveMfaSettings({
        ...saved,
        enforceForAllUsers: value.enforceForAllUsers,
        methods: value.methods,
      }),
    );
    toast.success('MFA configuration saved');
  };

  const resetConfig = () => {
    setValue({
      ...value,
      enforceForAllUsers: saved.enforceForAllUsers,
      methods: saved.methods,
    });
  };

  const saveRoles = () => {
    setSaved(
      saveMfaSettings({
        ...saved,
        endUserEnabled: value.endUserEnabled,
        reviewerEnabled: value.reviewerEnabled,
      }),
    );
    toast.success('MFA role settings saved');
  };

  return (
    <SettingsPage title={PAGE_TITLE} description={PAGE_DESCRIPTION}>
      <SettingsSection
        id="mfa-config-heading"
        title="MFA Configuration"
        onReset={resetConfig}
        resetDisabled={!configDirty}
        onSave={saveConfig}
        saveDisabled={!configDirty}
      >
        <SettingsStack>
          <SettingsRow
            surface="subtle"
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
            surface="subtle"
            title="Allowed MFA Methods"
            description="Select which authentication methods are available for users."
          >
            <OverflowChips
              items={value.methods.map((id) => ({ id, name: MFA_METHOD_LABELS[id] }))}
              max={1}
              tone="onSubtle"
            />
            <Tooltip title="Edit">
              <button
                type="button"
                aria-label="Edit allowed MFA methods"
                onClick={() =>
                  toast.info('Additional MFA methods are not available in this prototype')
                }
                className="grid h-8 w-8 place-items-center rounded-md text-icon hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
              >
                <EditOutlined sx={{ fontSize: 18 }} />
              </button>
            </Tooltip>
          </SettingsRow>
        </SettingsStack>
      </SettingsSection>

      <SettingsSection
        id="mfa-roles-heading"
        title="MFA Configuration for roles"
        divided
        onSave={saveRoles}
        saveDisabled={!rolesDirty}
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
        <div className="mt-4">
          <SettingsInfoBanner>
            MFA is mandatory for <span className="text-body-sm-strong">Tenant Administrator</span>,{' '}
            <span className="text-body-sm-strong">Additional Administrator</span> and is always on.
          </SettingsInfoBanner>
        </div>
      </SettingsSection>
    </SettingsPage>
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
    <SettingsRow surface="subtle" title={title}>
      <Switch
        checked={enabled}
        onChange={(_, checked) => onChange(checked)}
        inputProps={{ 'aria-label': `Enable MFA for ${title}` }}
      />
    </SettingsRow>
  );
}
