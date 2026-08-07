/**
 * Workflow tree — block metadata, factory, path-based mutations, completeness,
 * and legacy migration. Mirrors policy-tree but for the Workflows block set.
 * Reuses the shared condition helpers from policy-tree.
 */
import type {
  WorkflowNode,
  WorkflowBlockType,
  WorkflowBranch,
  WorkflowEventType,
  AssignEntitiesConfig,
  UserFilterConfig,
  MultisplitConfig,
  NotificationConfig,
  DelayConfig,
  WaitForUserConfig,
} from '@/data/automation-types';
import { emptyConditionGroup, isConditionGroupValid, nid } from '@/lib/policy-tree';
import { defaultNotificationConfig, stripHtml } from '@/data/notification-templates';

export type WfPathStep = { nodeId: string; branchId: string };
export type WfInsertLoc = { path: WfPathStep[]; index: number };
export type WfSection = 'Filters' | 'Tasks' | 'Branching' | 'Flow Control';

export const BLOCK_META: Record<
  WorkflowBlockType,
  { title: string; icon: string; section: WfSection; branching: boolean }
> = {
  userFilter: { title: 'User Filter', icon: 'filter', section: 'Filters', branching: false },
  assignEntities: { title: 'Assign Entities', icon: 'assignment', section: 'Tasks', branching: false },
  notification: { title: 'Notification', icon: 'mail', section: 'Tasks', branching: false },
  multisplitBranch: { title: 'Multisplit Branch', icon: 'call_split', section: 'Branching', branching: true },
  wfConditionalBranch: { title: 'Conditional Branch', icon: 'account_tree', section: 'Branching', branching: true },
  delay: { title: 'Delay', icon: 'schedule', section: 'Flow Control', branching: false },
  waitForUser: { title: 'Wait for user', icon: 'person_search', section: 'Flow Control', branching: false },
  skip: { title: 'Skip', icon: 'skip_next', section: 'Flow Control', branching: false },
  exit: { title: 'Exit', icon: 'logout', section: 'Flow Control', branching: false },
};

// 'skip' is hidden from the palette for now (still a valid WorkflowBlockType —
// existing Skip blocks on saved workflows keep rendering via BLOCK_META.skip).
export const BLOCK_PALETTE: WorkflowBlockType[] = [
  'userFilter',
  'assignEntities',
  'notification',
  'multisplitBranch',
  'wfConditionalBranch',
  'delay',
  'waitForUser',
  'exit',
];

/** Blocks offered in the components palette for a lifecycle event. */
export function paletteBlocksForEvent(eventType?: WorkflowEventType | null): WorkflowBlockType[] {
  if (eventType === 'leaver') return ['notification'];
  if (eventType === 'mover') return ['userFilter', 'assignEntities'];
  return BLOCK_PALETTE;
}

export function defaultAssignEntitiesConfig(): AssignEntitiesConfig {
  return { entitlements: [], technicalRoles: [], businessRoles: [] };
}
export function defaultConfigFor(type: WorkflowBlockType): Record<string, unknown> | undefined {
  if (type === 'userFilter') return { condition: emptyConditionGroup() } as unknown as Record<string, unknown>;
  if (type === 'assignEntities') return defaultAssignEntitiesConfig() as unknown as Record<string, unknown>;
  if (type === 'notification') return defaultNotificationConfig() as unknown as Record<string, unknown>;
  if (type === 'multisplitBranch') return { splitAttributes: [] } as unknown as Record<string, unknown>;
  if (type === 'delay') return { days: 0, hours: 0, minutes: 0 } as unknown as Record<string, unknown>;
  if (type === 'waitForUser') {
    return {
      days: 0,
      hours: 0,
      minutes: 30,
      maxRetries: 3,
      unlimitedRetries: false,
      connectionIds: [],
    } as unknown as Record<string, unknown>;
  }
  return undefined;
}

function splitLane(label: string): WorkflowBranch {
  return { id: nid('br'), label, seq: [], kind: 'split', matchValues: {} };
}
function ifBranch(): WorkflowBranch {
  return { id: nid('br'), label: 'IF', seq: [], kind: 'if', condition: emptyConditionGroup() };
}
function elseBranch(kind: 'else' | 'elseSplit'): WorkflowBranch {
  return { id: nid('br'), label: 'ELSE', seq: [], kind, locked: true };
}

export function createBlock(type: WorkflowBlockType): WorkflowNode {
  const base: WorkflowNode = { id: nid('wf'), type };
  const config = defaultConfigFor(type);
  if (config) base.config = config;
  if (type === 'wfConditionalBranch') base.branches = [ifBranch(), elseBranch('else')];
  if (type === 'multisplitBranch') base.branches = [splitLane('Branch 1'), splitLane('Branch 2'), elseBranch('elseSplit')];
  return base;
}

export function isBlockComplete(node: WorkflowNode): boolean {
  switch (node.type) {
    case 'skip':
    case 'exit':
      return true;
    case 'delay': {
      const c = node.config as DelayConfig | undefined;
      return Boolean(c && c.days + c.hours + c.minutes > 0);
    }
    case 'waitForUser': {
      const c = node.config as WaitForUserConfig | undefined;
      if (!c || !(c.days + c.hours + c.minutes > 0) || c.connectionIds.length < 1) return false;
      return c.unlimitedRetries || c.maxRetries >= 1;
    }
    case 'userFilter': {
      const c = node.config as UserFilterConfig | undefined;
      return Boolean(c?.condition && isConditionGroupValid(c.condition));
    }
    case 'assignEntities': {
      const c = node.config as AssignEntitiesConfig | undefined;
      if (!c) return false;
      return c.entitlements.length + c.technicalRoles.length + c.businessRoles.length > 0;
    }
    case 'notification': {
      const c = node.config as NotificationConfig | undefined;
      if (!c) return false;
      const enabled = [c.email, c.slack].filter((ch) => ch?.enabled);
      if (enabled.length === 0) return false;
      for (const ch of enabled) {
        if (!ch.template.name.trim()) return false;
        if (!stripHtml(ch.template.body).trim()) return false;
      }
      if (c.email.enabled && !(c.email.template.subject ?? '').trim()) return false;
      return true;
    }
    case 'wfConditionalBranch': {
      const lanes = (node.branches ?? []).filter((b) => b.kind === 'if' || b.kind === 'elseif');
      return lanes.length > 0 && lanes.every((b) => b.condition != null && isConditionGroupValid(b.condition));
    }
    case 'multisplitBranch': {
      const c = node.config as MultisplitConfig | undefined;
      const splitLanes = (node.branches ?? []).filter((b) => b.kind === 'split');
      const hasElse = (node.branches ?? []).some((b) => b.kind === 'elseSplit');
      return splitLanes.length >= 2 && hasElse && Boolean(c && c.splitAttributes.length > 0);
    }
    default:
      return false;
  }
}

// ---- tree ops ---------------------------------------------------------
function mapSeqAtPath(seq: WorkflowNode[], path: WfPathStep[], fn: (s: WorkflowNode[]) => WorkflowNode[]): WorkflowNode[] {
  if (path.length === 0) return fn(seq);
  const [step, ...rest] = path;
  return seq.map((n) => {
    if (n.id !== step.nodeId || !n.branches) return n;
    return { ...n, branches: n.branches.map((b) => (b.id === step.branchId ? { ...b, seq: mapSeqAtPath(b.seq, rest, fn) } : b)) };
  });
}
export function insertBlock(root: WorkflowNode[], loc: WfInsertLoc, node: WorkflowNode): WorkflowNode[] {
  return mapSeqAtPath(root, loc.path, (s) => [...s.slice(0, loc.index), node, ...s.slice(loc.index)]);
}
export function deleteBlock(root: WorkflowNode[], id: string): WorkflowNode[] {
  const strip = (seq: WorkflowNode[]): WorkflowNode[] =>
    seq.filter((n) => n.id !== id).map((n) => (n.branches ? { ...n, branches: n.branches.map((b) => ({ ...b, seq: strip(b.seq) })) } : n));
  return strip(root);
}
export function updateBlock(root: WorkflowNode[], id: string, patch: Partial<WorkflowNode>): WorkflowNode[] {
  const walk = (seq: WorkflowNode[]): WorkflowNode[] =>
    seq.map((n) => {
      if (n.id === id) return { ...n, ...patch };
      if (n.branches) return { ...n, branches: n.branches.map((b) => ({ ...b, seq: walk(b.seq) })) };
      return n;
    });
  return walk(root);
}
export function findBlock(seq: WorkflowNode[], id: string): WorkflowNode | null {
  for (const n of seq) {
    if (n.id === id) return n;
    for (const b of n.branches ?? []) {
      const hit = findBlock(b.seq, id);
      if (hit) return hit;
    }
  }
  return null;
}
export function allBlocks(seq: WorkflowNode[]): WorkflowNode[] {
  const out: WorkflowNode[] = [];
  for (const n of seq) {
    out.push(n);
    for (const b of n.branches ?? []) out.push(...allBlocks(b.seq));
  }
  return out;
}

// ---- conditional/multisplit lane ops ---------------------------------
export function addElseIf(branches: WorkflowBranch[]): WorkflowBranch[] {
  const elseif: WorkflowBranch = { id: nid('br'), label: 'ELSE IF', seq: [], kind: 'elseif', condition: emptyConditionGroup() };
  const idx = branches.findIndex((b) => b.kind === 'else');
  return idx < 0 ? [...branches, elseif] : [...branches.slice(0, idx), elseif, ...branches.slice(idx)];
}
export function addSplitLane(branches: WorkflowBranch[]): WorkflowBranch[] {
  const idx = branches.findIndex((b) => b.kind === 'elseSplit');
  const count = branches.filter((b) => b.kind === 'split').length;
  const lane = splitLane(`Branch ${count + 1}`);
  return idx < 0 ? [...branches, lane] : [...branches.slice(0, idx), lane, ...branches.slice(idx)];
}
export function removeBranch(branches: WorkflowBranch[], id: string): WorkflowBranch[] {
  return branches.filter((b) => b.id !== id);
}
export function patchBranch(branches: WorkflowBranch[], id: string, patch: Partial<WorkflowBranch>): WorkflowBranch[] {
  return branches.map((b) => (b.id === id ? { ...b, ...patch } : b));
}

// ---- migration (strip legacy node types, normalize structure) --------
const LEGACY = new Set(['sodCheck', 'approvalPolicyRef']);
export function migrateWorkflowNode(node: WorkflowNode): WorkflowNode | null {
  if (LEGACY.has(node.type as string)) return null; // stripped; caller lifts nested seqs
  const n: WorkflowNode = { ...node };
  if (n.type === 'wfConditionalBranch' && !n.branches?.length) n.branches = [ifBranch(), elseBranch('else')];
  if (n.type === 'multisplitBranch' && !n.branches?.length) n.branches = [splitLane('Branch 1'), splitLane('Branch 2'), elseBranch('elseSplit')];
  if (!n.config) {
    const c = defaultConfigFor(n.type);
    if (c) n.config = c;
  }
  if (n.branches) n.branches = n.branches.map((b) => ({ ...b, seq: migrateSeq(b.seq) }));
  return n;
}
export function migrateSeq(seq: WorkflowNode[]): WorkflowNode[] {
  const out: WorkflowNode[] = [];
  for (const node of seq) {
    const migrated = migrateWorkflowNode(node);
    if (migrated) out.push(migrated);
    else if (node.branches) for (const b of node.branches) out.push(...migrateSeq(b.seq)); // lift nested
  }
  return out;
}
