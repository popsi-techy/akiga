import { type ConditionGroup, type ConditionRule, OPERATOR_SYMBOL } from '@/data/automation-types';
import { attributeLabel } from '@/data/attributes';

/** Flatten a condition group to its leaf rules (ignores nesting for previews). */
export function flattenRules(g: ConditionGroup): ConditionRule[] {
  const out: ConditionRule[] = [];
  for (const c of g.children) c.kind === 'rule' ? out.push(c) : out.push(...flattenRules(c));
  return out;
}

/** Structured parts for hierarchical condition previews. */
export function ruleParts(r: ConditionRule): { attribute: string; operator: string; value: string } {
  return {
    attribute: attributeLabel(r.attribute) || 'Attribute',
    operator: r.operator ? (OPERATOR_SYMBOL[r.operator] ?? r.operator) : '?',
    value: r.value ?? '…',
  };
}

/** One rule as plain text, e.g. "Department = Engineering". */
export function ruleText(r: ConditionRule): string {
  const p = ruleParts(r);
  return `${p.attribute} ${p.operator} ${p.value}`;
}
