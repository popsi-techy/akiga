'use client';

import * as React from 'react';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import PersonOutline from '@mui/icons-material/PersonOutline';
import LoginOutlined from '@mui/icons-material/LoginOutlined';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import LinkOutlined from '@mui/icons-material/LinkOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import LockOpenOutlined from '@mui/icons-material/LockOpenOutlined';
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import LabelOutlined from '@mui/icons-material/LabelOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import { Button, Drawer, FormSection, Input, ModeBar, Select, Tabs, Tooltip, useToast } from '@ds/components';
import {
  GRANT_TYPES,
  METHOD_LABEL,
  emptyOAuth,
  grantUsesUserAgent,
  saveAuthorization,
  type AppAuthorization,
  type AuthMethod,
  type CredentialsIn,
  type GrantType,
  type OAuthConfig,
} from '@/data/provisioning-auth';

const METHODS: { value: AuthMethod; enabled: boolean }[] = [
  { value: 'basic', enabled: true },
  { value: 'bearer', enabled: false },
  { value: 'oauth2', enabled: true },
  { value: 'custom', enabled: false },
];

const METHOD_ICON: Record<AuthMethod, React.ReactNode> = {
  basic: <PersonOutline sx={{ fontSize: 18 }} />,
  bearer: <VpnKeyOutlined sx={{ fontSize: 18 }} />,
  oauth2: <LoginOutlined sx={{ fontSize: 18 }} />,
  custom: <TuneOutlined sx={{ fontSize: 18 }} />,
};

/**
 * How IGA signs in to an application.
 *
 * Basic and OAuth 2.0 ask for entirely different things, so the form below the
 * method switcher is replaced rather than extended — and OAuth's own split is
 * request (what we send the provider) versus response (what we read back),
 * which is the order you fill them in and the order they fail in.
 *
 * The request is four jobs, not a field list: how the handshake starts, who
 * IGA is, which URLs it calls, and how the token request is shaped. FormSection
 * is the group — heading and a hairline, not a card (ADR-0013). The method
 * itself is a ModeBar in the drawer subheader, because it chooses which form
 * you are filling and must stay visible while that form scrolls (ADR-0014).
 * OAuth's Request / Response tabs pin in the toolbar for the same reason.
 *
 * Secrets are write-only. An existing password is never loaded back into the
 * field; leaving it untouched keeps the stored one.
 */
export function AuthorizationDrawer({
  open,
  applicationId,
  existing,
  onClose,
  onSaved,
}: {
  open: boolean;
  applicationId: string;
  /** Null when adding. */
  existing: AppAuthorization | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [method, setMethod] = React.useState<AuthMethod>('basic');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [oauth, setOAuth] = React.useState<OAuthConfig>(() => emptyOAuth(applicationId));
  const [clientSecret, setClientSecret] = React.useState('');
  const [showSecret, setShowSecret] = React.useState(false);
  const [section, setSection] = React.useState('request');
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setMethod(existing?.method ?? 'basic');
    setUsername(existing?.basic?.username ?? '');
    setPassword('');
    setShowPassword(false);
    setOAuth(existing?.oauth ? { ...emptyOAuth(applicationId), ...existing.oauth } : emptyOAuth(applicationId));
    setClientSecret('');
    setShowSecret(false);
    setSection('request');
    setTouched(false);
  }, [open, existing, applicationId]);

  const set = <K extends keyof OAuthConfig>(key: K, value: OAuthConfig[K]) =>
    setOAuth((o) => ({ ...o, [key]: value }));

  const keptPassword = Boolean(existing?.basic?.hasPassword);
  const keptSecret = Boolean(existing?.oauth?.hasClientSecret);
  const usesUserAgent = grantUsesUserAgent(oauth.grantType);

  const required = (value: string, kept = false) => (touched && !value.trim() && !kept ? 'Required.' : undefined);

  const valid =
    method === 'basic'
      ? username.trim() !== '' && (password.trim() !== '' || keptPassword)
      : oauth.clientId.trim() !== '' &&
        (clientSecret.trim() !== '' || keptSecret) &&
        oauth.tokenEndpoint.trim() !== '' &&
        oauth.scope.trim() !== '' &&
        (!usesUserAgent || oauth.authorizationEndpoint.trim() !== '');

  const save = () => {
    setTouched(true);
    if (!valid) {
      // OAuth hides half its fields behind a tab, so an invalid save has to say
      // where the problem is rather than leaving the user staring at a valid form.
      if (method === 'oauth2') setSection('request');
      return;
    }
    saveAuthorization({
      id: existing?.id,
      applicationId,
      method,
      basic: method === 'basic' ? { username: username.trim(), hasPassword: password.trim() !== '' || keptPassword } : undefined,
      oauth: method === 'oauth2' ? { ...oauth, hasClientSecret: clientSecret.trim() !== '' || keptSecret } : undefined,
    });
    toast.success(
      existing ? 'Authorization updated. Authorize again to reconnect.' : 'Authorization saved. Authorize it to connect.',
    );
    onSaved();
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.info(`Could not copy ${label}`);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      icon={<ShieldOutlined sx={{ fontSize: 22 }} />}
      title={existing ? 'Edit authorization' : 'Add authorization'}
      subtitle="How IGA signs in when it calls this application."
      width={560}
      subheader={
        <ModeBar
          ariaLabel="Authentication method"
          value={method}
          onChange={(v) => setMethod(v as AuthMethod)}
          options={METHODS.map((m) => ({
            value: m.value,
            label: METHOD_LABEL[m.value],
            icon: METHOD_ICON[m.value],
            disabled: !m.enabled,
            hint: m.enabled ? undefined : 'Coming soon',
          }))}
        />
      }
      toolbar={
        method === 'oauth2' ? (
          <Tabs
            aria-label="OAuth configuration"
            items={[
              { value: 'request', label: 'Request' },
              { value: 'response', label: 'Response' },
            ]}
            value={section}
            onChange={setSection}
          />
        ) : undefined
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </>
      }
    >
      {method === 'basic' && (
        <div className="space-y-4">
          <Input
            label="Username"
            required
            placeholder="service-account@company.com"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={required(username)}
          />
          <Input
            label="Password"
            required={!keptPassword}
            hint="Stored encrypted and never shown again. To change it, type a new one."
            type={showPassword ? 'text' : 'password'}
            placeholder={keptPassword ? 'Unchanged — type to replace' : 'Enter password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={required(password, keptPassword)}
            endAdornment={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="rounded-md p-0.5 text-icon hover:bg-surface-hover"
              >
                {showPassword ? (
                  <VisibilityOffOutlined sx={{ fontSize: 18 }} />
                ) : (
                  <VisibilityOutlined sx={{ fontSize: 18 }} />
                )}
              </button>
            }
          />
        </div>
      )}

      {method === 'oauth2' && section === 'request' && (
        <>
              <FormSection title="Authorization flow" icon={<LoginOutlined sx={{ fontSize: 18 }} />}>
                <Select
                  label="Grant type"
                  options={GRANT_TYPES.map((g) => ({ value: g.value, label: g.label }))}
                  value={oauth.grantType}
                  onChange={(v) => set('grantType', v as GrantType)}
                />
                {usesUserAgent ? (
                  <div className="group relative w-full">
                    <Input
                      label="Redirect URL"
                      hint="IGA's callback. Register this exact URL with the provider — a mismatch is rejected before any error you can read."
                      value={oauth.redirectUrl}
                      // IGA owns this URL — it is here to be copied, not edited.
                      InputProps={{ readOnly: true }}
                    />
                    <div className="pointer-events-none absolute bottom-0 right-1.5 flex h-9 items-center opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                      <Tooltip title="Copy">
                        <button
                          type="button"
                          aria-label="Copy Redirect URL"
                          disabled={!oauth.redirectUrl}
                          onClick={() => void copy(oauth.redirectUrl, 'Redirect URL')}
                          className="grid h-6 w-6 place-items-center rounded-md bg-surface text-icon hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle disabled:opacity-40"
                        >
                          <ContentCopyOutlined sx={{ fontSize: 14 }} />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                ) : null}
              </FormSection>

              <FormSection title="Client credentials" icon={<VpnKeyOutlined sx={{ fontSize: 18 }} />} divided>
                <Input
                  label="Client ID"
                  required
                  placeholder="Client ID"
                  value={oauth.clientId}
                  onChange={(e) => set('clientId', e.target.value)}
                  error={required(oauth.clientId)}
                />
                <Input
                  label="Client secret"
                  required={!keptSecret}
                  hint="Stored encrypted and never shown again. To change it, type a new one."
                  type={showSecret ? 'text' : 'password'}
                  placeholder={keptSecret ? 'Unchanged — type to replace' : 'Client secret'}
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  error={required(clientSecret, keptSecret)}
                  endAdornment={
                    <button
                      type="button"
                      onClick={() => setShowSecret((v) => !v)}
                      aria-label={showSecret ? 'Hide client secret' : 'Show client secret'}
                      className="rounded-md p-0.5 text-icon hover:bg-surface-hover"
                    >
                      {showSecret ? (
                        <VisibilityOffOutlined sx={{ fontSize: 18 }} />
                      ) : (
                        <VisibilityOutlined sx={{ fontSize: 18 }} />
                      )}
                    </button>
                  }
                />
              </FormSection>

              <FormSection title="Endpoints" icon={<LinkOutlined sx={{ fontSize: 18 }} />} divided>
                {usesUserAgent ? (
                  <Input
                    label="Authorization endpoint"
                    required
                    hint="Where the user is sent to approve access."
                    placeholder="https://provider.com/oauth/authorize"
                    value={oauth.authorizationEndpoint}
                    onChange={(e) => set('authorizationEndpoint', e.target.value)}
                    error={required(oauth.authorizationEndpoint)}
                  />
                ) : null}
                <Input
                  label="Token endpoint"
                  required
                  hint="Where IGA exchanges the code for a token, and refreshes it later."
                  placeholder="https://provider.com/oauth/token"
                  value={oauth.tokenEndpoint}
                  onChange={(e) => set('tokenEndpoint', e.target.value)}
                  error={required(oauth.tokenEndpoint)}
                />
                <Input
                  label="User information endpoint"
                  hint="OIDC userinfo. Leave blank if the provider does not publish one."
                  placeholder="https://provider.com/oauth/userinfo"
                  value={oauth.userInfoEndpoint}
                  onChange={(e) => set('userInfoEndpoint', e.target.value)}
                />
              </FormSection>

              <FormSection
                title="Authentication configuration"
                icon={<TuneOutlined sx={{ fontSize: 18 }} />}
                divided
              >
                <Select
                  label="Send client credentials in"
                  helperText="Header uses HTTP Basic auth; body posts them as form fields. Match what the provider documents."
                  options={[
                    { value: 'body', label: 'Request body' },
                    { value: 'header', label: 'Authorization header' },
                  ]}
                  value={oauth.credentialsIn}
                  onChange={(v) => set('credentialsIn', v as CredentialsIn)}
                />
                <Input
                  label="Scope"
                  required
                  hint="Space-separated. Ask for the least the connector needs — every extra scope is access IGA holds but does not use."
                  placeholder="users:read groups:write"
                  value={oauth.scope}
                  onChange={(e) => set('scope', e.target.value)}
                  error={required(oauth.scope)}
                />
              </FormSection>
        </>
      )}

      {method === 'oauth2' && section === 'response' && (
        <>
              <FormSection title="Access token" icon={<LockOpenOutlined sx={{ fontSize: 18 }} />}>
                <Input
                  label="Access token key"
                  value={oauth.accessTokenKey}
                  onChange={(e) => set('accessTokenKey', e.target.value)}
                />
                <Input
                  label="Access token expiry key"
                  value={oauth.expiresInKey}
                  onChange={(e) => set('expiresInKey', e.target.value)}
                />
              </FormSection>
              <FormSection title="Refresh token" icon={<RefreshOutlined sx={{ fontSize: 18 }} />} divided>
                <Input
                  label="Refresh token key"
                  value={oauth.refreshTokenKey}
                  onChange={(e) => set('refreshTokenKey', e.target.value)}
                />
                <Input
                  label="Refresh token expiry key"
                  value={oauth.refreshExpiresInKey}
                  onChange={(e) => set('refreshExpiresInKey', e.target.value)}
                />
              </FormSection>
              <FormSection title="Token type" icon={<LabelOutlined sx={{ fontSize: 18 }} />} divided>
                <Input
                  label="Token type"
                  hint="Almost always Bearer. Change only when the provider’s token_type is something else."
                  value={oauth.tokenType}
                  onChange={(e) => set('tokenType', e.target.value)}
                />
              </FormSection>
        </>
      )}
    </Drawer>
  );
}
