'use client';

import * as React from 'react';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { AppIcon, Button, Drawer, Input, Switch, Tooltip } from '@ds/components';
import type { AppTypeOption } from '@/data/app-types';
import { onboardApplication } from '@/data/applications-store';
import { suggestedApplicationName } from '@/data/directory';

/** Short name for “Onboard {name} Application” — Google Workspace reads as Google. */
function onboardAppLabel(name: string): string {
  if (name === 'Google Workspace') return 'Google';
  return name.replace(/ Application$/, '');
}

/**
 * Add Application — the second half of onboarding.
 *
 * The type was chosen on the catalog behind this drawer; everything here is the
 * instance: what to call it, and how IGA should treat it. The type itself is
 * not editable here, which is why it is stated in the subtitle rather than
 * offered as a field.
 */
export function AddApplicationDrawer({
  open,
  appType,
  onClose,
  onCreated,
}: {
  open: boolean;
  /** The type picked in the catalog. Null while the drawer is closing. */
  appType: AppTypeOption | null;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [accessUrl, setAccessUrl] = React.useState('');
  const [enableProvisioning, setEnableProvisioning] = React.useState(false);
  const [identitySource, setIdentitySource] = React.useState(false);
  const [requestable, setRequestable] = React.useState(false);
  const [allEntitlements, setAllEntitlements] = React.useState(false);
  const [touched, setTouched] = React.useState(false);

  // Reopening for a different type must not inherit the last one's answers.
  React.useEffect(() => {
    if (!open) return;
    setName(appType ? suggestedApplicationName(appType.name) : '');
    setDescription('');
    setAccessUrl('');
    setEnableProvisioning(false);
    setIdentitySource(false);
    setRequestable(false);
    setAllEntitlements(false);
    setTouched(false);
  }, [open, appType?.id]);

  const trimmed = name.trim();
  const nameError = touched && !trimmed ? 'Application name is required.' : undefined;

  const save = () => {
    setTouched(true);
    if (!trimmed || !appType) return;
    const app = onboardApplication({
      name: trimmed,
      description,
      accessUrl,
      enableProvisioning,
      identitySource,
      requestable,
      allEntitlementsRequestable: requestable && allEntitlements,
      appTypeId: appType.id,
      appType: appType.name,
      appTypeCategory: appType.category,
    });
    onCreated(app.id);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      leading={appType ? <AppIcon app={appType.name} size={44} variant="subtle" /> : undefined}
      title={appType ? `Onboard ${onboardAppLabel(appType.name)} Application` : 'Onboard Application'}
      subtitle="Name it and set how IGA manages access."
      width={520}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Continue</Button>
        </>
      }
    >
      <div className="space-y-5">
        <Input
          label="Application Name"
          required
          hint="Pre-filled from the type. Change it if this instance needs a different name."
          placeholder="Enter Application Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameError}
        />
        <Input
          label="Description"
          hint="Shown on the application profile and in lists — what this instance is for."
          placeholder="What this application is for"
          size="sm"
          multiline
          minRows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="space-y-3">
          <ToggleRow
            label="Enable Provisioning"
            hint="Push access changes back to the application, instead of only reading from it."
            checked={enableProvisioning}
            onChange={setEnableProvisioning}
          />
          <ToggleRow
            label="Mark as Identity Source"
            hint="Treat this application's accounts as authoritative identities for the organisation."
            checked={identitySource}
            onChange={setIdentitySource}
          />
          <ToggleRow
            label="Mark as Requestable"
            hint="Let users request access to this application from the access catalog."
            checked={requestable}
            onChange={(v) => {
              setRequestable(v);
              // The child claim cannot outlive its parent: entitlements of an
              // application nobody can request are not requestable either.
              if (!v) setAllEntitlements(false);
            }}
          />
          <ToggleRow
            label="Make all entitlements requestable"
            hint="Every entitlement becomes requestable at once, instead of opening them one by one."
            checked={allEntitlements}
            onChange={setAllEntitlements}
            disabled={!requestable}
          />
        </div>

        <Input
          label="Application Access URL"
          hint="Where users are sent when they open this application from IGA."
          placeholder="https://app.example.com"
          value={accessUrl}
          onChange={(e) => setAccessUrl(e.target.value)}
        />
      </div>
    </Drawer>
  );
}

/**
 * A setting on a sunken row rather than a bare checkbox line: these four are
 * decisions about the application, not fields of the form above them, and the
 * fill is what separates the two groups without a heading.
 */
function ToggleRow({
  label,
  hint,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const id = React.useId();
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg bg-subtle px-4 py-3.5 ${
        disabled ? 'opacity-60' : ''
      }`}
    >
      <label htmlFor={id} className="flex items-center gap-1.5 text-body-sm-strong text-text-primary">
        {label}
        <Tooltip title={hint}>
          <span tabIndex={0} aria-label={hint} className="inline-flex shrink-0 text-icon-subtle">
            <InfoOutlined sx={{ fontSize: 15 }} />
          </span>
        </Tooltip>
      </label>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        inputProps={{ 'aria-label': label }}
      />
    </div>
  );
}
