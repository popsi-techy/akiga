'use client';

import * as React from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import PersonOutline from '@mui/icons-material/PersonOutline';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import {
  Button,
  Drawer,
  Input,
  RadioCardGroup,
  Select,
  SettingsRow,
  SettingsStack,
  StatusChip,
  useToast,
} from '@ds/components';
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
  const [rulesOpen, setRulesOpen] = React.useState(false);
  const [rulesTouched, setRulesTouched] = React.useState(false);
  const rulesSnapshot = React.useRef<Pick<IdentityClassification, 'classifyBasedOn' | 'rules'>>({
    classifyBasedOn: '',
    rules: [],
  });

  React.useEffect(() => {
    const next = getIdentityClassification(applicationId);
    setDraft(next);
    setMode(inferMode(next));
    setTouched(false);
  }, [applicationId]);

  const patch = (p: Partial<IdentityClassification>) => setDraft((d) => ({ ...d, ...p }));

  const updateRule = (id: string, p: Partial<ClassificationRule>) =>
    setDraft((d) => ({ ...d, rules: d.rules.map((r) => (r.id === id ? { ...r, ...p } : r)) }));

  const addRule = () =>
    setDraft((d) => ({ ...d, rules: [...d.rules, blankClassificationRule(d.rules.length)] }));

  const removeRule = (id: string) =>
    setDraft((d) => ({ ...d, rules: d.rules.filter((r) => r.id !== id) }));

  const switchMode = (next: SourceMode) => {
    setMode(next);
    if (next === 'mixed' && draft.rules.length === 0) {
      patch({ rules: [blankClassificationRule(0)] });
    }
    if (next === 'uniform') {
      patch({ rules: [], classifyBasedOn: '' });
    }
  };

  const sourceField = draft.classifyBasedOn.trim();
  const rulesHint =
    sourceField === ''
      ? 'Checked top to bottom — the first match decides the type.'
      : `Checked top to bottom against ${sourceField} — the first match decides the type.`;

  const rulesStarted = draft.rules.filter((r) => r.value.trim() !== '' || r.identityType !== '');
  const rulesIncomplete =
    rulesStarted.length === 0 ||
    sourceField === '' ||
    rulesStarted.some((r) => r.value.trim() === '' || r.identityType === '');
  const rulesConfigured = !rulesIncomplete;

  const typeMissing = touched && draft.defaultIdentityType === '';

  const snapshotRules = (rules: ClassificationRule[]) =>
    rules.map((r) => ({ ...r }));

  const openRules = () => {
    const nextRules = draft.rules.length === 0 ? [blankClassificationRule(0)] : draft.rules;
    if (draft.rules.length === 0) patch({ rules: nextRules });
    rulesSnapshot.current = {
      classifyBasedOn: draft.classifyBasedOn,
      rules: snapshotRules(nextRules),
    };
    setRulesTouched(false);
    setRulesOpen(true);
  };

  const closeRules = () => {
    patch({
      classifyBasedOn: rulesSnapshot.current.classifyBasedOn,
      rules: snapshotRules(rulesSnapshot.current.rules),
    });
    setRulesOpen(false);
  };

  const saveRules = () => {
    setRulesTouched(true);
    if (rulesIncomplete) return;
    const classifyBasedOn = draft.classifyBasedOn.trim();
    patch({ classifyBasedOn, rules: rulesStarted });
    saveIdentityClassification({
      applicationId,
      defaultIdentityType: draft.defaultIdentityType,
      classifyBasedOn,
      rules: rulesStarted,
    });
    setRulesOpen(false);
    toast.success('Rules saved.');
    onSaved?.();
  };

  const save = () => {
    setTouched(true);
    if (draft.defaultIdentityType === '') return;
    saveIdentityClassification({
      applicationId,
      defaultIdentityType: draft.defaultIdentityType,
      classifyBasedOn: mode === 'mixed' ? draft.classifyBasedOn.trim() : '',
      rules: mode === 'mixed' ? (rulesStarted.length > 0 ? rulesStarted : draft.rules) : [],
    });
    toast.success('Identity classification saved.');
    onSaved?.();
  };

  return (
    <>
      <p className="mb-3 text-body-sm-strong text-text-primary">What identity types does this application send?</p>
      <RadioCardGroup
        appearance="outlined"
        columns={2}
        ariaLabel="Application identity types"
        value={mode}
        onChange={(v) => switchMode(v as SourceMode)}
        options={[
          {
            value: 'uniform',
            label: 'One identity type',
            description: 'All users share the same identity type.',
            icon: <PersonOutline sx={{ fontSize: 18 }} />,
          },
          {
            value: 'mixed',
            label: 'More than one type',
            description: 'Classify each identity using an application field.',
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
          <SettingsStack>
            <SettingsRow
              surface="subtle"
              title="Classification rules"
              description="Use an application field to assign each identity a type."
              hint="Rules are checked top to bottom — the first match decides the type."
            >
              <StatusChip
                intent={rulesConfigured ? 'success' : 'warning'}
                label={`${rulesStarted.length} ${rulesStarted.length === 1 ? 'rule' : 'rules'} added`}
              />
              <Button
                variant="secondary"
                size="xs"
                aria-label={rulesConfigured ? 'Edit rules' : 'Configure rules'}
                onClick={openRules}
              >
                {rulesConfigured ? 'Edit rules' : 'Configure rules'}
              </Button>
            </SettingsRow>
          </SettingsStack>
          <div className="max-w-sm">
            <Select
              label="Fallback type"
              hint="Used when no rule matches"
              options={IDENTITY_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              value={draft.defaultIdentityType}
              onChange={(v) =>
                patch({ defaultIdentityType: v as IdentityClassification['defaultIdentityType'] })
              }
              placeholder="Select"
              required
              error={typeMissing ? 'Required.' : undefined}
            />
          </div>
        </div>
      )}

      <div className="mt-5">
        <Button onClick={save}>Save classification</Button>
      </div>

      <Drawer
        open={rulesOpen}
        onClose={closeRules}
        icon={<TuneOutlined sx={{ fontSize: 22 }} />}
        title="Classification rules"
        subtitle="Rules run against an application field — the first match decides the type."
        width={560}
        footer={
          <>
            <Button variant="secondary" onClick={closeRules}>
              Cancel
            </Button>
            <Button onClick={saveRules}>Save rules</Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input
            label="Application field"
            hint={rulesHint}
            placeholder="e.g. userType"
            required
            value={draft.classifyBasedOn}
            onChange={(e) => patch({ classifyBasedOn: e.target.value })}
            error={rulesTouched && sourceField === '' ? 'Required.' : undefined}
          />

          <div>
            <p className="mb-1.5 text-body-sm-strong text-text-primary">Rules</p>
            <div className="space-y-3">
              {draft.rules.map((rule, index) => (
                <div key={rule.id} className="flex flex-col gap-2 rounded-md bg-subtle px-3 py-3">
                  <div className="flex items-start gap-2">
                    <div className="w-28 shrink-0">
                      <Select
                        ariaLabel={`Rule ${index + 1} condition`}
                        options={CLASSIFICATION_OPERATORS.map((o) => ({ value: o.value, label: o.label }))}
                        value={rule.operator}
                        onChange={(v) => updateRule(rule.id, { operator: v as ClassificationRule['operator'] })}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Input
                        aria-label={`Rule ${index + 1} value`}
                        placeholder="e.g. contractor"
                        value={rule.value}
                        onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                        error={rulesTouched && rule.value.trim() === '' ? 'Required.' : undefined}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRule(rule.id)}
                      aria-label={`Remove rule ${index + 1}`}
                      disabled={draft.rules.length === 1}
                      className="mt-1 shrink-0 rounded-md p-1.5 text-icon hover:bg-surface-hover hover:text-danger disabled:opacity-40"
                    >
                      <DeleteOutline sx={{ fontSize: 18 }} />
                    </button>
                  </div>
                  <Select
                    label="Identity type"
                    placeholder="Select"
                    options={IDENTITY_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                    value={rule.identityType}
                    onChange={(v) =>
                      updateRule(rule.id, { identityType: v as ClassificationRule['identityType'] })
                    }
                    error={rulesTouched && rule.identityType === '' ? 'Required.' : undefined}
                  />
                </div>
              ))}
            </div>
            <Button variant="secondary" size="sm" startIcon={<AddOutlined />} className="mt-3" onClick={addRule}>
              Add rule
            </Button>
          </div>
        </div>
      </Drawer>
    </>
  );
}
