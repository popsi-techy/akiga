'use client';

import * as React from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import PersonOutline from '@mui/icons-material/PersonOutline';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import { Button, Input, RadioCardGroup, Select, Tooltip, useToast } from '@ds/components';
import {
  CLASSIFICATION_OPERATORS,
  IDENTITY_TYPES,
  blankClassificationRule,
  getIdentityClassification,
  saveIdentityClassification,
  type ClassificationRule,
  type IdentityClassification,
} from '@/data/identity-classification';

type SourceMode = 'uniform' | 'mixed';

const MIXED_HINT =
  'Rules run top to bottom — the first match wins. When nothing matches, the fallback type is used.';

const inferMode = (d: IdentityClassification): SourceMode =>
  d.rules.length > 0 || d.classifyBasedOn.trim() !== '' ? 'mixed' : 'uniform';

/** Identity classification fields — render inside a plain Card from the parent section. */
export function IdentityClassificationCard({
  applicationId,
  onSaved,
}: {
  applicationId: string;
  onSaved?: () => void;
}) {
  const toast = useToast();
  const [draft, setDraft] = React.useState<IdentityClassification>(() =>
    getIdentityClassification(applicationId),
  );
  const [mode, setMode] = React.useState<SourceMode>(() =>
    inferMode(getIdentityClassification(applicationId)),
  );
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    const next = getIdentityClassification(applicationId);
    setDraft(next);
    setMode(inferMode(next));
    setTouched(false);
  }, [applicationId]);

  const patch = (p: Partial<IdentityClassification>) => setDraft((d) => ({ ...d, ...p }));

  const updateRule = (id: string, p: Partial<ClassificationRule>) =>
    patch({ rules: draft.rules.map((r) => (r.id === id ? { ...r, ...p } : r)) });

  const addRule = () => patch({ rules: [...draft.rules, blankClassificationRule(draft.rules.length)] });

  const removeRule = (id: string) => patch({ rules: draft.rules.filter((r) => r.id !== id) });

  const switchMode = (next: SourceMode) => {
    setMode(next);
    if (next === 'mixed' && draft.rules.length === 0) {
      patch({ rules: [blankClassificationRule(0)] });
    }
    if (next === 'uniform') {
      patch({ rules: [], classifyBasedOn: '' });
    }
  };

  const rulesStarted = draft.rules.filter((r) => r.value.trim() !== '' || r.identityType !== '');
  const rulesIncomplete =
    mode === 'mixed' &&
    (rulesStarted.length === 0 ||
      draft.classifyBasedOn.trim() === '' ||
      rulesStarted.some((r) => r.value.trim() === '' || r.identityType === ''));

  const typeMissing = touched && draft.defaultIdentityType === '';

  const save = () => {
    setTouched(true);
    if (draft.defaultIdentityType === '') return;
    if (rulesIncomplete) return;
    saveIdentityClassification({
      applicationId,
      defaultIdentityType: draft.defaultIdentityType,
      classifyBasedOn: mode === 'mixed' ? draft.classifyBasedOn.trim() : '',
      rules: mode === 'mixed' ? rulesStarted : [],
    });
    toast.success('Identity classification saved.');
    onSaved?.();
  };

  return (
    <>
      <p className="text-body-sm-strong text-text-primary">What does this source send?</p>
      <RadioCardGroup
        appearance="outlined"
        columns={2}
        ariaLabel="Source user types"
        value={mode}
        onChange={(v) => switchMode(v as SourceMode)}
        options={[
          {
            value: 'uniform',
            label: 'One identity type',
            description: 'Every user from this source is the same type.',
            icon: <PersonOutline sx={{ fontSize: 18 }} />,
          },
          {
            value: 'mixed',
            label: 'More than one type',
            description: 'Types vary — classify by a source field.',
            icon: <GroupsOutlined sx={{ fontSize: 18 }} />,
          },
        ]}
      />

      {mode === 'uniform' ? (
        <div className="mt-5 max-w-sm">
          <Select
            label="Identity type"
            options={IDENTITY_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            value={draft.defaultIdentityType}
            onChange={(v) => patch({ defaultIdentityType: v as IdentityClassification['defaultIdentityType'] })}
            placeholder="Select"
            required
            error={typeMissing ? 'Required.' : undefined}
          />
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Source field"
              placeholder="e.g. userType"
              value={draft.classifyBasedOn}
              onChange={(e) => patch({ classifyBasedOn: e.target.value })}
              error={touched && draft.classifyBasedOn.trim() === '' ? 'Required.' : undefined}
            />
            <Select
              label="Fallback type"
              options={IDENTITY_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              value={draft.defaultIdentityType}
              onChange={(v) => patch({ defaultIdentityType: v as IdentityClassification['defaultIdentityType'] })}
              placeholder="Select"
              required
              error={typeMissing ? 'Required.' : undefined}
              helperText="When no rule matches"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <span className="text-body-sm-strong text-text-primary">Rules</span>
              <Tooltip title={MIXED_HINT}>
                <span tabIndex={0} aria-label={MIXED_HINT} className="inline-flex shrink-0 text-icon-subtle">
                  <InfoOutlined sx={{ fontSize: 14 }} />
                </span>
              </Tooltip>
            </div>

            <div className="space-y-2">
              {draft.rules.map((rule, index) => (
                <div
                  key={rule.id}
                  className="grid grid-cols-[120px_minmax(0,1fr)_auto_minmax(0,1fr)_36px] items-start gap-2 rounded-md border border-border bg-canvas px-2 py-2.5 sm:border-0 sm:bg-transparent sm:p-0"
                >
                  <Select
                    ariaLabel={`Rule ${index + 1} condition`}
                    options={CLASSIFICATION_OPERATORS.map((o) => ({ value: o.value, label: o.label }))}
                    value={rule.operator}
                    onChange={(v) => updateRule(rule.id, { operator: v as ClassificationRule['operator'] })}
                  />
                  <Input
                    aria-label={`Rule ${index + 1} value`}
                    placeholder="e.g. contractor"
                    value={rule.value}
                    onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                    error={touched && rule.value.trim() === '' ? 'Required.' : undefined}
                  />
                  <span className="hidden pt-2 text-body-sm text-text-tertiary sm:inline" aria-hidden>
                    →
                  </span>
                  <Select
                    ariaLabel={`Rule ${index + 1} identity type`}
                    placeholder="Identity type"
                    options={IDENTITY_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                    value={rule.identityType}
                    onChange={(v) =>
                      updateRule(rule.id, { identityType: v as ClassificationRule['identityType'] })
                    }
                    error={touched && rule.identityType === '' ? 'Required.' : undefined}
                  />
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => removeRule(rule.id)}
                      aria-label={`Remove rule ${index + 1}`}
                      disabled={draft.rules.length === 1}
                      className="rounded-md p-1.5 text-icon hover:bg-surface-hover hover:text-danger disabled:opacity-40"
                    >
                      <DeleteOutline sx={{ fontSize: 18 }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="secondary" size="sm" startIcon={<AddOutlined />} className="mt-3" onClick={addRule}>
              Add rule
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end border-t border-border pt-4">
        <Button onClick={save}>Save classification</Button>
      </div>
    </>
  );
}
