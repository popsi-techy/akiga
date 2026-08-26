'use client';

import * as React from 'react';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import { Button, Drawer, Input, useToast } from '@ds/components';
import {
  createEntitlementType,
  entitlementTypeNameTaken,
  getEntitlementType,
  normalizeEntitlementTypeName,
  updateEntitlementType,
} from '@/data/entitlement-types';

export function EntitlementTypeDrawer({
  open,
  typeId,
  onClose,
  onSaved,
}: {
  open: boolean;
  typeId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const editing = typeId !== null;
  const [name, setName] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const [missing, setMissing] = React.useState(false);
  const savingRef = React.useRef(false);

  React.useEffect(() => {
    if (!open) return;
    setSubmitted(false);
    setMissing(false);
    savingRef.current = false;
    if (!typeId) {
      setName('');
      return;
    }
    const existing = getEntitlementType(typeId);
    if (!existing) {
      setMissing(true);
      return;
    }
    setName(existing.name);
  }, [open, typeId]);

  const trimmed = normalizeEntitlementTypeName(name);
  const taken = Boolean(trimmed) && entitlementTypeNameTaken(trimmed, typeId ?? undefined);
  const canSave = Boolean(trimmed) && !taken;

  const save = () => {
    setSubmitted(true);
    if (!canSave || savingRef.current) return;
    savingRef.current = true;
    if (editing && typeId) {
      const updated = updateEntitlementType(typeId, { name: trimmed });
      if (!updated) {
        savingRef.current = false;
        return;
      }
      toast.success('Entitlement type saved');
    } else {
      const created = createEntitlementType({ name: trimmed });
      if (!created) {
        savingRef.current = false;
        return;
      }
      toast.success('Entitlement type created');
    }
    onSaved();
    // Close on the next tick so this click cannot land on Add behind the drawer.
    window.setTimeout(onClose, 0);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={480}
      title={editing ? 'Edit Entitlement Type' : 'Add New Entitlement Type'}
      subtitle={
        editing
          ? 'Change this type. Existing entitlements keep the previous name until the next sync.'
          : 'Create a new entitlement type that will be available for assignment throughout your IGA system'
      }
      icon={<ShieldOutlined sx={{ fontSize: 22 }} />}
      footer={
        missing ? (
          <Button onClick={onClose}>Close</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                save();
              }}
              disabled={submitted && !canSave}
            >
              {editing ? 'Save' : 'Add Entitlement Type'}
            </Button>
          </>
        )
      }
    >
      {missing ? (
        <p className="text-body-sm text-text-secondary">
          This entitlement type was removed, or the link is out of date.
        </p>
      ) : (
        <Input
          label="Entitlement Type Name"
          required
          placeholder="Enter entitlement type name"
          value={name}
          error={
            submitted && !trimmed
              ? 'Enter an entitlement type name.'
              : submitted && taken
                ? 'This entitlement type name is already in use.'
                : undefined
          }
          onChange={(e) => setName(e.target.value)}
        />
      )}
    </Drawer>
  );
}
