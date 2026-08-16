/**
 * SoD ruleset tree — construction, immutable edits, validity and description.
 *
 * The tree is a boolean expression over access items: a user is in violation of
 * the policy when the expression is true of the access they hold. Two access
 * items under `AND` is the ordinary toxic pair; nesting an `OR` inside an `AND`
 * expresses the two-sided conflict ("any of these initiating permissions
 * together with any of these approving ones") without the model needing a
 * separate idea of sides.
 *
 * Pure functions over the tree, mirroring `lib/policy-tree.ts` for the approval
 * canvas: every edit returns a new tree, so a drawer can hold a working copy and
 * throw it away on cancel.
 */
import type {
  SodAccessRef,
  SodCombinator,
  SodRuleGroup,
  SodRuleNode,
} from '@/data/sod-types';

/** Ids only need to be unique within one ruleset, and are never persisted as keys. */
let seq = 0;
export function nid(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

export function newGroup(combinator: SodCombinator = 'AND', children: SodRuleNode[] = []): SodRuleGroup {
  return { kind: 'group', id: nid('grp'), combinator, children };
}

export function newAccessRef(input: {
  accessId: string;
  accessType: SodAccessRef['accessType'];
  name: string;
  appName?: string;
}): SodAccessRef {
  return { kind: 'access', id: nid('acc'), ...input };
}

/** An empty ruleset: one AND group, because a conflict is fundamentally a co-occurrence. */
export function emptyRuleset(): SodRuleGroup {
  return newGroup('AND');
}

// ---- immutable edits ---------------------------------------------------

function mapGroup(
  root: SodRuleGroup,
  groupId: string,
  fn: (g: SodRuleGroup) => SodRuleGroup,
): SodRuleGroup {
  if (root.id === groupId) return fn(root);
  return {
    ...root,
    children: root.children.map((c) => (c.kind === 'group' ? mapGroup(c, groupId, fn) : c)),
  };
}

export function addNodes(root: SodRuleGroup, groupId: string, nodes: SodRuleNode[]): SodRuleGroup {
  return mapGroup(root, groupId, (g) => ({ ...g, children: [...g.children, ...nodes] }));
}

export function setCombinator(root: SodRuleGroup, groupId: string, combinator: SodCombinator): SodRuleGroup {
  return mapGroup(root, groupId, (g) => ({ ...g, combinator }));
}

/** Removes a node anywhere in the tree. The root itself is never removable. */
export function removeNode(root: SodRuleGroup, nodeId: string): SodRuleGroup {
  return {
    ...root,
    children: root.children
      .filter((c) => c.id !== nodeId)
      .map((c) => (c.kind === 'group' ? removeNode(c, nodeId) : c)),
  };
}

// ---- reading -----------------------------------------------------------

export function accessNodes(node: SodRuleNode): SodAccessRef[] {
  if (node.kind === 'access') return [node];
  return node.children.flatMap(accessNodes);
}

export function countAccess(root: SodRuleGroup): number {
  return accessNodes(root).length;
}

/** Groups holding nothing — an empty group makes the expression meaningless, not just untidy. */
export function emptyGroups(node: SodRuleNode): SodRuleGroup[] {
  if (node.kind === 'access') return [];
  const nested = node.children.flatMap(emptyGroups);
  return node.children.length === 0 ? [node, ...nested] : nested;
}

/**
 * Why a ruleset cannot be saved, in the reader's words. Empty array = valid.
 *
 * A single access item is never a separation-of-duties rule: on its own it says
 * "nobody may hold this", which is an entitlement decision, not a conflict.
 */
export function rulesetProblems(root: SodRuleGroup): string[] {
  const problems: string[] = [];
  const count = countAccess(root);
  if (count === 0) problems.push('Add the access that conflicts');
  else if (count === 1) problems.push('A conflict needs at least two pieces of access');
  if (emptyGroups(root).length > 0) problems.push('Every group needs at least one item');
  return problems;
}

export function isRulesetValid(root: SodRuleGroup): boolean {
  return rulesetProblems(root).length === 0;
}

/**
 * The expression as one line, e.g.
 * `Post Journal AND (Approve Payment OR Vendor Master)`.
 *
 * Parenthesised only where nesting makes the precedence ambiguous, so the common
 * flat rule reads as plain English rather than as an equation.
 */
export function describeRuleset(node: SodRuleNode, depth = 0): string {
  if (node.kind === 'access') return node.name;
  if (node.children.length === 0) return '—';
  const joined = node.children
    .map((c) => describeRuleset(c, depth + 1))
    .join(` ${node.combinator} `);
  return depth > 0 && node.children.length > 1 ? `(${joined})` : joined;
}
