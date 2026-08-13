'use client';

import * as React from 'react';
import Shield from '@mui/icons-material/Shield';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import { Button, Drawer, Input, Radio, Select, Tabs, useToast } from '@ds/components';
import {
  GRANT_TYPES,
  METHOD_LABEL,
  emptyOAuth,
  redirectUrlFor,
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

/**
 * How IGA signs in to an application.
 *
 * Basic and OAuth 2.0 ask for entirely different things, so the form below the
 * method switcher is replaced rather than extended — and OAuth's own split is
 * request (what we send the provider) versus response (what we read back),
 * which is the order you fill them in and the order they fail in.
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
    setOAuth(existing?.oauth ?? emptyOAuth(applicationId));
    setClientSecret('');
    setShowSecret(false);
    setSection('request');
    setTouched(false);
  }, [open, existing, applicationId]);

  const set = <K extends keyof OAuthConfig>(key: K, value: OAuthConfig[K]) =>
    setOAuth((o) => ({ ...o, [key]: value }));

  const keptPassword = Boolean(existing?.basic?.hasPassword);
  const keptSecret = Boolean(existing?.oauth?.hasClientSecret);

  const required = (value: string, kept = false) => (touched && !value.trim() && !kept ? 'Required.' : undefined);

  const valid =
    method === 'basic'
      ? username.trim() !== '' && (password.trim() !== '' || keptPassword)
      : oauth.clientId.trim() !== '' &&
        (clientSecret.trim() !== '' || keptSecret) &&
        oauth.authorizationEndpoint.trim() !== '' &&
        oauth.tokenEndpoint.trim() !== '' &&
        oauth.scope.trim() !== '';

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

  const copyRedirect = () => {
    void navigator.clipboard?.writeText(redirectUrlFor(applicationId));
    toast.info('Redirect URL copied.');
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      icon={<Shield sx={{ fontSize: 22 }} />}
      title={existing ? 'Edit authorization' : 'Add authorization'}
      subtitle="How IGA signs in when it calls this application."
      width={560}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </>
      }
    >
      <div className="space-y-5">
        <fieldset>
          <legend className="mb-2 text-body-sm-strong text-text-primary">Authentication method</legend>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {METHODS.map((m) => (
              <Radio
                key={m.value}
                checked={method === m.value}
                disabled={!m.enabled}
                onChange={() => setMethod(m.value)}
                label={m.enabled ? METHOD_LABEL[m.value] : `${METHOD_LABEL[m.value]} (coming soon)`}
              />
            ))}
          </div>
        </fieldset>

        {method === 'basic' && (
          <div className="space-y-5">
            <Input
              label="Username"
              required
              hint="The service account IGA signs in as. Use a dedicated account, not a person's — a leaver should never break provisioning."
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

        {method === 'oauth2' && (
          <div className="space-y-5">
            <Tabs
              items={[
                { value: 'request', label: 'Request' },
                { value: 'response', label: 'Response' },
              ]}
              value={section}
              onChange={setSection}
            />

            {section === 'request' && (
              <div className="space-y-5">
                <Select
                  label="Grant type"
                  options={GRANT_TYPES.map((g) => ({ value: g.value, label: g.label }))}
                  value={oauth.grantType}
                  onChange={(v) => set('grantType', v as GrantType)}
                />
                <Input
                  label="Redirect URL"
                  hint="IGA's callback. Register this exact URL with the provider — a mismatch is rejected before any error you can read."
                  value={oauth.redirectUrl}
                  // IGA owns this URL — it is here to be copied, not edited.
                  InputProps={{ readOnly: true }}
                  endAdornment={
                    <button
                      type="button"
                      onClick={copyRedirect}
                      aria-label="Copy redirect URL"
                      className="rounded-md p-0.5 text-icon hover:bg-surface-hover"
                    >
                      <ContentCopyOutlined sx={{ fontSize: 18 }} />
                    </button>
                  }
                />
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
                <Input
                  label="Authorization endpoint"
                  required
                  hint="Where the user is sent to approve access."
                  placeholder="https://provider.com/oauth/authorize"
                  value={oauth.authorizationEndpoint}
                  onChange={(e) => set('authorizationEndpoint', e.target.value)}
                  error={required(oauth.authorizationEndpoint)}
                />
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
                  label="Scope"
                  required
                  hint="Space-separated. Ask for the least the connector needs — every extra scope is access IGA holds but does not use."
                  placeholder="users:read groups:write"
                  value={oauth.scope}
                  onChange={(e) => set('scope', e.target.value)}
                  error={required(oauth.scope)}
                />
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
                  label="Token type"
                  value={oauth.tokenType}
                  onChange={(e) => set('tokenType', e.target.value)}
                />
              </div>
            )}

            {section === 'response' && (
              <div className="space-y-5">
                <p className="text-body-sm text-text-secondary">
                  The keys IGA reads out of the provider&apos;s token response. The defaults follow the OAuth 2.0
                  spec — change them only when the provider answers with something else.
                </p>
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
              </div>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}
