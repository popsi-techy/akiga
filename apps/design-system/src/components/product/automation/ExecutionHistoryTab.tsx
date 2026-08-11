'use client';

import * as React from 'react';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import HourglassEmptyOutlined from '@mui/icons-material/HourglassEmptyOutlined';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import MailOutline from '@mui/icons-material/MailOutline';
import SkipNextOutlined from '@mui/icons-material/SkipNextOutlined';
import Person from '@mui/icons-material/Person';
import CheckCircle from '@mui/icons-material/CheckCircle';
import History from '@mui/icons-material/History';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import { Avatar, Card, InfoRow, InfoRowGroup, StatusChip } from '@ds/components';
import { infoIcon } from '@/components/product/directory';
import {
  listRuns,
  runStats,
  runUserName,
  RUNS_AS_OF,
  type ApprovalRun,
  type RunGrant,
  type RunOutcome,
  type RunStep,
  type StepDecision,
} from '@/data/approval-runs';

/* ------------------------------------------------------------------ *
 * Formatting — all relative to RUNS_AS_OF, never to the wall clock, so
 * the same run always reads the same way.
 * ------------------------------------------------------------------ */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parts(iso: string) {
  const d = new Date(iso);
  return {
    day: d.getUTCDate(),
    month: MONTHS[d.getUTCMonth()],
    year: d.getUTCFullYear(),
    hh: String(d.getUTCHours()).padStart(2, '0'),
    mm: String(d.getUTCMinutes()).padStart(2, '0'),
  };
}
/** "8 Aug 2026" */
function formatDate(iso: string): string {
  const p = parts(iso);
  return `${p.day} ${p.month} ${p.year}`;
}
/** "02:11" — 24-hour, UTC, so it never drifts by viewer timezone. */
function formatTime(iso: string): string {
  const p = parts(iso);
  return `${p.hh}:${p.mm}`;
}
/** "2 days ago" against the model's fixed now. */
function relative(iso: string): string {
  const ms = new Date(RUNS_AS_OF).getTime() - new Date(iso).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/* ------------------------------------------------------------------ *
 * Status vocabulary
 * ------------------------------------------------------------------ */

const OUTCOME: Record<RunOutcome, { label: string; intent: 'success' | 'danger' | 'warning' | 'info' | 'caution'; Icon: React.ComponentType<{ sx?: object }> }> = {
  approved: { label: 'Approved', intent: 'success', Icon: CheckCircleOutlined },
  rejected: { label: 'Rejected', intent: 'danger', Icon: CancelOutlined },
  expired: { label: 'Expired', intent: 'caution', Icon: TimerOutlined },
  running: { label: 'Running', intent: 'info', Icon: HourglassEmptyOutlined },
  failed: { label: 'Failed', intent: 'danger', Icon: ErrorOutlineOutlined },
};

const DECISION: Record<StepDecision, { label: string; tone: 'success' | 'danger' | 'neutral' | 'warning' | 'info'; Icon: React.ComponentType<{ sx?: object }> }> = {
  approved: { label: 'Approved', tone: 'success', Icon: CheckCircleOutlined },
  rejected: { label: 'Rejected', tone: 'danger', Icon: CancelOutlined },
  'auto-approved': { label: 'Auto-approved', tone: 'success', Icon: CheckCircleOutlined },
  'auto-rejected': { label: 'Auto-rejected', tone: 'danger', Icon: TimerOutlined },
  notified: { label: 'Sent', tone: 'neutral', Icon: MailOutline },
  skipped: { label: 'Skipped', tone: 'warning', Icon: SkipNextOutlined },
  pending: { label: 'Waiting', tone: 'info', Icon: HourglassEmptyOutlined },
  escalated: { label: 'Escalated', tone: 'warning', Icon: TrendingUpOutlined },
};

const GRANT_INTENT: Record<RunGrant['result'], { label: string; intent: 'success' | 'danger' | 'neutral' | 'info' }> = {
  granted: { label: 'Granted', intent: 'success' },
  revoked: { label: 'Revoked', intent: 'neutral' },
  failed: { label: 'Failed', intent: 'danger' },
  pending: { label: 'Pending', intent: 'info' },
};

const STEP_COLOR: Record<'success' | 'danger' | 'neutral' | 'warning' | 'info', string> = {
  success: 'var(--ds-color-status-success-fg)',
  danger: 'var(--ds-color-status-danger-fg)',
  warning: 'var(--ds-color-status-warning-fg)',
  info: 'var(--ds-color-status-info-fg)',
  neutral: 'var(--ds-color-icon-default)',
};

/* ------------------------------------------------------------------ *
 * Left — the run list
 * ------------------------------------------------------------------ */

/**
 * One run in the left rail. Time leads, because that is what an operator scans
 * for: "what ran on Friday?". The outcome rides alongside as a dot rather than a
 * chip, so a column of twenty runs stays a column of times, not a wall of pills.
 */
function RunRow({ run, active, onSelect }: { run: ApprovalRun; active: boolean; onSelect: () => void }) {
  const o = OUTCOME[run.outcome];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? 'true' : undefined}
      className={[
        'flex w-full items-start gap-3 border-l-2 px-3 py-2.5 text-left transition-colors',
        active ? 'border-l-brand bg-surface-selected' : 'border-l-transparent hover:bg-surface-hover',
      ].join(' ')}
    >
      <span className="mt-1 shrink-0" style={{ color: STEP_COLOR[o.intent === 'caution' ? 'warning' : o.intent] }}>
        <o.Icon sx={{ fontSize: 16 }} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-body-sm-strong tabular-nums text-text-primary">{formatTime(run.startedAt)}</span>
          <span className="shrink-0 text-caption tabular-nums text-text-tertiary">{formatDate(run.startedAt)}</span>
        </span>
        <span className="mt-0.5 block truncate text-caption text-text-secondary">{run.request}</span>
        <span className="mt-1 flex items-center gap-1.5">
          <span className="text-caption text-text-tertiary">{o.label}</span>
          {run.duration && <span className="text-caption tabular-nums text-text-tertiary">· {run.duration}</span>}
          {run.slaBreached && <StatusChip intent="warning" dot={false} label="SLA" />}
        </span>
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * Right — one run in full
 * ------------------------------------------------------------------ */

function StepTimeline({ steps }: { steps: RunStep[] }) {
  return (
    <ol className="px-5 py-1">
      {steps.map((step, i) => {
        const d = DECISION[step.decision];
        const last = i === steps.length - 1;
        return (
          <li key={`${step.nodeId}-${i}`} className="relative flex gap-3 pb-4 last:pb-1">
            {!last && <span aria-hidden className="absolute bottom-0 left-[11px] top-6 w-px bg-border" />}
            <span
              className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border bg-surface"
              style={{ color: STEP_COLOR[d.tone] }}
            >
              <d.Icon sx={{ fontSize: 14 }} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-body-sm-strong text-text-primary">{step.label}</span>
                <span className="text-caption text-text-tertiary">{d.label}</span>
                {step.at && <span className="ml-auto shrink-0 text-caption tabular-nums text-text-tertiary">{formatTime(step.at)}</span>}
              </div>
              <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-caption text-text-secondary">
                <span className="min-w-0 truncate">{step.approver}</span>
                {step.duration && <span className="tabular-nums text-text-tertiary">· took {step.duration}</span>}
              </div>
              {step.note && (
                <p className="mt-1.5 rounded-md bg-sunken px-2.5 py-1.5 text-caption text-text-secondary">{step.note}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * What each person ended up with. A list rather than a table: a run grants one to
 * three things, so a table spends a header row and a pager on nothing, and its
 * fixed columns overflow the detail pane the moment an entitlement name is long.
 */
function GrantsList({ grants }: { grants: RunGrant[] }) {
  if (grants.length === 0) {
    return (
      <div className="px-5 py-6 text-center">
        <div className="text-body-sm-strong text-text-primary">Nothing was provisioned</div>
        <p className="mt-1 text-caption text-text-secondary">
          This run ended before any access was granted, so there is nothing to show here.
        </p>
      </div>
    );
  }
  return (
    <ul>
      {grants.map((g, i) => (
        <li
          key={`${g.userId}-${g.target}-${i}`}
          className="flex items-start gap-3 border-b border-border px-5 py-3 last:border-b-0"
        >
          <Avatar name={runUserName(g.userId)} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="truncate text-body-sm-strong text-text-primary">{runUserName(g.userId)}</span>
              <span className="text-caption text-text-tertiary">received</span>
            </div>
            <div className="mt-0.5 truncate text-body-sm text-text-primary">{g.target}</div>
            <div className="truncate text-caption text-text-tertiary">
              {g.targetKind} · {g.application}
            </div>
            {g.detail && <div className="mt-1 text-caption text-text-secondary">{g.detail}</div>}
          </div>
          <span className="shrink-0">
            <StatusChip intent={GRANT_INTENT[g.result].intent} label={GRANT_INTENT[g.result].label} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function RunDetail({ run }: { run: ApprovalRun }) {
  const o = OUTCOME[run.outcome];
  return (
    <div className="ds-scroll h-full overflow-y-auto pr-0.5">
      {/* Identity of the run */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-h5 text-text-primary">{run.reference}</h3>
            <StatusChip intent={o.intent} label={o.label} />
            {run.slaBreached && <StatusChip intent="warning" label="SLA breached" />}
          </div>
          <p className="mt-1 text-body-sm text-text-secondary">{run.request}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-body-sm-strong tabular-nums text-text-primary">
            {formatDate(run.startedAt)} · {formatTime(run.startedAt)}
          </div>
          <div className="text-caption text-text-tertiary">{relative(run.startedAt)}</div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <Card title="Approval path" icon={<Person />} padding="none">
            <StepTimeline steps={run.steps} />
          </Card>

          <Card title={`Access provisioned (${run.grants.length})`} icon={<CheckCircle />} padding="none">
            <GrantsList grants={run.grants} />
          </Card>
        </div>

        <Card title="Run details" icon={<History />} padding="none">
          <InfoRowGroup>
            <InfoRow icon={infoIcon.outcome} label="Outcome" value={<StatusChip intent={o.intent} label={o.label} />} />
            <InfoRow icon={infoIcon.trigger} label="Triggered by" value={run.trigger} />
            <InfoRow icon={infoIcon.person} label="Requested by" value={runUserName(run.requesterId)} />
            <InfoRow icon={infoIcon.person} label="Access for" value={runUserName(run.targetUserId)} />
            <InfoRow icon={infoIcon.started} label="Started" value={`${formatDate(run.startedAt)} ${formatTime(run.startedAt)}`} />
            <InfoRow icon={infoIcon.completed} label="Completed" value={run.completedAt ? `${formatDate(run.completedAt)} ${formatTime(run.completedAt)}` : 'Still running'} />
            <InfoRow icon={infoIcon.duration} label="Duration" value={run.duration ?? '—'} />
            <InfoRow icon={infoIcon.steps} label="Steps" value={String(run.steps.length)} />
          </InfoRowGroup>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The tab
 * ------------------------------------------------------------------ */

/**
 * Execution history — the Owners-tab shape: a fixed-width rail on the left listing
 * every run by when it happened, and the selected run in full on the right. The
 * split is right because the question is always two-part — "which run?", then
 * "what happened in it?" — and a single table answers only the first.
 */
export function ExecutionHistoryTab({ policyId }: { policyId: string }) {
  const runs = React.useMemo(() => listRuns(policyId), [policyId]);
  const stats = React.useMemo(() => runStats(policyId), [policyId]);
  const [selectedId, setSelectedId] = React.useState<string | null>(runs[0]?.id ?? null);
  React.useEffect(() => setSelectedId(runs[0]?.id ?? null), [runs]);

  const selected = runs.find((r) => r.id === selectedId) ?? null;

  if (runs.length === 0) {
    return (
      <Card className="h-full">
        <div className="flex h-full flex-col items-center justify-center gap-1 py-16 text-center">
          <span className="mb-1 grid h-11 w-11 place-items-center rounded-full bg-subtle text-icon">
            <HistoryOutlined sx={{ fontSize: 22 }} />
          </span>
          <div className="text-h5 text-text-primary">This policy has never run</div>
          <p className="max-w-sm text-body-sm text-text-secondary">
            Execution history appears once a request is decided under this policy. A draft policy
            routes nothing, so activate it to start collecting runs.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid h-full gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
      {/* Left: run list, newest first */}
      <Card padding="none" className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 border-b border-border px-4 py-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-body-sm-strong text-text-primary">Runs</span>
            <span className="text-caption tabular-nums text-text-tertiary">{stats.total} total</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-caption text-text-secondary">
            <span className="tabular-nums">{stats.approvalRate}% approved</span>
            {stats.running > 0 && <span className="tabular-nums">{stats.running} running</span>}
            {stats.breached > 0 && (
              <span className="tabular-nums" style={{ color: 'var(--ds-color-status-warning-fg)' }}>
                {stats.breached} SLA breached
              </span>
            )}
          </div>
        </div>
        <div className="ds-scroll min-h-0 flex-1 overflow-y-auto py-1">
          {runs.map((run) => (
            <RunRow key={run.id} run={run} active={run.id === selectedId} onSelect={() => setSelectedId(run.id)} />
          ))}
        </div>
      </Card>

      {/* Right: the selected run */}
      <div className="min-h-0 min-w-0">{selected && <RunDetail run={selected} />}</div>
    </div>
  );
}
