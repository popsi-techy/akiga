'use client';

import * as React from 'react';
import PersonOutline from '@mui/icons-material/PersonOutline';
import PeopleOutline from '@mui/icons-material/PeopleOutline';
import { Button, Card, RadioCardGroup, useToast } from '@ds/components';
import { TableSelectDrawer } from '@/components/product/automation/TableSelectDrawer';
import { IdentityDetailsBody } from '@/components/product/directory';
import type { AccessRequest, BeneficiaryKind } from '@/data/access-request-types';
import { CURRENT_END_USER, updateAccessRequest } from '@/data/access-requests';
import { getUserIdentity, listUserIdentities } from '@/data/directory';

export function ForWhomStep({
  request,
  onChange,
}: {
  request: AccessRequest;
  onChange: (next: AccessRequest) => void;
}) {
  const toast = useToast();
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const kind: BeneficiaryKind = request.beneficiaryKind ?? 'self';
  const other =
    kind === 'other' && request.requestedForId !== CURRENT_END_USER.id
      ? getUserIdentity(request.requestedForId)
      : undefined;

  const applySelf = () => {
    const next = updateAccessRequest(request.id, {
      beneficiaryKind: 'self',
      requestedForId: CURRENT_END_USER.id,
      requestedForName: CURRENT_END_USER.name,
      requestedForEmail: CURRENT_END_USER.email,
      requestedForTitle: CURRENT_END_USER.title,
    });
    if (next) onChange(next);
  };

  const applyOther = () => {
    if (kind === 'other') return;
    const next = updateAccessRequest(request.id, { beneficiaryKind: 'other' });
    if (next) onChange(next);
  };

  const applyUser = (id: string) => {
    const user = getUserIdentity(id);
    if (!user) {
      toast.error('That identity is no longer in the directory.');
      return;
    }
    const next = updateAccessRequest(request.id, {
      beneficiaryKind: 'other',
      requestedForId: user.id,
      requestedForName: user.name,
      requestedForEmail: user.email,
      requestedForTitle: user.jobTitle,
    });
    if (next) onChange(next);
    setPickerOpen(false);
  };

  const people = listUserIdentities();

  return (
    <div className="mx-auto max-w-3xl py-6">
      <div className="mb-6 text-center">
        <h2 className="text-h3 text-text-primary">Who are you requesting for?</h2>
        <p className="mt-1 text-body text-text-secondary">
          Choose whether you are requesting access for yourself or on behalf of another user.
        </p>
      </div>

      <RadioCardGroup
        appearance="outlined"
        ariaLabel="Request beneficiary"
        value={kind}
        onChange={(v) => (v === 'self' ? applySelf() : applyOther())}
        options={[
          {
            value: 'self',
            label: 'For Myself',
            description: 'Request access to applications and permissions for your own account.',
            icon: <PersonOutline sx={{ fontSize: 18 }} />,
          },
          {
            value: 'other',
            label: 'For Someone Else',
            description: 'Raise an access request on behalf of another user in your organization.',
            icon: <PeopleOutline sx={{ fontSize: 18 }} />,
          },
        ]}
      />

      {kind === 'other' && (
        <div className="mt-5">
          {other ? (
            <Card
              title="Add User for whom you want to request the access for"
              subtitle="I am requesting access for someone else."
              action={
                <Button variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>
                  Edit User
                </Button>
              }
            >
              <IdentityDetailsBody identity={other} surface="bare" />
            </Card>
          ) : (
            <Card title="Choose who this request is for" subtitle="Pick a person from the directory.">
              <Button variant="secondary" onClick={() => setPickerOpen(true)}>
                Select user
              </Button>
            </Card>
          )}
        </div>
      )}

      <TableSelectDrawer
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Select user"
        subtitle="Choose the person you are requesting access for."
        nameHeader="Name"
        descriptionHeader="Email"
        entity="user"
        selectionMode="single"
        confirmLabel="Select"
        showRisk={false}
        selectedIds={other ? [other.id] : []}
        rows={people.map((p) => ({ id: p.id, name: p.name, description: p.email }))}
        onApply={(ids) => {
          const id = ids[0];
          if (id) applyUser(id);
        }}
      />
    </div>
  );
}
