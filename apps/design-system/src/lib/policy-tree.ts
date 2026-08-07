/**
 * Approval Policy tree — metadata, node factory, completeness, and path-based
 * immutable mutations. The path model (reference §15.4) addresses any nested
 * sequence as a list of {nodeId, branchId} steps from the root (root path = []).
 */
import {
  APPROVER_TYPE_LABEL,
  type PolicyNode,
  type PolicyNodeType,
  type PolicyBranch,
  type ApprovalLevelConfig,
  type NotificationConfig,
  type ParallelConfig,
  type ConditionGroup,
  type ConditionRule,
  type LaneApprover,
  type SlaConfig,
} from '@/data/automation-types';
import { defaultNotificationConfig, stripHtml } from '@/data/notification-templates';

export type PathStep = { nodeId: string; branchId: string };
export type InsertLoc = { path: PathStep[]; index: number };

export type PaletteSection = 'Tasks' | 'Branching' | 'Flow Control';

export const NODE_META: Record<
  PolicyNodeType,
  { title: string; icon: string; section: PaletteSection; branching: boolean }
> = {
  approvalLevel: { title: 'Approval Level', icon: 'person', section: 'Tasks', branching: false },
  notification: { title: 'Notification', icon: 'mail', section: 'Tasks', branching: false },
  parallelBranch: { title: 'Parallel Approval Branch', icon: 'call_split', section: 'Tasks', branching: true },
  conditionalBranch: { title: 'Conditional Branch', icon: 'account_tree', section: 'Branching', branching: true },
  skip: { title: 'Skip', icon: 'skip_next', section: 'Flow Control', branching: false },
  exit: { title: 'Exit', icon: 'logout', section: 'Flow Control', branching: false },
};

// 'skip' is hidden from the palette for now (still a valid PolicyNodeType —
// existing Skip nodes on saved policies keep rendering via NODE_META.skip).
export const PALETTE_ORDER: PolicyNodeType[] = [
  'approvalLevel',
  'parallelBranch',
  'notification',
  'conditionalBranch',
  'exit',
];

let counter = 0;
/** Client-side unique id (Math.random is fine inside a handler, not at module scope). */
export function nid(prefix = 'n'): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}${counter}`;
}

// ---- branch factories -------------------------------------------------
/** `sealed` outcome lanes auto-resolve (e.g. SLA auto-approve/reject) — no steps
    can be inserted, since the label pill already shows the fixed resolution. */
function outcomeBranch(label: string, sealed = false): PolicyBranch {
  return { id: nid('br'), label, seq: [], kind: 'outcome', locked: true, sealed };
}
function ifBranch(): PolicyBranch {
  return { id: nid('br'), label: 'IF', seq: [], kind: 'if', condition: emptyConditionGroup() };
}
function elseBranch(): PolicyBranch {
  return { id: nid('br'), label: 'ELSE', seq: [], kind: 'else', locked: true };
}

// ---- condition helpers (shared: conditional branch + workflow filters) -
export function newConditionRule(): ConditionRule {
  return { kind: 'rule', id: nid('rule') };
}
export function emptyConditionGroup(): ConditionGroup {
  return { kind: 'group', id: nid('grp'), combinator: 'AND', children: [newConditionRule()] };
}
/** Subject-only draft ids — Requester, Target User, plus every Approval Level approver type. */
const POLICY_SUBJECT_IDS = new Set(['requester', 'targetUser', ...Object.keys(APPROVER_TYPE_LABEL)]);
export function isConditionRuleValid(r: ConditionRule): boolean {
  if (!r.operator || r.value == null || r.value === '') return false;
  const attr = r.attribute ?? '';
  if (!attr) return false;
  // Policy drafts may store a subject-only id before the attribute is chosen.
  if (POLICY_SUBJECT_IDS.has(attr) || POLICY_SUBJECT_IDS.has(r.value)) return false;
  if (attr.includes('.')) {
    const [ls, la] = attr.split('.');
    if (!ls || !la) return false;
    if (r.value.includes('.')) {
      const [rs, ra] = r.value.split('.');
      return Boolean(rs && ra);
    }
    return true; // literal right-hand value
  }
  return true;
}
export function isConditionGroupValid(g: ConditionGroup): boolean {
  if (!g.children.length) return false;
  return g.children.every((c) => (c.kind === 'rule' ? isConditionRuleValid(c) : isConditionGroupValid(c)));
}
export function countConditionRules(g: ConditionGroup): number {
  return g.children.reduce((n, c) => n + (c.kind === 'rule' ? 1 : countConditionRules(c)), 0);
}

// ---- config defaults --------------------------------------------------
export function defaultApprovalLevelConfig(): ApprovalLevelConfig {
  return {
    sla: { days: 0, hours: 0, minutes: 0, afterExpiry: 'autoReject' },
    fallback: { enabled: false },
  };
}
export function defaultParallelConfig(): ParallelConfig {
  return {
    lanes: [
      { id: nid('lane'), name: 'Branch 1', approver: {} },
      { id: nid('lane'), name: 'Branch 2', approver: {} },
    ],
    overallRule: 'all',
    requiredApprovals: 1,
    sla: { days: 0, hours: 0, minutes: 0, afterExpiry: 'autoReject' },
    fallback: { enabled: false },
  };
}
/** Factory config defaults per type (also used by config-panel Reset). */
export function defaultConfig(type: PolicyNodeType): Record<string, unknown> | undefined {
  if (type === 'approvalLevel') return defaultApprovalLevelConfig() as unknown as Record<string, unknown>;
  if (type === 'parallelBranch') return defaultParallelConfig() as unknown as Record<string, unknown>;
  if (type === 'notification') return defaultNotificationConfig() as unknown as Record<string, unknown>;
  return undefined;
}

/**
 * Build a fresh node. Approval Level + Parallel are outcome-branching nodes
 * (auto Approved/Rejected lanes); Conditional gets IF + ELSE.
 */
export function createNode(type: PolicyNodeType): PolicyNode {
  const base: PolicyNode = { id: nid(), type };
  const config = defaultConfig(type);
  if (config) base.config = config;
  if (type === 'conditionalBranch') base.branches = [ifBranch(), elseBranch()];
  if (type === 'approvalLevel') base.branches = [outcomeBranch('Approved'), outcomeBranch('Rejected')];
  // Parallel: first tier = approver lanes (from config.lanes), second tier = outcome.
  if (type === 'parallelBranch') {
    base.branches = laneBranches(base);
    base.outcomeBranches = [outcomeBranch('Approved'), outcomeBranch('Rejected')];
  }
  return base;
}

/** Parallel approver lanes (config.lanes) as first-tier branches; preserves sub-seqs by id. */
export function laneBranches(node: PolicyNode): PolicyBranch[] {
  const cfg = node.config as ParallelConfig | undefined;
  const existing = node.branches ?? [];
  return (cfg?.lanes ?? []).map((lane) => {
    const prev = existing.find((b) => b.id === lane.id);
    return { id: lane.id, label: lane.name, seq: prev?.seq ?? [], kind: 'parallelLane' as const, sealed: true };
  });
}

/** True once the SLA has a real duration set — a 0/0/0 SLA can never breach. */
function hasSlaDuration(sla: Partial<SlaConfig> | undefined): boolean {
  return !!sla && ((sla.days ?? 0) > 0 || (sla.hours ?? 0) > 0 || (sla.minutes ?? 0) > 0);
}

// ---- outcome reconciliation (config → outcome lanes) ------------------
function desiredOutcomes(node: PolicyNode): string[] {
  const out = ['Approved', 'Rejected'];
  const c = node.config as Partial<ApprovalLevelConfig & ParallelConfig> | undefined;
  // Shown once an SLA duration is set, or immediately when the reviewer chooses
  // to build a real breach path (so "Create an SLA-breach branch" is visible
  // even before days/hours/minutes are filled in — same as Fallback createBranch).
  if (hasSlaDuration(c?.sla) || c?.sla?.afterExpiry === 'createBranch') out.push('SLA Breached');
  if (node.type === 'approvalLevel' || node.type === 'parallelBranch') {
    const fb = c?.fallback;
    // Approver Not Found covers Auto Approve / Auto Reject / Notify.
    // Add Fallback Approver uses the Fallback chip + Fallback SLA Breached lane instead.
    if (fb?.enabled && fb.action && fb.action !== 'fallbackApprover') out.push('Approver Not Found');
    if (fb?.enabled && fb.action === 'fallbackApprover') out.push('Fallback SLA Breached');
  }
  return out;
}
/** An outcome lane is sealed (auto-resolves, no inserted steps) unless the
    reviewer explicitly chose to build a real branch for it. */
function outcomeSealed(node: PolicyNode, label: string): boolean {
  const c = node.config as Partial<ApprovalLevelConfig & ParallelConfig> | undefined;
  if (label === 'SLA Breached') return c?.sla?.afterExpiry !== 'createBranch';
  if (label === 'Approver Not Found') {
    const action = c?.fallback?.action;
    return action === 'autoApprove' || action === 'autoReject' || action === 'notify';
  }
  if (label === 'Fallback SLA Breached') return c?.fallback?.approverResolution !== 'createBranch';
  return false;
}
/** Recompute outcome lanes from config, preserving existing lanes' sequences by label.
    `existing` defaults to `node.branches` (Approval Level); parallel passes its
    `outcomeBranches` since its `branches` hold the approver lanes. Each lane's
    `sealed` flag is refreshed every pass so it always matches the current config. */
export function reconcileOutcomes(node: PolicyNode, existing: PolicyBranch[] = node.branches ?? []): PolicyBranch[] {
  const desired = desiredOutcomes(node);
  return desired.map((label) => {
    const sealed = outcomeSealed(node, label);
    const prev =
      existing.find((b) => b.label === label) ??
      // Rename legacy outcome label in-place so ids stay stable across reload.
      (label === 'Approver Not Found' ? existing.find((b) => b.label === 'Approver Not Resolved') : undefined);
    if (prev) return { ...prev, label, sealed, seq: sealed ? [] : prev.seq };
    return outcomeBranch(label, sealed);
  });
}

// ---- conditional lane ops --------------------------------------------
export function addElseIf(branches: PolicyBranch[]): PolicyBranch[] {
  const elseif: PolicyBranch = { id: nid('br'), label: 'ELSE IF', seq: [], kind: 'elseif', condition: emptyConditionGroup() };
  const elseIdx = branches.findIndex((b) => b.kind === 'else');
  if (elseIdx < 0) return [...branches, elseif];
  return [...branches.slice(0, elseIdx), elseif, ...branches.slice(elseIdx)];
}
export function removeBranch(branches: PolicyBranch[], id: string): PolicyBranch[] {
  return branches.filter((b) => b.id !== id);
}
export function setBranchCondition(branches: PolicyBranch[], id: string, condition: ConditionGroup): PolicyBranch[] {
  return branches.map((b) => (b.id === id ? { ...b, condition } : b));
}

// ---- approver validity ------------------------------------------------
export function laneApproverValid(a: LaneApprover | undefined): boolean {
  if (!a?.approverType) return false;
  if (a.approverType === 'governanceGroup' && !a.governanceGroupId) return false;
  if (a.approverType === 'user' && !a.userId) return false;
  return true;
}

// ---- migration (idempotent on load) ----------------------------------
export function migratePolicyNode(node: PolicyNode): PolicyNode {
  const n: PolicyNode = { ...node };
  if (n.type === 'approvalLevel') {
    if (!n.config) n.config = defaultApprovalLevelConfig() as unknown as Record<string, unknown>;
    if (!n.branches?.length) n.branches = [outcomeBranch('Approved'), outcomeBranch('Rejected')];
    n.branches = reconcileOutcomes(n, n.branches);
  }
  if (n.type === 'parallelBranch') {
    if (!n.config) n.config = defaultParallelConfig() as unknown as Record<string, unknown>;
    else {
      const cfg = n.config as unknown as ParallelConfig;
      if (!cfg.fallback) n.config = { ...cfg, fallback: { enabled: false } } as unknown as Record<string, unknown>;
    }
    // Legacy nodes stored outcome lanes in `branches`; move them to the second tier.
    const legacyOutcomes = (n.branches ?? []).filter((b) => b.kind === 'outcome');
    if (!n.outcomeBranches?.length) n.outcomeBranches = legacyOutcomes.length ? legacyOutcomes : [outcomeBranch('Approved'), outcomeBranch('Rejected')];
    n.branches = laneBranches(n);
    n.outcomeBranches = reconcileOutcomes(n, n.outcomeBranches ?? []);
  }
  if (n.type === 'conditionalBranch' && !n.branches?.length) n.branches = [ifBranch(), elseBranch()];
  if (n.type === 'notification' && !n.config) n.config = defaultNotificationConfig() as unknown as Record<string, unknown>;
  if (n.branches) n.branches = n.branches.map((b) => ({ ...b, seq: b.seq.map(migratePolicyNode) }));
  if (n.outcomeBranches) n.outcomeBranches = n.outcomeBranches.map((b) => ({ ...b, seq: b.seq.map(migratePolicyNode) }));
  return n;
}
export function migrateRoot(root: PolicyNode[]): PolicyNode[] {
  return root.map(migratePolicyNode);
}

/**
 * M3 completeness. Only flow-control nodes are configuration-free; the rest need
 * config that lands in M4–M5, so they read as incomplete for now (which correctly
 * gates Save & Activate). Refined per-type as each config is built.
 */
export function isNodeComplete(node: PolicyNode): boolean {
  switch (node.type) {
    case 'skip':
    case 'exit':
      return true;
    case 'approvalLevel': {
      const c = node.config as ApprovalLevelConfig | undefined;
      if (!c?.approverType) return false;
      if (c.approverType === 'governanceGroup' && !c.governanceGroupId) return false;
      if (c.approverType === 'user' && !c.userId) return false;
      const { days, hours, minutes } = c.sla ?? { days: 0, hours: 0, minutes: 0 };
      if (days === 0 && hours === 0 && minutes === 0) return false; // SLA required
      return true;
    }
    case 'notification': {
      const c = node.config as NotificationConfig | undefined;
      if (!c) return false;
      const enabled = [c.email, c.slack].filter((ch) => ch?.enabled);
      if (enabled.length === 0) return false; // ≥1 channel
      for (const ch of enabled) {
        if (!ch.template.name.trim()) return false; // template name required
        if (!stripHtml(ch.template.body).trim()) return false; // body required
      }
      if (c.email.enabled && !(c.email.template.subject ?? '').trim()) return false; // email subject
      return true;
    }
    case 'conditionalBranch': {
      // every IF / ELSE IF lane must have a fully-filled condition
      const lanes = (node.branches ?? []).filter((b) => b.kind === 'if' || b.kind === 'elseif');
      if (lanes.length === 0) return false;
      return lanes.every((b) => b.condition != null && isConditionGroupValid(b.condition));
    }
    case 'parallelBranch': {
      const c = node.config as ParallelConfig | undefined;
      if (!c || c.lanes.length < 2) return false; // ≥2 lanes
      if (!c.lanes.every((l) => laneApproverValid(l.approver))) return false;
      const { days, hours, minutes } = c.sla ?? { days: 0, hours: 0, minutes: 0 };
      if (days === 0 && hours === 0 && minutes === 0) return false; // SLA required
      if (c.overallRule === 'threshold' && (c.requiredApprovals < 1 || c.requiredApprovals > c.lanes.length)) return false;
      return true;
    }
    default:
      return false;
  }
}

/** Walk a node tree collecting every node (depth-first). */
export function allNodes(seq: PolicyNode[]): PolicyNode[] {
  const out: PolicyNode[] = [];
  for (const n of seq) {
    out.push(n);
    for (const b of [...(n.branches ?? []), ...(n.outcomeBranches ?? [])]) out.push(...allNodes(b.seq));
  }
  return out;
}

export function findNode(seq: PolicyNode[], id: string): PolicyNode | null {
  for (const n of seq) {
    if (n.id === id) return n;
    for (const b of [...(n.branches ?? []), ...(n.outcomeBranches ?? [])]) {
      const hit = findNode(b.seq, id);
      if (hit) return hit;
    }
  }
  return null;
}

/** Replace the sequence at `path` with `fn(seq)`, immutably. */
function mapSeqAtPath(
  seq: PolicyNode[],
  path: PathStep[],
  fn: (s: PolicyNode[]) => PolicyNode[],
): PolicyNode[] {
  if (path.length === 0) return fn(seq);
  const [step, ...rest] = path;
  return seq.map((n) => {
    if (n.id !== step.nodeId) return n;
    const mapBranch = (b: PolicyBranch) => (b.id === step.branchId ? { ...b, seq: mapSeqAtPath(b.seq, rest, fn) } : b);
    const next = { ...n };
    if (n.branches) next.branches = n.branches.map(mapBranch);
    if (n.outcomeBranches) next.outcomeBranches = n.outcomeBranches.map(mapBranch);
    return next;
  });
}

export function insertNode(root: PolicyNode[], loc: InsertLoc, node: PolicyNode): PolicyNode[] {
  return mapSeqAtPath(root, loc.path, (s) => [...s.slice(0, loc.index), node, ...s.slice(loc.index)]);
}

/** Remove a node by id anywhere in the tree (sequence reconnects automatically). */
export function deleteNode(root: PolicyNode[], id: string): PolicyNode[] {
  const strip = (seq: PolicyNode[]): PolicyNode[] =>
    seq
      .filter((n) => n.id !== id)
      .map((n) => {
        let m = n;
        if (n.branches) m = { ...m, branches: n.branches.map((b) => ({ ...b, seq: strip(b.seq) })) };
        if (n.outcomeBranches) m = { ...m, outcomeBranches: n.outcomeBranches.map((b) => ({ ...b, seq: strip(b.seq) })) };
        return m;
      });
  return strip(root);
}

/** Patch a node by id, immutably. */
export function updateNode(root: PolicyNode[], id: string, patch: Partial<PolicyNode>): PolicyNode[] {
  const walk = (seq: PolicyNode[]): PolicyNode[] =>
    seq.map((n) => {
      if (n.id === id) return { ...n, ...patch };
      let m = n;
      if (n.branches) m = { ...m, branches: n.branches.map((b) => ({ ...b, seq: walk(b.seq) })) };
      if (n.outcomeBranches) m = { ...m, outcomeBranches: n.outcomeBranches.map((b) => ({ ...b, seq: walk(b.seq) })) };
      return m;
    });
  return walk(root);
}
