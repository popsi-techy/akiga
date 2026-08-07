'use client';

import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import RuleOutlined from '@mui/icons-material/RuleOutlined';
import { Drawer, Button, Select, Input } from '@ds/components';
import {
  type EligibilityGroup,
  type EligibilityCondition,
  type EligibilityAttribute,
  emptyEligibilityGroup,
  newEligibilityCondition,
  isEligibilityGroupValid,
  eligibilityAttributeSelectOptions,
  valuesForEligibilityAttribute,
} from '@/data/eligibility-criteria';

const EQUALS_OPTIONS = [{ value: 'equals', label: 'Equals (=)' }];

function ConditionRow({
  condition,
  onChange,
  onRemove,
  canRemove,
}: {
  condition: EligibilityCondition;
  onChange: (next: EligibilityCondition) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const attrOptions = eligibilityAttributeSelectOptions();
  const valueOptions = valuesForEligibilityAttribute(condition.attribute);

  return (
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-[1.2]">
        <Select
          options={attrOptions}
          value={condition.attribute ?? ''}
          placeholder="Select attribute"
          onChange={(v) => {
            if (v.startsWith('__section_')) return;
            onChange({ ...condition, attribute: v as EligibilityAttribute, value: undefined });
          }}
        />
      </div>
      <div className="w-[120px] shrink-0">
        <Select options={EQUALS_OPTIONS} value="equals" onChange={() => undefined} disabled />
      </div>
      <div className="min-w-0 flex-1">
        <Select
          options={valueOptions}
          value={condition.value ?? ''}
          placeholder="Select value"
          onChange={(v) => onChange({ ...condition, value: v })}
          disabled={!condition.attribute}
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label="Remove condition"
        className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-md text-icon transition-colors hover:bg-surface-hover hover:text-danger disabled:pointer-events-none disabled:opacity-40"
      >
        <DeleteOutline sx={{ fontSize: 18 }} />
      </button>
    </div>
  );
}

export interface EligibilityCriteriaDrawerProps {
  open: boolean;
  onClose: () => void;
  /** When null, drawer starts a new empty group. */
  group: EligibilityGroup | null;
  /** Used for default name "Group N" when creating. */
  nextGroupNumber: number;
  onApply: (group: EligibilityGroup) => void;
}

export function EligibilityCriteriaDrawer({
  open,
  onClose,
  group,
  nextGroupNumber,
  onApply,
}: EligibilityCriteriaDrawerProps) {
  const [working, setWorking] = React.useState<EligibilityGroup>(emptyEligibilityGroup());
  const isEdit = Boolean(group);

  React.useEffect(() => {
    if (!open) return;
    if (group) {
      setWorking({
        ...group,
        name: group.name?.trim() || `Group ${nextGroupNumber}`,
        conditions: group.conditions.map((c) => ({ ...c })),
      });
    } else {
      setWorking(emptyEligibilityGroup(`Group ${nextGroupNumber}`));
    }
  }, [open, group, nextGroupNumber]);

  const valid = isEligibilityGroupValid(working);
  const updateCondition = (id: string, next: EligibilityCondition) =>
    setWorking((w) => ({ ...w, conditions: w.conditions.map((c) => (c.id === id ? next : c)) }));
  const removeCondition = (id: string) =>
    setWorking((w) => ({
      ...w,
      conditions: w.conditions.length <= 1 ? w.conditions : w.conditions.filter((c) => c.id !== id),
    }));
  const addCondition = () =>
    setWorking((w) => ({ ...w, conditions: [...w.conditions, newEligibilityCondition()] }));

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Eligibility Group' : 'Create Eligibility Group'}
      subtitle="Define who can request this emergency profile."
      icon={<RuleOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
      width={720}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              onApply({ ...working, name: working.name.trim() });
              onClose();
            }}
          >
            Apply
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Input
          label="Group name"
          size="sm"
          value={working.name}
          placeholder={`Group ${nextGroupNumber}`}
          onChange={(e) => setWorking((w) => ({ ...w, name: e.target.value }))}
        />

        <div className="space-y-3">
          <p className="text-caption text-text-secondary">All conditions in this group must match (AND).</p>
          <div className="space-y-2">
            {working.conditions.map((c) => (
              <ConditionRow
                key={c.id}
                condition={c}
                onChange={(next) => updateCondition(c.id, next)}
                onRemove={() => removeCondition(c.id)}
                canRemove={working.conditions.length > 1}
              />
            ))}
          </div>
          <Button variant="secondary" size="sm" startIcon={<AddIcon />} onClick={addCondition}>
            Add condition
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

export default EligibilityCriteriaDrawer;
