/**
 * Dummy Workflow test-run planner — mirrors policy-test-run for the workflow
 * block set. Alternating pass/fail; branch picks randomized within that outcome.
 */
import type { WorkflowBranch, WorkflowNode } from '@/data/automation-types';
import { BLOCK_META } from '@/lib/workflow-tree';
import type { TestRunPlan, TestRunResult, TestRunStep } from '@/lib/policy-test-run';

export type { TestRunPlan, TestRunResult, TestRunStep };

function jitter(min = 420, max = 880): number {
  return Math.floor(min + Math.random() * (max - min));
}

function titleOf(n: WorkflowNode): string {
  return n.name?.trim() || BLOCK_META[n.type].title;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Prefer IF / first split on success; ELSE / last split on failure. */
function pickBranchLane(lanes: WorkflowBranch[], want: TestRunResult): WorkflowBranch {
  if (lanes.length === 0) throw new Error('no lanes');
  const ifLane = lanes.find((l) => l.kind === 'if' || l.kind === 'elseif');
  const elseLane = lanes.find((l) => l.kind === 'else' || l.kind === 'elseSplit');
  const splits = lanes.filter((l) => l.kind === 'split');

  if (want === 'passed') {
    if (ifLane) return ifLane;
    if (splits.length) return pick(splits);
    return pick(lanes);
  }
  if (elseLane) return elseLane;
  if (splits.length) return pick(splits);
  return pick(lanes);
}

/**
 * Build a full simulated workflow run. `want` forces the final result.
 */
export function buildWorkflowTestRunPlan(root: WorkflowNode[], want: TestRunResult): TestRunPlan {
  const steps: TestRunStep[] = [];
  const visitOrder: string[] = ['__start__'];
  let failedNodeId: string | undefined;
  let stopped = false;

  const pushStep = (partial: Omit<TestRunStep, 'id' | 'durationMs'> & { durationMs?: number }) => {
    const step: TestRunStep = {
      id: `s-${steps.length + 1}`,
      durationMs: partial.durationMs ?? jitter(),
      ...partial,
    };
    steps.push(step);
    return step;
  };

  const walkSeq = (seq: WorkflowNode[], allowFailStop: boolean): void => {
    for (const node of seq) {
      if (stopped) return;

      visitOrder.push(node.id);

      if (node.type === 'exit') {
        if (want === 'failed' && allowFailStop) {
          pushStep({ nodeId: node.id, title: titleOf(node), status: 'failed', branchLabel: 'Exit' });
          failedNodeId = node.id;
          stopped = true;
          return;
        }
        pushStep({ nodeId: node.id, title: titleOf(node), status: 'passed', branchLabel: 'Exit' });
        stopped = true;
        return;
      }

      if (
        node.type === 'notification' ||
        node.type === 'skip' ||
        node.type === 'userFilter' ||
        node.type === 'delay' ||
        node.type === 'assignEntities'
      ) {
        // On a fail run, trip on Wait-like / Assign once past filters — prefer later nodes.
        pushStep({ nodeId: node.id, title: titleOf(node), status: 'passed' });
        continue;
      }

      if (node.type === 'waitForUser') {
        const failHere = want === 'failed' && allowFailStop;
        pushStep({
          nodeId: node.id,
          title: titleOf(node),
          status: failHere ? 'failed' : 'passed',
          branchLabel: failHere ? 'Timeout' : 'Ready',
        });
        if (failHere) {
          failedNodeId = node.id;
          stopped = true;
        }
        continue;
      }

      if (node.type === 'wfConditionalBranch' || node.type === 'multisplitBranch') {
        const lanes = node.branches ?? [];
        if (!lanes.length) {
          pushStep({ nodeId: node.id, title: titleOf(node), status: 'passed' });
          continue;
        }
        const lane = pickBranchLane(lanes, want);
        pushStep({
          nodeId: node.id,
          title: titleOf(node),
          branchLabel: lane.label,
          status: 'passed',
        });
        walkSeq(lane.seq, allowFailStop);
        continue;
      }

      pushStep({ nodeId: node.id, title: titleOf(node), status: 'passed' });
    }
  };

  walkSeq(root, true);

  if (want === 'passed' && !stopped) {
    visitOrder.push('__end__');
  } else if (want === 'failed' && !failedNodeId) {
    const last = [...visitOrder].reverse().find((id) => !id.startsWith('__'));
    if (last) {
      failedNodeId = last;
      const s = steps.find((x) => x.nodeId === last);
      if (s) s.status = 'failed';
      else pushStep({ nodeId: last, title: 'Step', status: 'failed' });
    }
  }

  if (want === 'passed') {
    steps.forEach((s) => {
      if (s.status === 'failed') s.status = 'passed';
    });
    failedNodeId = undefined;
    if (!visitOrder.includes('__end__') && !stopped) visitOrder.push('__end__');
    return { result: 'passed', steps, visitOrder };
  }

  return {
    result: 'failed',
    steps,
    visitOrder,
    failedNodeId,
  };
}
