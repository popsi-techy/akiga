import type {
  ApprovalLevelConfig,
  ApprovalPolicy,
  NotificationConfig,
  ParallelConfig,
  PolicyNode,
} from '@/data/automation-types';
import { APPROVER_TYPE_LABEL, type ConditionGroup } from '@/data/automation-types';
import { getGovernanceGroup, getUser } from '@/data/directory';
import { flattenRules, ruleText } from '@/components/product/automation/condition-format';
import { isPolicyOperand, policyRuleText } from '@/data/policy-conditions';
import { isNodeComplete } from '@/lib/policy-tree';

/**
 * Flattens an approval policy's node tree into an ordered list of **stages**.
 *
 * The builder models a graph — branches fan out, lanes merge, outcomes tier. A
 * read-only summary does not need that, and rendering it as a graph asks the
 * reader to trace edges to answer a question that is really linear: *who decides,
 * in what order, and by when*. So the branch structure is not drawn; it is
 * carried on each stage as the conditions under which that stage runs.
 *
 * Only decision points become stages (approval levels and parallel approvals) —
 * an "approval policy" with four stages should mean four approvals, not four
 * boxes. Everything else that still has an effect (notifications, early exits)
 * is kept as a note between stages so the preview does not quietly omit it.
 */

/** How a stage was reached: one entry per branch it sits inside, outermost first. */
export interface StageCondition {
  /** `if` carries a rule; `else` is the fallback path of its branch. */
  kind: 'if' | 'else';
  /** Human-readable rule, e.g. `Department = Finance`. Empty for `else`. */
  text: string;
  /** More rules exist on this branch than the one shown. */
  extra: number;
}

export interface PolicyStage {
  /** 1-based position in execution order. */
  number: number;
  nodeId: string;
  kind: 'approval' | 'parallel';
  /** Stage heading — who decides. Parallel stages list every lane. */
  approvers: string[];
  /** `1d 4h`, or empty when no SLA is set. */
  sla: string;
  /** How agreement is reached, e.g. `Any one approver decides`. */
  rule?: string;
  /** What happens when no approver can be resolved. */
  fallback?: string;
  /** Conditions gating this stage. Empty means it always runs. */
  conditions: StageCondition[];
  /** False when the step still needs configuration in the builder. */
  complete: boolean;
}

/** A non-deciding step that still does something, anchored after a stage. */
export interface PolicyStageNote {
  /** Stage number this follows; 0 when it runs before the first stage. */
  after: number;
  label: string;
  detail: string;
}

export interface PolicyStageModel {
  stages: PolicyStage[];
  notes: PolicyStageNote[];
}

function slaLabel(sla?: { days?: number; hours?: number; minutes?: number }): string {
  if (!sla) return '';
  const parts: string[] = [];
  if (sla.days) parts.push(`${sla.days}d`);
  if (sla.hours) parts.push(`${sla.hours}h`);
  if (sla.minutes) parts.push(`${sla.minutes}m`);
  return parts.join(' ');
}

/** Resolves an approver reference to the name a reader would recognise. */
function approverName(a: {
  approverType?: string;
  governanceGroupId?: string;
  userId?: string;
}): string {
  if (!a.approverType) return 'No approver selected';
  const type = a.approverType as keyof typeof APPROVER_TYPE_LABEL;
  if (a.approverType === 'governanceGroup') {
    return getGovernanceGroup(a.governanceGroupId ?? '')?.name ?? APPROVER_TYPE_LABEL[type];
  }
  if (a.approverType === 'user') {
    return getUser(a.userId ?? '')?.name ?? APPROVER_TYPE_LABEL[type];
  }
  return APPROVER_TYPE_LABEL[type];
}

const COMPLETION_RULE: Record<string, string> = {
  anyOne: 'Any one approver decides',
  all: 'Every approver must approve',
  majority: 'A majority must approve',
};

/** Plain-English summary of a parallel stage's overall rule. */
function overallRule(c: ParallelConfig): string {
  const n = c.lanes.length;
  switch (c.overallRule) {
    case 'anyOne':
      return 'Any one approver decides';
    case 'all':
      return `All ${n} must approve`;
    case 'majority':
      return 'A majority must approve';
    case 'threshold':
      return `${c.requiredApprovals} of ${n} must approve`;
    default:
      return '';
  }
}

function fallbackText(f?: { enabled?: boolean; action?: string; approverEmail?: string }): string | undefined {
  if (!f?.enabled || !f.action) return undefined;
  switch (f.action) {
    case 'autoApprove':
      return 'Auto-approves if no approver is found';
    case 'autoReject':
      return 'Auto-rejects if no approver is found';
    case 'fallbackApprover':
      return f.approverEmail ? `Falls back to ${f.approverEmail}` : 'Falls back to a named approver';
    case 'notify':
      return 'Notifies an administrator if no approver is found';
    default:
      return undefined;
  }
}

/** First rule of a condition group as text, plus how many more it hides. */
function conditionSummary(group?: ConditionGroup): { text: string; extra: number } {
  if (!group) return { text: '', extra: 0 };
  const rules = flattenRules(group);
  if (rules.length === 0) return { text: '', extra: 0 };
  // Policy operands ("requester.department") resolve through a different label
  // table than plain attributes; using the wrong one renders a literal
  // "Attribute" where the subject's name belongs. Same split the builder makes.
  const r = rules[0];
  return {
    text: isPolicyOperand(r.attribute) ? policyRuleText(r) : ruleText(r),
    extra: rules.length - 1,
  };
}

export function toStages(root: PolicyNode[]): PolicyStageModel {
  const stages: PolicyStage[] = [];
  const notes: PolicyStageNote[] = [];

  const walk = (seq: PolicyNode[], conditions: StageCondition[]) => {
    for (const node of seq) {
      if (node.type === 'approvalLevel') {
        const c = node.config as ApprovalLevelConfig | undefined;
        stages.push({
          number: stages.length + 1,
          nodeId: node.id,
          kind: 'approval',
          approvers: [approverName(c ?? {})],
          sla: slaLabel(c?.sla),
          rule: c?.completionRule ? COMPLETION_RULE[c.completionRule] : undefined,
          fallback: fallbackText(c?.fallback),
          conditions,
          complete: isNodeComplete(node),
        });
        continue;
      }

      if (node.type === 'parallelBranch') {
        const c = node.config as ParallelConfig | undefined;
        stages.push({
          number: stages.length + 1,
          nodeId: node.id,
          kind: 'parallel',
          approvers: (c?.lanes ?? []).map((l) => approverName(l.approver)),
          sla: slaLabel(c?.sla),
          rule: c ? overallRule(c) : undefined,
          fallback: fallbackText(c?.fallback),
          conditions,
          complete: isNodeComplete(node),
        });
        // Outcome lanes (Approved / Rejected) are the result of this stage, not
        // stages of their own — don't recurse into them.
        continue;
      }

      if (node.type === 'conditionalBranch') {
        // Not a stage: it decides *which* stages run. Each lane's stages inherit
        // the condition that reaches them.
        for (const branch of node.branches ?? []) {
          const isElse = branch.kind === 'else';
          const s = conditionSummary(branch.condition);
          walk(branch.seq, [
            ...conditions,
            isElse
              ? { kind: 'else', text: '', extra: 0 }
              : { kind: 'if', text: s.text || 'a condition that is not set', extra: s.extra },
          ]);
        }
        continue;
      }

      if (node.type === 'notification') {
        const c = node.config as NotificationConfig | undefined;
        const on = [c?.email.enabled && 'Email', c?.slack.enabled && 'Slack'].filter(Boolean) as string[];
        notes.push({
          after: stages.length,
          label: node.name ?? 'Notification',
          detail: on.length ? on.join(' + ') : 'No channels enabled',
        });
        continue;
      }

      if (node.type === 'exit' || node.type === 'skip') {
        notes.push({
          after: stages.length,
          label: node.type === 'exit' ? 'Exit' : 'Skip',
          detail: node.type === 'exit' ? 'The request ends here' : 'This step is skipped',
        });
      }
    }
  };

  walk(root, []);
  return { stages, notes };
}

/** Longest SLA across every stage — "how long can this take?". */
export function longestStageSla(stages: PolicyStage[]): string {
  return stages.reduce((best, s) => (s.sla.length > best.length ? s.sla : best), '');
}

export const stageCount = (policy: ApprovalPolicy) => toStages(policy.root).stages.length;
