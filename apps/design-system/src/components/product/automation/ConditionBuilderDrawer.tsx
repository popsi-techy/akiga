'use client';

import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import FilterAltOutlined from '@mui/icons-material/FilterAltOutlined';
import { Drawer, Button, Select, Input } from '@ds/components';
import type { ConditionGroup, ConditionNode, ConditionRule } from '@/data/automation-types';
import { listAttributes, getAttribute } from '@/data/attributes';
import { newConditionRule, emptyConditionGroup } from '@/lib/policy-tree';

// ---- immutable tree ops ------------------------------------------------
function mapNode(group: ConditionGroup, id: string, fn: (n: ConditionNode) => ConditionNode): ConditionGroup {
  return {
    ...group,
    children: group.children.map((c) => {
      if (c.id === id) return fn(c);
      if (c.kind === 'group') return mapNode(c, id, fn);
      return c;
    }),
  };
}
function removeNode(group: ConditionGroup, id: string): ConditionGroup {
  return {
    ...group,
    children: group.children
      .filter((c) => c.id !== id)
      .map((c) => (c.kind === 'group' ? removeNode(c, id) : c)),
  };
}
function addToGroup(group: ConditionGroup, groupId: string, child: ConditionNode): ConditionGroup {
  if (group.id === groupId) return { ...group, children: [...group.children, child] };
  return { ...group, children: group.children.map((c) => (c.kind === 'group' ? addToGroup(c, groupId, child) : c)) };
}

const ATTR_OPTIONS = () => listAttributes().map((a) => ({ value: a.id, label: a.label }));
const OP_OPTIONS = [
  { value: 'equals', label: 'Equals (=)' },
  { value: 'notEquals', label: 'Not equals (≠)' },
  { value: 'contains', label: 'Contains (⊃)' },
  { value: 'notContains', label: 'Not contains (⊅)' },
];

function RuleRow({ rule, onChange, onRemove }: { rule: ConditionRule; onChange: (r: ConditionRule) => void; onRemove: () => void }) {
  const attr = rule.attribute ? getAttribute(rule.attribute) : undefined;
  const freeTextOp = rule.operator === 'contains' || rule.operator === 'notContains';
  const useValueSelect = attr?.type === 'enum' && !freeTextOp;

  return (
    <div className="flex items-start gap-2">
      <div className="w-[38%]">
        <Select
          options={ATTR_OPTIONS()}
          value={rule.attribute ?? ''}
          placeholder="Attribute"
          onChange={(v) => onChange({ ...rule, attribute: v, value: undefined })}
        />
      </div>
      <div className="w-[26%]">
        <Select
          options={OP_OPTIONS}
          value={rule.operator ?? ''}
          placeholder="Operator"
          onChange={(v) => {
            const operator = v as ConditionRule['operator'];
            const nextFreeText = operator === 'contains' || operator === 'notContains';
            onChange({
              ...rule,
              operator,
              // Enum picks don't transfer cleanly into free-text contains matching.
              ...(nextFreeText && attr?.type === 'enum' ? { value: undefined } : {}),
            });
          }}
        />
      </div>
      <div className="flex-1">
        {useValueSelect ? (
          <Select
            options={(attr.options ?? []).map((o) => ({ value: o, label: o }))}
            value={rule.value ?? ''}
            placeholder="Value"
            onChange={(v) => onChange({ ...rule, value: v })}
          />
        ) : (
          <Input
            size="sm"
            type={!freeTextOp && attr?.type === 'number' ? 'number' : 'text'}
            placeholder="Value"
            value={rule.value ?? ''}
            onChange={(e) => onChange({ ...rule, value: e.target.value })}
          />
        )}
      </div>
      <button type="button" onClick={onRemove} aria-label="Remove condition" className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-md text-icon hover:bg-surface-hover hover:text-danger">
        <DeleteOutline sx={{ fontSize: 18 }} />
      </button>
    </div>
  );
}

function GroupEditor({
  group,
  root,
  onChange,
  depth = 0,
}: {
  group: ConditionGroup;
  root: ConditionGroup;
  onChange: (next: ConditionGroup) => void;
  depth?: number;
}) {
  const setCombinator = (c: 'AND' | 'OR') =>
    group.id === root.id
      ? onChange({ ...root, combinator: c })
      : onChange(mapNode(root, group.id, (g) => ({ ...(g as ConditionGroup), combinator: c })));

  return (
    <div className={depth > 0 ? 'rounded-md border border-border bg-subtle/40 p-3' : ''}>
      <div className="mb-2 flex items-center gap-2">
        <div className="inline-flex rounded-md bg-subtle p-0.5 text-caption-strong">
          {(['AND', 'OR'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCombinator(c)}
              className={['rounded-[5px] px-2.5 py-1', group.combinator === c ? 'bg-surface text-text-primary shadow-xs' : 'text-text-secondary'].join(' ')}
            >
              {c}
            </button>
          ))}
        </div>
        <span className="text-caption text-text-tertiary">
          {group.combinator === 'AND' ? 'All conditions must match' : 'Any condition can match'}
        </span>
      </div>

      <div className="space-y-2">
        {group.children.map((child) =>
          child.kind === 'rule' ? (
            <RuleRow
              key={child.id}
              rule={child}
              onChange={(r) => onChange(mapNode(root, child.id, () => r))}
              onRemove={() => onChange(removeNode(root, child.id))}
            />
          ) : (
            <GroupEditor key={child.id} group={child} root={root} onChange={onChange} depth={depth + 1} />
          ),
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <Button variant="secondary" size="sm" startIcon={<AddIcon />} onClick={() => onChange(addToGroup(root, group.id, newConditionRule()))}>
          Add condition
        </Button>
        {depth > 0 && (
          <Button variant="secondary" size="sm" startIcon={<DeleteOutline />} onClick={() => onChange(removeNode(root, group.id))}>
            Remove group
          </Button>
        )}
      </div>
    </div>
  );
}

export interface ConditionBuilderDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  group: ConditionGroup;
  onApply: (group: ConditionGroup) => void;
}

export function ConditionBuilderDrawer({ open, onClose, title = 'Condition Builder', subtitle, group, onApply }: ConditionBuilderDrawerProps) {
  const [working, setWorking] = React.useState<ConditionGroup>(group);
  React.useEffect(() => {
    if (open) setWorking(group ?? emptyConditionGroup());
  }, [open, group]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={<FilterAltOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
      width={620}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onApply(working);
              onClose();
            }}
          >
            Apply
          </Button>
        </>
      }
    >
      <GroupEditor group={working} root={working} onChange={setWorking} />
    </Drawer>
  );
}

export default ConditionBuilderDrawer;
