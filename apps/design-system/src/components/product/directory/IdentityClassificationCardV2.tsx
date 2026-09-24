'use client';

import * as React from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import {
  Button,
  ChipPicker,
  Drawer,
  Input,
  Select,
  SettingsRow,
  SettingsStack,
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

/**
 * Identity classification — v2 (demo).
 *
 * A flatter take on v1: the default identity type is stated first — the type every identity
 * gets — and additional types are added beneath it as classification rules. Unlike v1 there
 * is no "one type / many types" switch; the rules are simply optional. They are configured in
 * a drawer (application field + a list of match → type rules), so the card stays a summary and
 * the rule editing has room. Save persists the default type and whatever the rules resolve to.
 * Reuses the v1 data model and store.
 */
export function IdentityClassificationCardV2({
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
  const [touched, setTouched] = React.useState(false);
  const [rulesOpen, setRulesOpen] = React.useState(false);
  const [rulesTouched, setRulesTouched] = React.useState(false);
  const rulesSnapshot = React.useRef<Pick<IdentityClassification, 'classifyBasedOn' | 'rules'>>({
    classifyBasedOn: '',
    rules: [],
  });

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
  const rulesStarted = draft.rules.filter((r) => r.value.trim() !== '' || r.identityType !== '');
  const rulesIncomplete =
    rulesStarted.length === 0 ||
    sourceField === '' ||
    rulesStarted.some((r) => r.value.trim() === '' || r.identityType === '');
  const typeMissing = touched && draft.defaultIdentityType === '';

  // The additional types the rules resolve to, deduped — ChipPicker names them.
  const typeLabel = (v: string) => IDENTITY_TYPES.find((t) => t.value === v)?.label ?? v;
  const typeChips = Array.from(
    new Set(rulesStarted.map((r) => r.identityType).filter((v) => v !== '')),
  ).map((v) => ({ id: v, name: typeLabel(v) }));

  const rulesHint =
    sourceField === ''
      ? 'Checked top to bottom — the first match decides the type.'
      : `Checked top to bottom against ${sourceField} — the first match decides the type.`;

  const snapshotRules = (rules: ClassificationRule[]) => rules.map((r) => ({ ...r }));

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
    // Cancel — restore what the rules were before the drawer opened.
    patch({
      classifyBasedOn: rulesSnapshot.current.classifyBasedOn,
      rules: snapshotRules(rulesSnapshot.current.rules),
    });
    setRulesOpen(false);
  };

  const saveRules = () => {
    setRulesTouched(true);
    // No rows left — clearing the additional types is a valid outcome.
    if (draft.rules.length === 0) {
      patch({ classifyBasedOn: '', rules: [] });
      setRulesOpen(false);
      toast.success('Rules cleared.');
      return;
    }
    if (rulesIncomplete) return;
    // Stage into the draft; the card's Save classification is what persists.
    patch({ classifyBasedOn: sourceField, rules: rulesStarted });
    setRulesOpen(false);
    toast.success('Rules added.');
  };

  const save = () => {
    setTouched(true);
    if (draft.defaultIdentityType === '') return;
    saveIdentityClassification({
      applicationId,
      defaultIdentityType: draft.defaultIdentityType,
      classifyBasedOn: rulesStarted.length > 0 ? sourceField : '',
      rules: rulesStarted,
    });
    toast.success('Identity classification saved.');
    onSaved?.();
  };

  return (
    <div className="space-y-4">
      {/* Both fields as grey settings rows: what it is on the left, its control on the right. */}
      <SettingsStack>
        <SettingsRow
          surface="subtle"
          title="Default identity type"
          description="The type applied to every identity unless a rule matches."
        >
          <div className="w-48">
            <Select
              ariaLabel="Default identity type"
              options={IDENTITY_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              value={draft.defaultIdentityType}
              onChange={(v) => patch({ defaultIdentityType: v as IdentityClassification['defaultIdentityType'] })}
              placeholder="Select"
              required
              error={typeMissing ? 'Required.' : undefined}
            />
          </div>
        </SettingsRow>

        <SettingsRow
          surface="subtle"
          title="Additional identity types"
          description="Classify some identities differently based on an application field."
        >
          <ChipPicker
            items={typeChips}
            addLabel="Add Types"
            editLabel={
              typeChips.length > 0
                ? `Additional types: ${typeChips.map((c) => c.name).join(', ')}. Edit rules.`
                : 'Add type rules'
            }
            tooltip="Edit type rules"
            onClick={openRules}
          />
        </SettingsRow>
      </SettingsStack>

      <Button onClick={save}>Save classification</Button>

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
            <p className="text-body-sm-strong text-text-primary">Type rules</p>
            <p className="mb-2.5 mt-0.5 text-caption text-text-secondary">
              Match a value of the field above to an identity type — one rule per type you send.
            </p>
            <div className="space-y-2">
              {draft.rules.map((rule, index) => (
                <div key={rule.id} className="flex items-start gap-2">
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
                  <div className="w-44 shrink-0">
                    <Select
                      ariaLabel={`Rule ${index + 1} identity type`}
                      placeholder="Identity type"
                      options={IDENTITY_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                      value={rule.identityType}
                      onChange={(v) => updateRule(rule.id, { identityType: v as ClassificationRule['identityType'] })}
                      error={rulesTouched && rule.identityType === '' ? 'Required.' : undefined}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRule(rule.id)}
                    aria-label={`Remove rule ${index + 1}`}
                    className="mt-1 shrink-0 rounded-md p-1.5 text-icon hover:bg-surface-hover hover:text-danger"
                  >
                    <DeleteOutline sx={{ fontSize: 18 }} />
                  </button>
                </div>
              ))}
            </div>
            <Button variant="secondary" size="sm" startIcon={<AddOutlined />} className="mt-3" onClick={addRule}>
              Add rule
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
