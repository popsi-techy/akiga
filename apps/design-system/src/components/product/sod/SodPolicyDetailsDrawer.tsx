'use client';

import * as React from 'react';
import BalanceOutlined from '@mui/icons-material/BalanceOutlined';
import { Button, Drawer, Input, Select, useToast } from '@ds/components';
import { createSodPolicy, updateSodPolicy, type SodPolicyRow } from '@/data/sod-policies';
import type { Severity } from '@/data/sod-types';
import { SEVERITY_META } from './policy-labels';

const SEVERITY_OPTIONS = (['critical', 'high', 'medium', 'low'] as Severity[]).map((s) => ({
  value: s,
  label: SEVERITY_META[s].label,
}));

/**
 * The three things a policy cannot exist without — name, description, severity.
 *
 * One drawer for creating and for editing, opened from wherever the reader
 * already is: the list, and the policy's own header menu. Editing used to send
 * them back to the list to find the row they had just come from, which is the
 * kind of round trip that reads as the product not knowing where you are.
 *
 * Owns its own save and toast; the caller decides what happens next, because
 * that differs — a new policy opens, an edited one just refreshes in place.
 */
export function SodPolicyDetailsDrawer({
  open,
  onClose,
  /** The policy being edited, or null to create a new one. */
  policy,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  policy: SodPolicyRow | null;
  onSaved: (result: { id: string; created: boolean }) => void;
}) {
  const toast = useToast();
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [severity, setSeverity] = React.useState<Severity>('high');

  // Load from the source of truth every time it opens, so a cancelled edit
  // leaves nothing behind for the next one to inherit.
  React.useEffect(() => {
    if (!open) return;
    setName(policy?.name ?? '');
    setDescription(policy?.description ?? '');
    setSeverity(policy?.severity ?? 'high');
  }, [open, policy]);

  const save = () => {
    if (name.trim() === '') return;
    if (policy) {
      updateSodPolicy(policy.id, { name, description, severity });
      toast.success('Policy details saved');
      onSaved({ id: policy.id, created: false });
      return;
    }
    const id = createSodPolicy({ name, description, severity });
    toast.success(`“${name.trim()}” created as a draft.`);
    onSaved({ id, created: true });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={policy ? 'Edit policy details' : 'New SoD policy'}
      subtitle={
        policy
          ? 'Name, description and severity. The ruleset is edited on the Ruleset tab.'
          : 'Name it and say how much a conflict matters. The ruleset comes next.'
      }
      icon={<BalanceOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={name.trim() === ''}>
            {policy ? 'Save changes' : 'Create policy'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Policy name"
          required
          hint="Shown wherever a conflict under this policy is reported. Name it after the duty it separates."
          placeholder="e.g. Payment initiation and approval"
          size="sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Description"
          hint="A reviewer reads this when deciding what to do about a conflict."
          placeholder="What this policy prevents, and why it matters"
          size="sm"
          multiline
          minRows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Select
          label="Severity"
          // `helperText`, not Input's tooltip `hint`: Select has no hint slot,
          // and this is a sentence the reader wants while choosing, not once.
          helperText="How much a conflict under this policy matters. Drives review priority and risk scoring."
          options={SEVERITY_OPTIONS}
          value={severity}
          onChange={(v) => setSeverity(v as Severity)}
        />
      </div>
    </Drawer>
  );
}
