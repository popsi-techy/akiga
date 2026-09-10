'use client';

import * as React from 'react';
import PersonOutline from '@mui/icons-material/PersonOutline';
import { Button, Drawer, Input, Select } from '@ds/components';
import { createAppAccount } from '@/data/app-accounts-store';
import { listUserIdentities } from '@/data/directory';

export function AddAppAccountDrawer({
  open,
  applicationId,
  applicationName,
  onClose,
  onCreated,
}: {
  open: boolean;
  applicationId: string;
  applicationName: string;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [accountName, setAccountName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [identityId, setIdentityId] = React.useState('');
  const [touched, setTouched] = React.useState(false);

  const people = React.useMemo(() => listUserIdentities(), [open]);

  React.useEffect(() => {
    if (!open) return;
    setAccountName('');
    setEmail('');
    setIdentityId('');
    setTouched(false);
  }, [open]);

  const trimmedName = accountName.trim();
  const nameError = touched && !trimmedName ? 'Account name is required.' : undefined;

  const save = () => {
    setTouched(true);
    if (!trimmedName) return;
    const created = createAppAccount({
      accountName: trimmedName,
      email: email.trim(),
      applicationId,
      identityId: identityId || null,
    });
    onCreated(created.id);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      icon={<PersonOutline sx={{ fontSize: 22 }} />}
      title="Add App Account"
      subtitle={`Create an account in ${applicationName}. Leave the owner empty to record an orphan.`}
      width={520}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Create App Account</Button>
        </>
      }
    >
      <div className="space-y-5">
        <Input
          label="Account Name"
          required
          placeholder="e.g. jane.doe"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          error={nameError}
        />
        <Input
          label="Email"
          placeholder="jane.doe@acme.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Select
          label="Owner (User Identity)"
          placeholder="None — create as orphan"
          value={identityId}
          onChange={setIdentityId}
          helperText="The workforce identity this login belongs to."
          options={people.map((p) => ({ value: p.id, label: p.email ? `${p.name} · ${p.email}` : p.name }))}
        />
      </div>
    </Drawer>
  );
}
