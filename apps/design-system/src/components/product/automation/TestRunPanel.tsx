'use client';

import * as React from 'react';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import HourglassEmptyOutlined from '@mui/icons-material/HourglassEmptyOutlined';
import PlayArrowOutlined from '@mui/icons-material/PlayArrowOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import { Button } from '@ds/components';
import type { TestRunPlan, TestRunResult, TestRunStep } from '@/lib/policy-test-run';

export type TestRunPhase = 'idle' | 'running' | 'done';

/**
 * Right-rail results for the Approval Policy Test Run. Keeps the log calm and
 * scannable — outcome first, then a chronological step list.
 */
export function TestRunPanel({
  phase,
  plan,
  revealedCount,
  elapsedMs,
  onRunAgain,
  onExit,
}: {
  phase: Exclude<TestRunPhase, 'idle'>;
  plan: TestRunPlan | null;
  /** How many steps have been revealed during the ticker. */
  revealedCount: number;
  elapsedMs: number;
  onRunAgain: () => void;
  onExit: () => void;
}) {
  const result: TestRunResult | 'running' = phase === 'running' ? 'running' : plan?.result ?? 'passed';
  const steps = plan?.steps.slice(0, revealedCount) ?? [];

  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-l border-border bg-surface">
      <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <div className="text-overline uppercase tracking-[0.06em] text-text-tertiary">Test run</div>
          <div className="mt-1 text-body-strong text-text-primary">Simulated request</div>
        </div>
        <button
          type="button"
          onClick={onExit}
          aria-label="Exit test run"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-icon hover:bg-surface-hover"
        >
          <CloseOutlined sx={{ fontSize: 18 }} />
        </button>
      </div>

      <div className="border-b border-border px-4 py-4">
        <OutcomeHeader result={result} elapsedMs={elapsedMs} />
      </div>

      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="mb-2 text-caption-strong text-text-tertiary">Steps</div>
        {steps.length === 0 && phase === 'running' ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-md bg-subtle" />
            ))}
          </div>
        ) : (
          <ol className="space-y-2">
            {steps.map((s, i) => (
              <StepRow key={s.id} step={s} index={i + 1} />
            ))}
          </ol>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-4 py-3">
        <Button variant="secondary" onClick={onExit}>
          Exit
        </Button>
        <Button startIcon={<PlayArrowOutlined />} onClick={onRunAgain} disabled={phase === 'running'}>
          Run again
        </Button>
      </div>
    </aside>
  );
}

function OutcomeHeader({ result, elapsedMs }: { result: TestRunResult | 'running'; elapsedMs: number }) {
  if (result === 'running') {
    return (
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-subtle text-brand">
          <HourglassEmptyOutlined sx={{ fontSize: 22 }} />
        </span>
        <div>
          <div className="text-body-strong text-text-primary">Running…</div>
          <div className="mt-0.5 text-caption text-text-secondary tabular-nums">{formatMs(elapsedMs)}</div>
        </div>
      </div>
    );
  }
  const ok = result === 'passed';
  return (
    <div className="flex items-center gap-3">
      <span
        className={[
          'grid h-10 w-10 place-items-center rounded-full',
          ok
            ? 'bg-[var(--ds-color-status-success-subtle)] text-[var(--ds-color-status-success-fg)]'
            : 'bg-[var(--ds-color-status-danger-subtle)] text-[var(--ds-color-status-danger-fg)]',
        ].join(' ')}
      >
        {ok ? <CheckCircleOutlined sx={{ fontSize: 22 }} /> : <CancelOutlined sx={{ fontSize: 22 }} />}
      </span>
      <div>
        <div className="text-body-strong text-text-primary">{ok ? 'Passed' : 'Failed'}</div>
        <div className="mt-0.5 text-caption text-text-secondary tabular-nums">
          Completed in {formatMs(elapsedMs)}
        </div>
      </div>
    </div>
  );
}

function StepRow({ step, index }: { step: TestRunStep; index: number }) {
  const icon =
    step.status === 'failed' ? (
      <CancelOutlined sx={{ fontSize: 16, color: 'var(--ds-color-status-danger-fg)' }} />
    ) : step.status === 'passed' ? (
      <CheckCircleOutlined sx={{ fontSize: 16, color: 'var(--ds-color-status-success-fg)' }} />
    ) : (
      <HourglassEmptyOutlined sx={{ fontSize: 16, color: 'var(--ds-color-text-tertiary)' }} />
    );

  return (
    <li className="flex gap-2.5 rounded-md border border-border bg-canvas px-3 py-2.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-body-sm-medium text-text-primary">
            <span className="mr-1.5 text-caption text-text-tertiary tabular-nums">{index}.</span>
            {step.title}
          </span>
          <span className="shrink-0 text-caption tabular-nums text-text-tertiary">{step.durationMs}ms</span>
        </span>
        {step.branchLabel ? (
          <span className="mt-0.5 block truncate text-caption text-text-secondary">via {step.branchLabel}</span>
        ) : null}
      </span>
    </li>
  );
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Slim mode strip under the builder header. */
export function TestRunBanner({
  phase,
  result,
  onExit,
  onStop,
}: {
  phase: Exclude<TestRunPhase, 'idle'>;
  result?: TestRunResult;
  onExit: () => void;
  onStop: () => void;
}) {
  const label =
    phase === 'running' ? 'Running…' : result === 'failed' ? 'Failed' : 'Passed';
  const tone =
    phase === 'running'
      ? 'text-text-secondary'
      : result === 'failed'
        ? 'text-[var(--ds-color-status-danger-fg)]'
        : 'text-[var(--ds-color-status-success-fg)]';

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-subtle px-5 py-2">
      <div className="flex min-w-0 items-center gap-2 text-body-sm">
        <span className="text-body-sm-medium text-text-primary">Test run</span>
        <span className="text-text-disabled" aria-hidden>
          ·
        </span>
        <span className="text-text-secondary">Simulated request</span>
        <span className="text-text-disabled" aria-hidden>
          ·
        </span>
        <span className={['text-body-sm-medium', tone].join(' ')}>{label}</span>
      </div>
      {phase === 'running' ? (
        <button
          type="button"
          onClick={onStop}
          className="rounded-md px-2.5 py-1 text-caption-strong text-text-secondary hover:bg-surface-hover hover:text-text-primary"
        >
          Stop
        </button>
      ) : (
        <button
          type="button"
          onClick={onExit}
          className="rounded-md px-2.5 py-1 text-caption-strong text-text-secondary hover:bg-surface-hover hover:text-text-primary"
        >
          Exit
        </button>
      )}
    </div>
  );
}
