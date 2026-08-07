/**
 * Approval-policy condition vocabulary — the Conditional Branch builder compares
 * one person's attribute against either another person's attribute or a fixed value:
 *
 *   User → Attribute → Operator → User → Attribute
 *   e.g. "Requester Department = Target User Department"
 *
 *   User → Attribute → Operator → Values → Value
 *   e.g. "Requester Department = Engineering"
 *
 * Subject comparisons store `"<subject>.<attribute>"` on both sides; literal
 * comparisons store the plain value string in `value`. Workflow filters keep
 * their own generic attribute model.
 */
import {
  APPROVER_TYPE_LABEL,
  type ApproverType,
  type ConditionRule,
  OPERATOR_SYMBOL,
} from './automation-types';
import { newConditionRule } from '@/lib/policy-tree';

export interface PolicyOperator {
  value: string;
  label: string;
}

/** Whose attribute is being compared — Requester, Target User, then every
    approver type available on Approval Level (same labels / order). */
export type PolicySubject = 'requester' | 'targetUser' | ApproverType;
export const POLICY_SUBJECTS: { value: PolicySubject; label: string }[] = [
  { value: 'requester', label: 'Requester' },
  { value: 'targetUser', label: 'Target User' },
  ...(Object.entries(APPROVER_TYPE_LABEL) as [ApproverType, string][]).map(([value, label]) => ({
    value,
    label,
  })),
];

/** Right-hand mode: compare to a fixed value catalog, or to another subject's attribute. */
export type PolicyRightMode = 'values' | PolicySubject;
export const POLICY_RIGHT_MODES: { value: PolicyRightMode; label: string }[] = [
  { value: 'values', label: 'Values' },
  ...POLICY_SUBJECTS,
];

/** Which attribute of that person. */
export type PolicyAttribute = 'department' | 'location' | 'jobRole' | 'profileId';
export const POLICY_ATTRIBUTES: { value: PolicyAttribute; label: string }[] = [
  { value: 'department', label: 'Department' },
  { value: 'location', label: 'Location' },
  { value: 'jobRole', label: 'Job Role' },
  { value: 'profileId', label: 'Profile ID' },
];

/** Fixed answers offered when the right-hand mode is Values (keyed by left attribute). */
export const POLICY_ATTRIBUTE_VALUES: Record<PolicyAttribute, string[]> = {
  department: ['Engineering', 'Finance', 'Legal', 'HR'],
  location: ['New York', 'London', 'Bangalore', 'Berlin', 'Remote'],
  jobRole: ['Engineer', 'Manager', 'Analyst', 'Director'],
  profileId: ['PRF-001', 'PRF-002', 'PRF-003', 'PRF-004'],
};

export const POLICY_OPERATORS: PolicyOperator[] = [
  { value: 'equals', label: 'Equals (=)' },
  { value: 'notEquals', label: 'Not Equals (≠)' },
];

const SUBJECT_LABEL: Record<string, string> = Object.fromEntries(POLICY_SUBJECTS.map((s) => [s.value, s.label]));
const ATTRIBUTE_LABEL: Record<string, string> = Object.fromEntries(POLICY_ATTRIBUTES.map((a) => [a.value, a.label]));

export interface PolicyOperand {
  subject: PolicySubject;
  attribute: PolicyAttribute;
}

/** `{ requester, department }` → `"requester.department"`. */
export function encodeOperand(o: PolicyOperand): string {
  return `${o.subject}.${o.attribute}`;
}
/** Parse a stored operand id into subject/attribute parts. Missing or unknown
    pieces stay empty so the row can show placeholders instead of inventing defaults. */
export function parseOperandParts(id?: string): { subject: PolicySubject | ''; attribute: PolicyAttribute | '' } {
  if (!id) return { subject: '', attribute: '' };
  if (!id.includes('.')) {
    return {
      subject: id in SUBJECT_LABEL ? (id as PolicySubject) : '',
      attribute: '',
    };
  }
  const [s, a] = id.split('.');
  return {
    subject: s in SUBJECT_LABEL ? (s as PolicySubject) : '',
    attribute: a in ATTRIBUTE_LABEL ? (a as PolicyAttribute) : '',
  };
}
/** `"requester.department"` → `{ requester, department }`; unknown/missing parts
    fall back to the first option so summaries always render something readable. */
export function decodeOperand(id?: string): PolicyOperand {
  const parts = parseOperandParts(id);
  return {
    subject: parts.subject || POLICY_SUBJECTS[0].value,
    attribute: parts.attribute || POLICY_ATTRIBUTES[0].value,
  };
}
/** True when an id is a real `<subject>.<attribute>` operand — distinguishes an
    approval-policy rule from a workflow-filter rule (which uses plain attribute ids). */
export function isPolicyOperand(id?: string): boolean {
  if (!id) return false;
  const [s, a] = id.split('.');
  return Boolean(s && a && s in SUBJECT_LABEL && a in ATTRIBUTE_LABEL);
}
/** True when the right-hand side is a fixed Values pick (not another subject). */
export function isPolicyLiteral(value?: string): boolean {
  return Boolean(value?.trim()) && !isPolicyOperand(value) && !(value! in SUBJECT_LABEL);
}
/** Value options for the left-hand attribute when right mode is Values. */
export function valuesForAttribute(attribute: PolicyAttribute): string[] {
  return POLICY_ATTRIBUTE_VALUES[attribute] ?? [];
}
/** Default / first value for an attribute, or empty when the catalog is empty. */
export function defaultValueForAttribute(attribute: PolicyAttribute): string {
  return valuesForAttribute(attribute)[0] ?? '';
}
/** `"requester.department"` → `"Requester Department"`. */
export function operandLabel(id?: string): string {
  const { subject, attribute } = decodeOperand(id);
  return `${SUBJECT_LABEL[subject]} ${ATTRIBUTE_LABEL[attribute]}`;
}

/** A fresh empty policy condition — selects stay on placeholders until the user picks. */
export function defaultPolicyRule(): ConditionRule {
  return newConditionRule();
}

/** Structured parts for hierarchical policy condition previews. */
export function policyRuleParts(r: ConditionRule): { attribute: string; operator: string; value: string } {
  return {
    attribute: operandLabel(r.attribute),
    operator: r.operator ? (OPERATOR_SYMBOL[r.operator] ?? r.operator) : '?',
    value: isPolicyOperand(r.value) ? operandLabel(r.value) : (r.value ?? '…'),
  };
}

/** One policy rule as plain text, e.g. "Requester Department = Engineering". */
export function policyRuleText(r: ConditionRule): string {
  const p = policyRuleParts(r);
  return `${p.attribute} ${p.operator} ${p.value}`;
}
