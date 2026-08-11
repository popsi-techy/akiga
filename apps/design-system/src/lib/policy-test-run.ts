/**
 * Dummy Approval Policy test-run planner.
 *
 * Walks the builder tree and produces a timed step log + visit order for the
 * canvas trace. No engine — branch picks are random within a forced pass/fail
 * outcome that alternates per run.
 */
import type { PolicyBranch, PolicyNode } from '@/data/automation-types';
import { NODE_META } from '@/lib/policy-tree';

export type TestRunResult = 'passed' | 'failed';
export type TestRunStepStatus = 'passed' | 'failed' | 'skipped';

export interface TestRunStep {
  id: string;
  nodeId: string;
  title: string;
  /** Lane taken, e.g. "Approved" / "IF" — omitted for linear steps. */
  branchLabel?: string;
  status: TestRunStepStatus;
  /** Fake wall-clock ms for the UI ticker. */
  durationMs: number;
}

export interface TestRunPlan {
  result: TestRunResult;
  steps: TestRunStep[];
  /** Ordered ids for the SVG trace, including `__start__` / `__end__` markers. */
  visitOrder: string[];
  failedNodeId?: string;
}

function jitter(min = 420, max = 880): number {
  return Math.floor(min + Math.random() * (max - min));
}

function titleOf(n: PolicyNode): string {
  return n.name?.trim() || NODE_META[n.type].title;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Prefer Approved / IF on success; Rejected / ELSE / SLA on failure. */
function pickOutcomeLane(lanes: PolicyBranch[], want: TestRunResult): PolicyBranch {
  if (lanes.length === 0) throw new Error('no lanes');
  const approved = lanes.find((l) => /approved/i.test(l.label));
  const rejected = lanes.find((l) => /rejected/i.test(l.label));
  const sla = lanes.find((l) => /sla/i.test(l.label));
  const ifLane = lanes.find((l) => l.kind === 'if' || l.kind === 'elseif');
  const elseLane = lanes.find((l) => l.kind === 'else');

  if (want === 'passed') {
    const prefer = [approved, ifLane].filter(Boolean) as PolicyBranch[];
    // Stay inside success-shaped lanes — never drift into Rejected on a pass run.
    if (prefer.length) return prefer.length === 1 ? prefer[0] : pick(prefer);
    return pick(lanes);
  }
  const prefer = [rejected, sla, elseLane].filter(Boolean) as PolicyBranch[];
  if (prefer.length) return pick(prefer);
  return pick(lanes);
}

function isFailLane(label: string): boolean {
  return /reject|sla|else/i.test(label) && !/approve/i.test(label);
}

/**
 * Build a full simulated run. `want` forces the final result; branch choice is
 * still randomized within that constraint.
 */
export function buildTestRunPlan(root: PolicyNode[], want: TestRunResult): TestRunPlan {
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

  const walkSeq = (seq: PolicyNode[], allowFailStop: boolean): void => {
    for (const node of seq) {
      if (stopped) return;

      visitOrder.push(node.id);

      if (node.type === 'exit') {
        // Exit always ends the path — treat as failure stop when we wanted fail,
        // otherwise as a controlled terminal (still "passed" overall if we reached
        // a deliberate Exit on a success run… rare; mark passed step).
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

      if (node.type === 'notification' || node.type === 'skip') {
        pushStep({ nodeId: node.id, title: titleOf(node), status: 'passed' });
        continue;
      }

      if (node.type === 'conditionalBranch') {
        const lanes = node.branches ?? [];
        if (!lanes.length) {
          pushStep({ nodeId: node.id, title: titleOf(node), status: 'passed' });
          continue;
        }
        const lane = pickOutcomeLane(lanes, want);
        pushStep({
          nodeId: node.id,
          title: titleOf(node),
          branchLabel: lane.label,
          status: 'passed',
        });
        walkSeq(lane.seq, allowFailStop);
        // Conditional merges unless we stopped inside the lane.
        continue;
      }

      if (node.type === 'parallelBranch') {
        const lanes = node.branches ?? [];
        // Parallel approver slots resolve together (dummy — all pass).
        for (const lane of lanes) {
          pushStep({
            nodeId: node.id,
            title: `${titleOf(node)} · ${lane.label}`,
            branchLabel: lane.label,
            status: 'passed',
            durationMs: jitter(280, 520),
          });
        }
        const outcomes = node.outcomeBranches ?? [];
        if (outcomes.length) {
          const lane = pickOutcomeLane(outcomes, want);
          const failHere = want === 'failed' && allowFailStop && isFailLane(lane.label);
          pushStep({
            nodeId: node.id,
            title: titleOf(node),
            branchLabel: lane.label,
            status: failHere ? 'failed' : 'passed',
          });
          walkSeq(lane.seq, allowFailStop && !failHere);
          if (failHere) {
            failedNodeId = node.id;
            stopped = true;
            return;
          }
        } else {
          pushStep({ nodeId: node.id, title: titleOf(node), status: 'passed' });
        }
        continue;
      }

      if (node.type === 'approvalLevel') {
        // Outcomes live in `branches` for approval levels.
        const outcomes = (node.branches ?? []).filter((b) => b.kind === 'outcome' || !b.kind);
        const lanes = outcomes.length ? outcomes : node.branches ?? [];
        if (!lanes.length) {
          pushStep({ nodeId: node.id, title: titleOf(node), status: 'passed' });
          continue;
        }
        const lane = pickOutcomeLane(lanes, want);
        const failHere = want === 'failed' && allowFailStop && isFailLane(lane.label);
        pushStep({
          nodeId: node.id,
          title: titleOf(node),
          branchLabel: lane.label,
          status: failHere ? 'failed' : 'passed',
        });
        walkSeq(lane.seq, allowFailStop && !failHere);
        if (failHere) {
          failedNodeId = node.id;
          stopped = true;
          return;
        }
        continue;
      }

      pushStep({ nodeId: node.id, title: titleOf(node), status: 'passed' });
    }
  };

  walkSeq(root, true);

  if (want === 'passed' && !stopped) {
    visitOrder.push('__end__');
  } else if (want === 'passed' && stopped && !failedNodeId) {
    // Ended via Exit on a success-shaped path — still passed.
  } else if (want === 'failed' && !failedNodeId) {
    // No reject lane found — fail the last visited real node.
    const last = [...visitOrder].reverse().find((id) => !id.startsWith('__'));
    if (last) {
      failedNodeId = last;
      const s = steps.find((x) => x.nodeId === last);
      if (s) s.status = 'failed';
      else pushStep({ nodeId: last, title: 'Step', status: 'failed' });
    }
  }

  // Ensure declared result matches.
  const result: TestRunResult = failedNodeId ? 'failed' : 'passed';
  // If we wanted pass but somehow failed, drop the failure mark on the last fail step.
  if (want === 'passed' && result === 'failed') {
    steps.forEach((s) => {
      if (s.status === 'failed') s.status = 'passed';
    });
    failedNodeId = undefined;
    if (!visitOrder.includes('__end__')) visitOrder.push('__end__');
    return { result: 'passed', steps, visitOrder };
  }

  return {
    result: want,
    steps,
    visitOrder,
    failedNodeId: want === 'failed' ? failedNodeId : undefined,
  };
}

/** Total planned duration for progress UI. */
export function planDurationMs(plan: TestRunPlan): number {
  return plan.steps.reduce((n, s) => n + s.durationMs, 0);
}
