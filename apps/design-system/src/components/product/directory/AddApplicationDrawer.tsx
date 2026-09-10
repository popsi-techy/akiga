'use client';

import * as React from 'react';
import { AppIcon, Button, Drawer, Input } from '@ds/components';
import type { AppTypeOption } from '@/data/app-types';
import { onboardApplication } from '@/data/applications-store';
import { suggestedApplicationName } from '@/data/directory';
import { ApplicationUseCasesFields } from './ApplicationUseCasesFields';

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
        <Input
          label="Application Access URL"
          hint="Where users are sent when they open this application from IGA."
          placeholder="https://app.example.com"
          value={accessUrl}
          onChange={(e) => setAccessUrl(e.target.value)}
        />

        <ApplicationUseCasesFields
          enableProvisioning={enableProvisioning}
          onEnableProvisioning={setEnableProvisioning}
          identitySource={identitySource}
          onIdentitySource={setIdentitySource}
          requestable={requestable}
          onRequestable={(on) => {
            setRequestable(on);
            if (!on) setAllEntitlements(false);
          }}
          allEntitlements={allEntitlements}
          onAllEntitlements={setAllEntitlements}
        />
      </div>
    </Drawer>
  );
}
