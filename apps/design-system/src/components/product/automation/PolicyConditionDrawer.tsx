'use client';

import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import RuleOutlined from '@mui/icons-material/RuleOutlined';
import { Drawer, Button, Select } from '@ds/components';
import type { ConditionGroup, ConditionNode, ConditionRule, ConditionOperator } from '@/data/automation-types';
import {
  POLICY_SUBJECTS,
  POLICY_ATTRIBUTES,
  POLICY_OPERATORS,
  POLICY_RIGHT_MODES,
  parseOperandParts,
  encodeOperand,
  isPolicyOperand,
  isPolicyLiteral,
  defaultPolicyRule,
  valuesForAttribute,
  type PolicyAttribute,
  type PolicyRightMode,
  type PolicySubject,
} from '@/data/policy-conditions';

const SUBJECT_IDS = new Set(POLICY_SUBJECTS.map((s) => s.value));

function inferRightMode(value?: string): PolicyRightMode | '' {
  if (isPolicyLiteral(value)) return 'values';
  if (isPolicyOperand(value)) return parseOperandParts(value).subject;
  if (value && SUBJECT_IDS.has(value as PolicySubject)) return value as PolicySubject;
  return '';
}

/** Encode left/right drafts: subject-only until attribute is chosen, then `subject.attribute`. */
function encodeParts(subject: PolicySubject | '', attribute: PolicyAttribute | ''): string | undefined {
  if (!subject && !attribute) return undefined;
  if (subject && attribute) return encodeOperand({ subject, attribute });
  if (subject) return subject;
  return undefined;
}

/** One condition row — User · Attribute · Operator · (Values · Value | User · Attribute). */
function RuleRow({ rule, onChange, onRemove }: { rule: ConditionRule; onChange: (r: ConditionRule) => void; onRemove: () => void }) {
  const left = parseOperandParts(rule.attribute);
  const inferredMode = inferRightMode(rule.value);
  const [rightMode, setRightModeState] = React.useState<PolicyRightMode | ''>(inferredMode);
  React.useEffect(() => {
    setRightModeState(inferRightMode(rule.value));
  }, [rule.id, rule.value]);

  const literal = rightMode === 'values';
  const right = literal ? { subject: '' as const, attribute: '' as const } : parseOperandParts(rule.value);
  const valueOptions = left.attribute
    ? valuesForAttribute(left.attribute).map((v) => ({ value: v, label: v }))
    : [];
  const literalValue = literal && rule.value && valueOptions.some((o) => o.value === rule.value) ? rule.value : '';

  const setLeftSubject = (subject: PolicySubject) =>
    onChange({ ...rule, attribute: encodeParts(subject, left.attribute) });

  const setLeftAttribute = (attribute: PolicyAttribute) => {
    const nextAttr = encodeParts(left.subject, attribute);
    if (literal) {
      onChange({ ...rule, attribute: nextAttr, value: undefined });
      return;
    }
    const rightSubject = (right.subject || rightMode || '') as PolicySubject | '';
    onChange({
      ...rule,
      attribute: nextAttr,
      value: encodeParts(rightSubject, attribute),
    });
  };

  const chooseRightMode = (mode: PolicyRightMode) => {
    setRightModeState(mode);
    if (mode === 'values') {
      onChange({ ...rule, value: undefined });
      return;
    }
    onChange({
      ...rule,
      value: encodeParts(mode, left.attribute || right.attribute),
    });
  };

  const setRightAttribute = (attribute: PolicyAttribute) => {
    const subject = (right.subject || rightMode || '') as PolicySubject | '';
    onChange({ ...rule, value: encodeParts(subject, attribute) });
  };

  const subjectOptions = POLICY_SUBJECTS.map((s) => ({ value: s.value, label: s.label }));
  const attributeOptions = POLICY_ATTRIBUTES.map((a) => ({ value: a.value, label: a.label }));
  const rightModeOptions = POLICY_RIGHT_MODES.map((m) => ({ value: m.value, label: m.label }));

  return (
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <Select
          options={subjectOptions}
          value={left.subject}
          placeholder="Select user"
          onChange={(v) => setLeftSubject(v as PolicySubject)}
        />
      </div>
      <div className="min-w-0 flex-1">
        <Select
          options={attributeOptions}
          value={left.attribute}
          placeholder="Select attribute"
          onChange={(v) => setLeftAttribute(v as PolicyAttribute)}
        />
      </div>
      <div className="min-w-0 flex-1">
        <Select
          options={POLICY_OPERATORS}
          value={rule.operator ?? ''}
          placeholder="Select operator"
          onChange={(v) => onChange({ ...rule, operator: v as ConditionOperator })}
        />
      </div>
      <div className="min-w-0 flex-1">
        <Select
          options={rightModeOptions}
          value={rightMode}
          placeholder="Select comparison"
          onChange={(v) => chooseRightMode(v as PolicyRightMode)}
        />
      </div>
      <div className="min-w-0 flex-1">
        {literal ? (
          <Select
            options={valueOptions}
            value={literalValue}
            placeholder="Select value"
            onChange={(v) => onChange({ ...rule, value: v })}
          />
        ) : (
          <Select
            options={attributeOptions}
            value={right.attribute}
            placeholder="Select attribute"
            onChange={(v) => setRightAttribute(v as PolicyAttribute)}
          />
        )}
      </div>
      <button type="button" onClick={onRemove} aria-label="Remove condition" className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-md text-icon transition-colors hover:bg-surface-hover hover:text-danger">
        <DeleteOutline sx={{ fontSize: 18 }} />
      </button>
    </div>
  );
}

export interface PolicyConditionDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  group: ConditionGroup;
  onApply: (group: ConditionGroup) => void;
}

/** Approval-policy condition builder — a flat list of attribute-to-attribute
    comparisons joined by AND/OR. (No nested groups; scoped to approval policies.) */
export function PolicyConditionDrawer({ open, onClose, title = 'Conditions', subtitle, group, onApply }: PolicyConditionDrawerProps) {
  const [working, setWorking] = React.useState<ConditionGroup>(group);
  React.useEffect(() => {
    if (!open) return;
    const rules = (group?.children ?? []).filter((c): c is ConditionRule => c.kind === 'rule');
    // Empty lane → one blank row with placeholders. Do not invent defaults.
    if (rules.length === 0) {
      setWorking({ ...group, children: [defaultPolicyRule()] });
      return;
    }
    setWorking(group);
  }, [open, group]);

  const rules = working.children.filter((c): c is ConditionRule => c.kind === 'rule');
  const setCombinator = (c: 'AND' | 'OR') => setWorking((w) => ({ ...w, combinator: c }));
  const updateRule = (id: string, next: ConditionRule) =>
    setWorking((w) => ({ ...w, children: w.children.map((c) => (c.id === id ? next : c)) as ConditionNode[] }));
  const removeRule = (id: string) => setWorking((w) => ({ ...w, children: w.children.filter((c) => c.id !== id) }));
  const addRule = () => setWorking((w) => ({ ...w, children: [...w.children, defaultPolicyRule()] }));

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={<RuleOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
      width={900}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onApply(working); onClose(); }}>Apply</Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* combinator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-md bg-subtle p-0.5 text-caption font-medium">
            {(['AND', 'OR'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCombinator(c)}
                className={['rounded-[5px] px-3 py-1 transition-colors', working.combinator === c ? 'bg-surface text-text-primary shadow-xs' : 'text-text-secondary'].join(' ')}
              >
                {c}
              </button>
            ))}
          </div>
          <span className="text-caption text-text-tertiary">
            {working.combinator === 'AND' ? 'All conditions must match' : 'Any condition can match'}
          </span>
        </div>

        {/* conditions */}
        <div className="space-y-2">
          {rules.map((r) => (
            <RuleRow key={r.id} rule={r} onChange={(next) => updateRule(r.id, next)} onRemove={() => removeRule(r.id)} />
          ))}
        </div>

        <Button variant="secondary" size="sm" startIcon={<AddIcon />} onClick={addRule}>
          Add condition
        </Button>
      </div>
    </Drawer>
  );
}

export default PolicyConditionDrawer;
