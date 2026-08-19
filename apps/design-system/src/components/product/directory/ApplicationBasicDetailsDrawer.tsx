'use client';

import * as React from 'react';
import { AppIcon, Button, Drawer, Input } from '@ds/components';
import { updateApplicationBasics, type OnboardedApplication } from '@/data/applications-store';

/** Short name for the drawer title — Google Workspace reads as Google. */
function onboardAppLabel(name: string): string {
  if (name === 'Google Workspace') return 'Google';
  return name.replace(/ Application$/, '');
}

export function ApplicationBasicDetailsDrawer({
  open,
  app,
  onClose,
  onSaved,
}: {
  open: boolean;
  app: OnboardedApplication;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = React.useState(app.name);
  const [description, setDescription] = React.useState(app.description);

  React.useEffect(() => {
    if (open) {
      setName(app.name);
      setDescription(app.description);
    }
  }, [open, app.name, app.description]);

  const valid = name.trim() !== '' && description.trim() !== '';

  const save = () => {
    if (!valid) return;
    updateApplicationBasics(app.id, { name, description });
    onSaved();
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      leading={<AppIcon app={app.appType} size={44} variant="subtle" />}
      title={`Onboard ${onboardAppLabel(app.appType)} Application`}
      subtitle="Name it and set how IGA manages access."
      width={520}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!valid}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Input
          label="Application Name"
          required
          hint="Shown everywhere in IGA. Two applications of the same type are told apart by this name."
          placeholder="Enter Application Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Description"
          required
          size="sm"
          multiline
          minRows={3}
          hint="Shown on the application profile and in lists — what this instance is for."
          placeholder="What this application is for"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
    </Drawer>
  );
}
