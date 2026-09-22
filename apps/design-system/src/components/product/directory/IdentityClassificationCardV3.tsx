'use client';

import * as React from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import { Button, Input, Select, useToast } from '@ds/components';
import {
  CLASSIFICATION_OPERATORS,
  IDENTITY_TYPES,
  blankClassificationRule,
  getIdentityClassification,
  saveIdentityClassification,
  type ClassificationRule,
  type IdentityClassification,
} from '@/data/identity-classification';

/**
 * Identity classification — v3 (demo).
 *
 * Outcome-first, written as a sentence. Where v1/v2 present the setting as form controls,
 * v3 states what will happen to incoming identities and drops the inputs into that sentence:
 * "every identity … is classified as [type]", then readable exception clauses,
 * "If [field] [is] [value], classify it as [type]". The reader configures the rule by
 * reading it. Same data model and store as v1/v2.
 */
export function IdentityClassificationCardV3({
  applicationId,
  applicationName,
  onSaved,
}: {
  applicationId: string;
  applicationName: string;
  onSaved?: () => void;
}) {
  const toast = useToast();
  const [draft, setDraft] = React.useState<IdentityClassification>(() =>
    getIdentityClassification(applicationId),
  );
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    setDraft(getIdentityClassification(applicationId));
    setTouched(false);
  }, [applicationId]);

  const patch = (p: Partial<IdentityClassification>) => setDraft((d) => ({ ...d, ...p }));
  const updateRule = (id: string, p: Partial<ClassificationRule>) =>
    setDraft((d) => ({ ...d, rules: d.rules.map((r) => (r.id === id ? { ...r, ...p } : r)) }));
  const addRule = () =>
    setDraft((d) => ({ ...d, rules: [...d.rules, blankClassificationRule(d.rules.length)] }));
  const removeRule = (id: string) =>
    setDraft((d) => ({ ...d, rules: d.rules.filter((r) => r.id !== id) }));

  const sourceField = draft.classifyBasedOn.trim();
  const hasRules = draft.rules.length > 0;
  const rulesStarted = draft.rules.filter((r) => r.value.trim() !== '' || r.identityType !== '');
  const typeMissing = touched && draft.defaultIdentityType === '';
  const fieldMissing = touched && hasRules && sourceField === '';

  const typeOptions = IDENTITY_TYPES.map((t) => ({ value: t.value, label: t.label }));

  const save = () => {
    setTouched(true);
    if (draft.defaultIdentityType === '') return;
    if (rulesStarted.length > 0) {
      if (sourceField === '') return;
      if (rulesStarted.some((r) => r.value.trim() === '' || r.identityType === '')) return;
    }
    saveIdentityClassification({
      applicationId,
      defaultIdentityType: draft.defaultIdentityType,
      classifyBasedOn: rulesStarted.length > 0 ? sourceField : '',
      rules: rulesStarted,
    });
    toast.success('Identity classification saved.');
    onSaved?.();
  };

  const clause = 'flex flex-wrap items-center gap-x-2 gap-y-2';

  return (
    <div className="space-y-6">
      {/* The outcome, as a sentence with the type dropped into it. */}
      <div className={`${clause} text-body text-text-primary`}>
        <span>Every identity</span>
        <span className="font-emphasis">{applicationName}</span>
        <span>sends is classified as</span>
        <span className="w-48">
          <Select
            ariaLabel="Default identity type"
            options={typeOptions}
            value={draft.defaultIdentityType}
            onChange={(v) => patch({ defaultIdentityType: v as IdentityClassification['defaultIdentityType'] })}
            placeholder="a type…"
            required
            error={typeMissing ? 'Pick a type.' : undefined}
          />
        </span>
        <span>.</span>
      </div>

      {/* Exceptions, each read as a clause. */}
      <div className="space-y-3">
        <p className="text-body-sm text-text-secondary">
          {hasRules
            ? 'Except in these cases — checked top to bottom, the first that matches wins:'
            : 'Some applications send more than one kind of identity. Add an exception to classify those differently.'}
        </p>

        {hasRules && (
          <div className={`${clause} text-body-sm text-text-secondary`}>
            <span>Read the field</span>
            <span className="w-44">
              <Input
                aria-label="Application field"
                placeholder="e.g. userType"
                value={draft.classifyBasedOn}
                onChange={(e) => patch({ classifyBasedOn: e.target.value })}
                error={fieldMissing ? 'Required.' : undefined}
              />
            </span>
            <span>on each identity:</span>
          </div>
        )}

        {draft.rules.map((rule, index) => (
          <div key={rule.id} className={`${clause} text-body-sm text-text-primary`}>
            <span className="text-text-secondary">If it</span>
            <span className="w-28">
              <Select
                ariaLabel={`Exception ${index + 1} condition`}
                options={CLASSIFICATION_OPERATORS.map((o) => ({ value: o.value, label: o.label.toLowerCase() }))}
                value={rule.operator}
                onChange={(v) => updateRule(rule.id, { operator: v as ClassificationRule['operator'] })}
              />
            </span>
            <span className="w-40">
              <Input
                aria-label={`Exception ${index + 1} value`}
                placeholder="e.g. contractor"
                value={rule.value}
                onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                error={touched && rule.value.trim() === '' ? 'Required.' : undefined}
              />
            </span>
            <span className="text-text-secondary">, classify it as</span>
            <span className="w-44">
              <Select
                ariaLabel={`Exception ${index + 1} identity type`}
                options={typeOptions}
                value={rule.identityType}
                onChange={(v) => updateRule(rule.id, { identityType: v as ClassificationRule['identityType'] })}
                placeholder="a type…"
                error={touched && rule.identityType === '' ? 'Required.' : undefined}
              />
            </span>
            <button
              type="button"
              onClick={() => removeRule(rule.id)}
              aria-label={`Remove exception ${index + 1}`}
              className="shrink-0 rounded-md p-1.5 text-icon hover:bg-surface-hover hover:text-danger"
            >
              <DeleteOutline sx={{ fontSize: 18 }} />
            </button>
          </div>
        ))}

        <Button variant="secondary" size="sm" startIcon={<AddOutlined />} onClick={addRule}>
          Add exception
        </Button>
      </div>

      <Button onClick={save}>Save classification</Button>
    </div>
  );
}
