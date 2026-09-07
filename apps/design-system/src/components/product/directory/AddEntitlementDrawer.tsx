'use client';

import * as React from 'react';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { Button, Drawer, Input, Select, Switch, Tooltip } from '@ds/components';
import { createEntitlement, type CreateEntitlementInput } from '@/data/entitlements-store';
import { listEntitlementTypes } from '@/data/entitlement-types';
import { listApplications } from '@/data/directory';
import { RiskScoreChip } from './RiskScoreChip';

function FieldHint({ text }: { text: string }) {
  return (
    <Tooltip title={text}>
      <span className="inline-flex text-icon">
        <InfoOutlined sx={{ fontSize: 16 }} aria-hidden />
      </span>
    </Tooltip>
  );
}

export function AddEntitlementDrawer({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = React.useState('');
  const [value, setValue] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [entitlementTypeId, setEntitlementTypeId] = React.useState('');
  const [risk, setRisk] = React.useState('1');
  const [requestable, setRequestable] = React.useState(false);
  const [applicationId, setApplicationId] = React.useState('');
  const [touched, setTouched] = React.useState(false);

  const apps = React.useMemo(() => listApplications(), [open]);
  const types = React.useMemo(() => listEntitlementTypes(), [open]);

  React.useEffect(() => {
    if (!open) return;
    setName('');
    setValue('');
    setDescription('');
    setEntitlementTypeId('');
    setRisk('1');
    setRequestable(false);
    setApplicationId('');
    setTouched(false);
  }, [open]);

  const trimmedName = name.trim();
  const trimmedValue = value.trim();
  const trimmedDescription = description.trim();
  const riskNum = Number.parseInt(risk, 10);
  const riskValid = Number.isFinite(riskNum) && riskNum >= 0 && riskNum <= 100;

  const nameError = touched && !trimmedName ? 'Entitlement name is required.' : undefined;
  const valueError = touched && !trimmedValue ? 'Value is required.' : undefined;
  const descriptionError = touched && !trimmedDescription ? 'Description is required.' : undefined;
  const typeError = touched && !entitlementTypeId ? 'Select an entitlement type.' : undefined;
  const appError = touched && !applicationId ? 'Select an application.' : undefined;
  const riskError = touched && !riskValid ? 'Enter a risk score from 0 to 100.' : undefined;

  const save = () => {
    setTouched(true);
    if (!trimmedName || !trimmedValue || !trimmedDescription || !entitlementTypeId || !applicationId || !riskValid) {
      return;
    }
    const input: CreateEntitlementInput = {
      name: trimmedName,
      value: trimmedValue,
      description: trimmedDescription,
      entitlementTypeId,
      risk: riskNum,
      requestable,
      applicationId,
    };
    const created = createEntitlement(input);
    onCreated(created.id);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      icon={<ShieldOutlined sx={{ fontSize: 22 }} />}
      title="Add Entitlement"
      subtitle="Create a new entitlement that defines access within this application."
      width={520}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Create Entitlement</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <Input
            label="Entitlement Name"
            required
            placeholder="e.g entitlement_Name"
            value={name}
            // `maxLength` is a native input attribute, not a TextField prop — it has to
            // go through `inputProps` to reach the element, which is also why the counter
            // below it was the only thing enforcing the limit.
            inputProps={{ maxLength: 100 }}
            onChange={(e) => setName(e.target.value)}
            error={nameError}
          />
          <p className="mt-1 text-right text-caption text-text-tertiary tabular-nums">{name.length}/100</p>
        </div>

        <Input
          label="Value"
          hint="The technical value stored in the target application."
          required
          placeholder="Enter Value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          error={valueError}
        />

        <Input
          label="Description"
          required
          placeholder="Describe what this entitlement provides access to"
          multiline
          minRows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={descriptionError}
        />

        <Select
          label="Entitlement Type"
          required
          placeholder="Select an option"
          value={entitlementTypeId}
          onChange={setEntitlementTypeId}
          error={typeError}
          helperText="The category of access this entitlement represents."
          options={types.map((t) => ({ value: t.id, label: t.name }))}
        />

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-body-sm-strong text-text-primary">
            Risk Score
            <span aria-hidden className="text-danger">
              {' '}
              *
            </span>
            <FieldHint text="0 is lowest risk; 100 is critical." />
          </label>
          <div className="flex items-center gap-3">
            <div className="w-24">
              <Input
                aria-label="Risk score"
                type="number"
                inputProps={{ min: 0, max: 100 }}
                value={risk}
                onChange={(e) => setRisk(e.target.value)}
                error={riskError}
              />
            </div>
            {riskValid && <RiskScoreChip score={riskNum} showLabel />}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-md border border-border px-4 py-3">
          <span className="inline-flex items-center gap-1.5 text-body-sm-strong text-text-primary">
            Requestable
            <FieldHint text="When on, end users can request this entitlement through the portal." />
          </span>
          <Switch
            checked={requestable}
            onChange={(_, checked) => setRequestable(checked)}
            aria-label="Requestable"
          />
        </div>

        <Select
          label="Application"
          required
          placeholder="Select Application"
          value={applicationId}
          onChange={setApplicationId}
          error={appError}
          helperText="The application this entitlement belongs to."
          options={apps.map((a) => ({ value: a.id, label: a.name }))}
        />
      </div>
    </Drawer>
  );
}
