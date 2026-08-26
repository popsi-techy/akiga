'use client';

import * as React from 'react';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import {
  Input,
  Select,
  SettingsPage,
  SettingsRow,
  SettingsSection,
  SettingsStack,
  Tooltip,
  useToast,
} from '@ds/components';
import {
  SSO_OAUTH_PROVIDERS,
  getSystemSettings,
  saveSsoOauthSettings,
  type SsoOauthProvider,
  type SsoOauthSettings,
} from '@/data/system-settings';
import { getSystemSettingsSection } from '@/data/system-settings-catalog';
import {
  SettingsDenied,
  same,
  useAdminSettings,
  useSettingsCrumbs,
} from './SettingsChrome';

const SECTION = getSystemSettingsSection('sso-oauth')!;

const ICON_BTN =
  'grid h-8 w-8 place-items-center rounded-md text-icon hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle disabled:pointer-events-none disabled:opacity-40';

function Control({ children }: { children: React.ReactNode }) {
  return <div className="w-[320px]">{children}</div>;
}

function CopyableControl({
  label,
  value,
  onChange,
  onCopy,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  onCopy: (text: string, label: string) => void;
}) {
  return (
    <div className="group relative w-[320px]">
      <Input
        size="sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputProps={{ 'aria-label': label }}
      />
      <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
        <Tooltip title="Copy">
          <button
            type="button"
            aria-label={`Copy ${label}`}
            disabled={!value}
            onClick={() => onCopy(value, label)}
            className="grid h-6 w-6 place-items-center rounded-md bg-surface text-icon hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle disabled:opacity-40"
          >
            <ContentCopyOutlined sx={{ fontSize: 14 }} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

export function SsoOauthSettingsPage({
  hub,
}: {
  hub?: { label: string; href: string };
} = {}) {
  useSettingsCrumbs(SECTION.title, hub);
  const allowed = useAdminSettings();
  const toast = useToast();
  const [value, setValue] = React.useState<SsoOauthSettings | null>(null);
  const [saved, setSaved] = React.useState<SsoOauthSettings | null>(null);
  const [showSecret, setShowSecret] = React.useState(false);

  React.useEffect(() => {
    const next = getSystemSettings().ssoOauth;
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
  const set =
    <K extends keyof SsoOauthSettings>(key: K) =>
    (next: SsoOauthSettings[K]) =>
      setValue({ ...value, [key]: next });

  const save = () => {
    setSaved(saveSsoOauthSettings(value));
    toast.success('SSO OAuth settings saved');
  };

  const reset = () => setValue(saved);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.info(`Could not copy ${label}`);
    }
  };

  return (
    <SettingsPage title={SECTION.title} description={SECTION.pageDescription}>
      <SettingsSection
        id="sso-oauth-heading"
        title="OAuth configuration"
        onReset={reset}
        resetDisabled={!dirty}
        onSave={save}
        saveDisabled={!dirty}
      >
        <SettingsStack>
          <SettingsRow
            surface="subtle"
            title="Configuration Name"
            description="A label so admins can tell this IdP registration apart."
          >
            <Control>
              <Input
                size="sm"
                value={value.configurationName}
                onChange={(e) => set('configurationName')(e.target.value)}
                inputProps={{ 'aria-label': 'Configuration Name' }}
              />
            </Control>
          </SettingsRow>
          <SettingsRow
            surface="subtle"
            title="Provider"
            description="The identity provider this configuration talks to."
          >
            <Control>
              <Select
                size="sm"
                options={SSO_OAUTH_PROVIDERS}
                value={value.provider}
                onChange={(provider) => set('provider')(provider as SsoOauthProvider)}
                ariaLabel="Provider"
              />
            </Control>
          </SettingsRow>
          <SettingsRow
            surface="subtle"
            title="Client ID"
            description="The OAuth client identifier issued by your IdP."
          >
            <Control>
              <Input
                size="sm"
                value={value.clientId}
                onChange={(e) => set('clientId')(e.target.value)}
                inputProps={{ 'aria-label': 'Client ID' }}
              />
            </Control>
          </SettingsRow>
          <SettingsRow
            surface="subtle"
            title="Client Secret"
            description="The OAuth client secret issued by your IdP."
          >
            <Control>
              <Input
                size="sm"
                type={showSecret ? 'text' : 'password'}
                value={value.clientSecret}
                onChange={(e) => set('clientSecret')(e.target.value)}
                autoComplete="new-password"
                inputProps={{ 'aria-label': 'Client Secret' }}
                endAdornment={
                  <button
                    type="button"
                    onClick={() => setShowSecret((v) => !v)}
                    aria-label={showSecret ? 'Hide client secret' : 'Show client secret'}
                    className={ICON_BTN}
                  >
                    {showSecret ? (
                      <VisibilityOffOutlined sx={{ fontSize: 18 }} />
                    ) : (
                      <VisibilityOutlined sx={{ fontSize: 18 }} />
                    )}
                  </button>
                }
              />
            </Control>
          </SettingsRow>
          <SettingsRow
            surface="subtle"
            title="Authorization URL"
            description="Where users are sent to authenticate."
          >
            <CopyableControl
              label="Authorization URL"
              value={value.authorizationUrl}
              onChange={set('authorizationUrl')}
              onCopy={copy}
            />
          </SettingsRow>
          <SettingsRow
            surface="subtle"
            title="Token URL"
            description="Where IGA exchanges the authorization code for tokens."
          >
            <CopyableControl
              label="Token URL"
              value={value.tokenUrl}
              onChange={set('tokenUrl')}
              onCopy={copy}
            />
          </SettingsRow>
          <SettingsRow
            surface="subtle"
            title="User Info URL"
            description="Where IGA fetches the authenticated user's profile."
          >
            <CopyableControl
              label="User Info URL"
              value={value.userInfoUrl}
              onChange={set('userInfoUrl')}
              onCopy={copy}
            />
          </SettingsRow>
          <SettingsRow
            surface="subtle"
            title="Redirect URI"
            description="Must match exactly what is registered in your IdP."
          >
            <CopyableControl
              label="Redirect URI"
              value={value.redirectUri}
              onChange={set('redirectUri')}
              onCopy={copy}
            />
          </SettingsRow>
          <SettingsRow
            surface="subtle"
            title="Grant Type"
            description="The OAuth grant this login flow uses."
          >
            <Control>
              <Input
                size="sm"
                value={value.grantType}
                onChange={(e) => set('grantType')(e.target.value)}
                inputProps={{ 'aria-label': 'Grant Type' }}
              />
            </Control>
          </SettingsRow>
          <SettingsRow
            surface="subtle"
            align="start"
            title="IdP RSA Public Key (PEM)"
            description="Used to validate id_token signatures from your IdP."
          >
            <Control>
              <Input
                size="sm"
                multiline
                minRows={4}
                value={value.idpRsaPublicKey}
                onChange={(e) => set('idpRsaPublicKey')(e.target.value)}
                inputProps={{ 'aria-label': 'IdP RSA Public Key (PEM)' }}
              />
            </Control>
          </SettingsRow>
        </SettingsStack>
      </SettingsSection>
    </SettingsPage>
  );
}
