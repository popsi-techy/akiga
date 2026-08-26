'use client';

import * as React from 'react';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import {
  Button,
  Drawer,
  Input,
  Select,
  SettingsRow,
  SettingsStack,
  Switch,
  useToast,
} from '@ds/components';
import {
  ATTRIBUTE_NAME_PATTERN,
  CUSTOM_ATTRIBUTE_FIELD_TYPES,
  attributeNameTaken,
  createCustomAttribute,
  emptyCustomAttributeDraft,
  getCustomAttribute,
  isValidRegex,
  parseSelectOptions,
  suggestAttributeName,
  updateCustomAttribute,
  type CustomAttributeDraft,
  type CustomAttributeFieldType,
} from '@/data/custom-attributes';

export function CustomAttributeDrawer({
  open,
  attributeId,
  onClose,
  onSaved,
}: {
  open: boolean;
  attributeId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const editing = attributeId !== null;
  const [draft, setDraft] = React.useState<CustomAttributeDraft>(emptyCustomAttributeDraft);
  const [optionsText, setOptionsText] = React.useState('');
  const [nameTouched, setNameTouched] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [missing, setMissing] = React.useState(false);
  const savingRef = React.useRef(false);

  React.useEffect(() => {
    if (!open) return;
    setSubmitted(false);
    setMissing(false);
    savingRef.current = false;
    if (!attributeId) {
      setDraft(emptyCustomAttributeDraft());
      setOptionsText('');
      setNameTouched(false);
      return;
    }
    const existing = getCustomAttribute(attributeId);
    if (!existing) {
      setMissing(true);
      return;
    }
    setDraft({
      displayName: existing.displayName,
      attributeName: existing.attributeName,
      fieldType: existing.fieldType,
      description: existing.description,
      validationRule: existing.validationRule,
      options: existing.options,
      required: existing.required,
      unique: existing.unique,
      correlation: existing.correlation,
    });
    setOptionsText(existing.options.join('\n'));
    setNameTouched(true);
  }, [open, attributeId]);

  const options = parseSelectOptions(optionsText);
  const nameOk = ATTRIBUTE_NAME_PATTERN.test(draft.attributeName);
  const taken = Boolean(draft.attributeName) && attributeNameTaken(draft.attributeName, attributeId ?? undefined);
  const regexOk = isValidRegex(draft.validationRule);
  const selectOk = draft.fieldType !== 'select' || options.length >= 2;
  const canSave =
    Boolean(draft.displayName.trim()) && nameOk && !taken && regexOk && selectOk;

  const showValidation = draft.fieldType === 'text' || draft.fieldType === 'number';
  const fieldHelp = CUSTOM_ATTRIBUTE_FIELD_TYPES.find((t) => t.value === draft.fieldType)?.description ?? '';

  const patch = (next: Partial<CustomAttributeDraft>) => setDraft((prev) => ({ ...prev, ...next }));

  const save = () => {
    setSubmitted(true);
    if (!canSave || savingRef.current) return;
    savingRef.current = true;
    const payload: CustomAttributeDraft = {
      ...draft,
      displayName: draft.displayName.trim(),
      attributeName: draft.attributeName,
      description: draft.description.trim(),
      validationRule: showValidation ? draft.validationRule.trim() : '',
      options: draft.fieldType === 'select' ? options : [],
    };
    if (editing && attributeId) {
      const updated = updateCustomAttribute(attributeId, payload);
      if (!updated) {
        savingRef.current = false;
        return;
      }
      toast.success('Custom attribute saved');
    } else {
      const created = createCustomAttribute(payload);
      if (!created) {
        savingRef.current = false;
        return;
      }
      toast.success('Custom attribute created');
    }
    onClose();
    onSaved();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={480}
      title={editing ? 'Edit Custom Attribute' : 'Add Custom Attribute'}
      subtitle={
        editing
          ? 'Change this schema. Existing values on identities and accounts are not rewritten.'
          : 'Define a custom attribute schema for user identities and accounts.'
      }
      icon={<TuneOutlined sx={{ fontSize: 22 }} />}
      footer={
        missing ? (
          <Button onClick={onClose}>Close</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={save} disabled={submitted && !canSave}>
              {editing ? 'Save' : 'Create'}
            </Button>
          </>
        )
      }
    >
      {missing ? (
        <p className="text-body-sm text-text-secondary">
          This attribute was removed, or the link is out of date.
        </p>
      ) : (
        <div className="space-y-4">
          <Input
            label="Display Name"
            required
            placeholder="Enter display name"
            value={draft.displayName}
            error={submitted && !draft.displayName.trim() ? 'Enter a display name.' : undefined}
            onChange={(e) => {
              const displayName = e.target.value;
              patch({
                displayName,
                attributeName: nameTouched ? draft.attributeName : suggestAttributeName(displayName),
              });
            }}
          />
          <Input
            label="Attribute Name"
            required
            placeholder="Enter attribute name (no spaces)"
            value={draft.attributeName}
            hint="Letters, digits, and underscores. Must start with a letter. Unique across this tenant."
            error={
              submitted && !draft.attributeName
                ? 'Enter an attribute name.'
                : submitted && !nameOk
                  ? 'Use letters, digits, and underscores, starting with a letter.'
                  : submitted && taken
                    ? 'This attribute name is already in use.'
                    : undefined
            }
            onChange={(e) => {
              setNameTouched(true);
              patch({ attributeName: e.target.value.replace(/\s+/g, '_') });
            }}
          />
          <Select
            label="Field Type"
            required
            options={CUSTOM_ATTRIBUTE_FIELD_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            value={draft.fieldType}
            helperText={fieldHelp}
            onChange={(fieldType) => patch({ fieldType: fieldType as CustomAttributeFieldType })}
          />
          {draft.fieldType === 'select' ? (
            <Input
              label="Options"
              required
              multiline
              minRows={3}
              placeholder={'Full-time\nContractor\nIntern'}
              value={optionsText}
              helperText="One option per line. At least two are required."
              error={submitted && !selectOk ? 'Enter at least two options.' : undefined}
              onChange={(e) => setOptionsText(e.target.value)}
            />
          ) : null}
          <Input
            label="Description"
            multiline
            minRows={2}
            placeholder="Optional description"
            value={draft.description}
            onChange={(e) => patch({ description: e.target.value })}
          />
          {showValidation ? (
            <Input
              label="Validation Rule"
              placeholder="Optional regex pattern"
              value={draft.validationRule}
              hint="Values that do not match this pattern are rejected."
              error={submitted && !regexOk ? 'Enter a valid regular expression.' : undefined}
              onChange={(e) => patch({ validationRule: e.target.value })}
            />
          ) : null}
          <SettingsStack>
            <SettingsRow surface="subtle" title="Required">
              <Switch
                checked={draft.required}
                onChange={(_, checked) => patch({ required: checked })}
                inputProps={{ 'aria-label': 'Required' }}
              />
            </SettingsRow>
            <SettingsRow surface="subtle" title="Unique">
              <Switch
                checked={draft.unique}
                onChange={(_, checked) => patch({ unique: checked })}
                inputProps={{ 'aria-label': 'Unique' }}
              />
            </SettingsRow>
            <SettingsRow surface="subtle" title="Enable for correlation">
              <Switch
                checked={draft.correlation}
                onChange={(_, checked) => patch({ correlation: checked })}
                inputProps={{ 'aria-label': 'Enable for correlation' }}
              />
            </SettingsRow>
          </SettingsStack>
        </div>
      )}
    </Drawer>
  );
}
