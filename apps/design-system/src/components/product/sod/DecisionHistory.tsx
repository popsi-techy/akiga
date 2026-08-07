'use client';

import * as React from 'react';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import PersonAddOutlined from '@mui/icons-material/PersonAddOutlined';
import ReportProblemOutlined from '@mui/icons-material/ReportProblemOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import { StatusChip } from '@ds/components';
import { getAccess } from '@/data/sod';
import type { AcceptedRisk, SodReview, SodRule } from '@/data/sod-types';
import { AppBadge, formatDateTime, formatUntil } from './labels';
import { RuleStatusPill } from './resolution-ui';
import { buildAuditTimeline, durationLabel, type AuditTimelineItem } from './audit-timeline';

/**
 * The review's timeline — setup events plus one consolidated submission card.
 * Surfaced as the "Review Timeline" tab on the violation page.
 *
 * Purely presentational so any container can host it; the violation page renders
 * it as a tab. The `ring-surface` on each node assumes a light container.
 */
export function DecisionHistoryTimeline({
  review,
  entries: entriesProp,
}: {
  review?: SodReview | null;
  /** @deprecated Pass `review` instead. */
  entries?: SodReview['audit'];
}) {
  const timeline = React.useMemo(() => {
    if (review) return buildAuditTimeline(review);
    const fallback = entriesProp ?? [];
    return fallback
      .filter((e) => e.action === 'Violation detected' || e.action === 'Reviewer assigned')
      .map((entry) => ({ kind: 'setup' as const, entry }));
  }, [review, entriesProp]);

  if (timeline.length === 0) {
    return <p className="text-body-sm text-text-secondary">No decisions recorded yet.</p>;
  }

  return (
    <ol className="m-0 list-none p-0">
      {timeline.map((item, i) => {
        const first = i === 0;
        const last = i === timeline.length - 1;
        const node = timelineNodeMeta(item);
        return (
          <li key={timelineKey(item, i)} className="relative flex gap-3.5">
            <div className="relative flex w-9 shrink-0 justify-center self-stretch">
              {!first && <TimelineDash className="top-0 h-9" />}
              {!last && <TimelineDash className="bottom-0 top-9" />}
              <span
                className={[
                  'relative z-[1] grid h-9 w-9 shrink-0 place-items-center rounded-full border ring-4 ring-surface',
                  node.borderClassName,
                  node.className,
                ].join(' ')}
                style={node.style}
                aria-hidden
              >
                {node.icon}
              </span>
            </div>
            <div className={['min-w-0 flex-1', last ? 'pb-0' : 'pb-4'].join(' ')}>
              {item.kind === 'setup' ? (
                <SetupAuditCard entry={item.entry} />
              ) : (
                <SubmittedDecisionCard item={item} />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function timelineKey(item: AuditTimelineItem, i: number): string {
  if (item.kind === 'setup') return `${item.entry.at}-${item.entry.action}-${i}`;
  return `${item.kind}-${item.at}-${i}`;
}

function timelineNodeMeta(item: AuditTimelineItem): {
  icon: React.ReactNode;
  className: string;
  borderClassName: string;
  style: React.CSSProperties;
} {
  if (item.kind === 'submitted') {
    return {
      icon: <CheckCircleOutlined sx={{ fontSize: 18 }} />,
      className: 'text-[var(--ds-color-status-success-fg)]',
      borderClassName: 'border-[var(--ds-color-status-success-border)]',
      style: { backgroundColor: 'var(--ds-color-status-success-subtle)' },
    };
  }
  if (item.entry.action === 'Violation detected') {
    return {
      icon: <ReportProblemOutlined sx={{ fontSize: 18 }} />,
      className: 'text-[var(--ds-color-status-warning-fg)]',
      borderClassName: 'border-[var(--ds-color-status-warning-border)]',
      style: { backgroundColor: 'var(--ds-color-status-warning-subtle)' },
    };
  }
  return {
    icon: <PersonAddOutlined sx={{ fontSize: 18 }} />,
    className: 'text-[var(--ds-color-status-info-fg)]',
    borderClassName: 'border-[var(--ds-color-status-info-border)]',
    style: { backgroundColor: 'var(--ds-color-status-info-subtle)' },
  };
}

/** Vertical timeline connector — solid light grey, 6px dash / 2px gap. */
function TimelineDash({ className }: { className: string }) {
  return (
    <div
      aria-hidden
      className={['absolute left-1/2 w-px -translate-x-1/2', className].join(' ')}
      style={{
        backgroundImage:
          'repeating-linear-gradient(to bottom, var(--ds-color-border-default) 0, var(--ds-color-border-default) 6px, transparent 6px, transparent 8px)',
      }}
    />
  );
}

function AuditTimestamp({ at, className }: { at: string; className?: string }) {
  return (
    <time
      dateTime={at}
      className={['block text-body-sm font-semibold tabular-nums text-text-primary', className].filter(Boolean).join(' ')}
    >
      {formatDateTime(at)}
    </time>
  );
}

function setupChip(action: string): { intent: 'info' | 'warning'; label: string } {
  if (action === 'Violation detected') return { intent: 'warning', label: 'Detected' };
  return { intent: 'info', label: 'Assignment' };
}

function SetupAuditCard({ entry }: { entry: SodReview['audit'][number] }) {
  const chip = setupChip(entry.action);
  return (
    <article className="rounded-xl bg-subtle p-4">
      <CardHeader
        at={entry.at}
        performer={entry.actor}
        chip={<StatusChip intent={chip.intent} label={chip.label} />}
      />
      <div className="mt-3">
        <p className="text-body-sm font-medium text-text-primary">{entry.action}</p>
        {entry.detail ? (
          <p className="mt-1.5 text-caption leading-5 text-text-secondary">{entry.detail}</p>
        ) : null}
      </div>
    </article>
  );
}

function SubmittedDecisionCard({
  item,
}: {
  item: Extract<AuditTimelineItem, { kind: 'submitted' }>;
}) {
  const removedSet = new Set(item.removedAccessIds);
  const accessToRemove = item.removedAccessIds
    .map(getAccess)
    .filter(Boolean) as NonNullable<ReturnType<typeof getAccess>>[];

  return (
    <article className="rounded-xl bg-subtle p-4">
      <CardHeader
        at={item.at}
        performer={item.actor}
        chip={<StatusChip intent="success" label="Submitted" />}
      />

      <div className="mt-3 space-y-4">
        {accessToRemove.length > 0 && (
          <section>
            <h4 className="mb-2 text-overline font-semibold uppercase text-text-tertiary">
              Access revoked <span className="tabular-nums">({accessToRemove.length})</span>
            </h4>
            <ul className="space-y-1.5">
              {accessToRemove.map((a) => {
                const n = item.removedRules.filter((r) => r.accessIds.includes(a.id)).length;
                return (
                  <li
                    key={a.id}
                    className="flex items-center gap-2.5 rounded-lg border border-border-subtle bg-surface px-2.5 py-2"
                  >
                    <AppBadge app={a.appName} size={20} variant="surface" appearance="logo" />
                    <div className="min-w-0 flex-1 truncate text-caption">
                      <span className="text-text-tertiary">{a.appName}</span>{' '}
                      <span className="font-medium text-text-primary">{a.name}</span>
                    </div>
                    {n > 0 ? (
                      <span className="shrink-0 text-caption text-text-tertiary">
                        Resolved {n} Access Combination Violation{n === 1 ? '' : 's'}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {item.removedRules.length > 0 && (
          <section>
            <h4 className="mb-2 text-overline font-semibold uppercase text-text-tertiary">
              Resolved by revoking access <span className="tabular-nums">({item.removedRules.length})</span>
            </h4>
            <div className="space-y-2">
              {item.removedRules.map((rule) => (
                <DecisionRuleCard
                  key={rule.id}
                  rule={rule}
                  removedSet={removedSet}
                  kind="removed"
                  removeJustification={item.removeJustification}
                />
              ))}
            </div>
          </section>
        )}

        {item.acceptedRules.length > 0 && (
          <section>
            <h4 className="mb-2 text-overline font-semibold uppercase text-text-tertiary">
              Resolved by accepting risk <span className="tabular-nums">({item.acceptedRules.length})</span>
            </h4>
            <div className="space-y-2">
              {item.acceptedRules.map(({ rule, acceptance }) => (
                <DecisionRuleCard
                  key={rule.id}
                  rule={rule}
                  removedSet={removedSet}
                  kind="accepted"
                  acceptance={acceptance}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

function DecisionRuleCard({
  rule,
  removedSet,
  kind,
  acceptance,
  removeJustification,
}: {
  rule: SodRule;
  removedSet: Set<string>;
  kind: 'removed' | 'accepted';
  acceptance?: AcceptedRisk;
  removeJustification?: string;
}) {
  const revokedNames = rule.accessIds
    .filter((id) => removedSet.has(id))
    .map((id) => getAccess(id)?.name)
    .filter(Boolean) as string[];

  const actionLabel =
    kind === 'removed'
      ? revokedNames.length === 0
        ? 'Access revoked'
        : revokedNames.length === 1
          ? `${revokedNames[0]} revoked`
          : `${revokedNames.join(', ')} revoked`
      : /**
         * When an exact expiry exists the line below carries it, so the headline
         * stays bare — otherwise the card states the expiry twice, once rounded to
         * 90 days and once to the minute.
         */
        acceptance && !acceptance.untilAt
        ? acceptance.duration === 'permanent'
          ? 'Risk accepted permanently'
          : `Risk accepted for ${acceptance.duration} days`
        : 'Risk accepted';

  const justification =
    kind === 'removed'
      ? removeJustification?.trim() ?? ''
      : acceptance?.justification.trim() ?? '';

  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-3">
      <div className="mb-2 flex items-center gap-2 text-caption">
        <span className="font-semibold text-text-primary">{rule.code}</span>
        <span className="ml-auto shrink-0">
          <RuleStatusPill status={kind === 'accepted' ? 'risk-accepted' : 'resolved'} />
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {rule.accessIds.map((aid, idx) => {
          const a = getAccess(aid);
          if (!a) return null;
          const revoking = removedSet.has(aid);
          return (
            <React.Fragment key={aid}>
              {idx > 0 && (
                <span className="text-caption font-semibold text-text-tertiary">AND</span>
              )}
              <span
                className={[
                  'inline-flex items-center gap-1.5 rounded-md bg-subtle py-1 pl-1 pr-2 text-caption',
                  revoking ? 'text-[var(--ds-color-status-danger-fg)]' : '',
                ].join(' ')}
              >
                <AppBadge app={a.appName} size={16} variant="surface" appearance="logo" />
                <span className={revoking ? '' : 'text-text-tertiary'}>{a.appName}</span>
                <span className={['font-medium', revoking ? '' : 'text-text-primary'].join(' ')}>
                  {a.name}
                </span>
              </span>
            </React.Fragment>
          );
        })}
      </div>

      <div className="mt-2.5 rounded-md bg-subtle px-2.5 py-2.5">
        <div className="flex items-start gap-2">
          <span
            className={[
              'mt-0.5 shrink-0',
              kind === 'removed'
                ? 'text-[var(--ds-color-status-danger-fg)]'
                : 'text-[var(--ds-color-status-warning-fg)]',
            ].join(' ')}
          >
            {kind === 'removed' ? (
              <DeleteOutline sx={{ fontSize: 16 }} />
            ) : (
              <ShieldOutlined sx={{ fontSize: 16 }} />
            )}
          </span>
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-body-sm font-medium leading-5 text-text-primary">{actionLabel}</p>
            {kind === 'accepted' && acceptance ? (
              <p className="text-caption text-text-tertiary">
                {/* Exact expiry when recorded; older acceptances only have a duration. */}
                {acceptance.untilAt
                  ? `until ${formatUntil(acceptance.untilAt)}`
                  : durationLabel(acceptance.duration)}{' '}
                · {acceptance.approverName}
              </p>
            ) : null}
            {justification ? (
              <p className="border-t border-border-subtle pt-1.5 text-caption leading-5 text-text-secondary">
                {justification}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function CardHeader({
  at,
  performer,
  chip,
}: {
  at: string;
  performer: string;
  chip: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-3">
      <div className="min-w-0">
        <AuditTimestamp at={at} />
        <p className="mt-1 text-caption text-text-tertiary">{performer}</p>
      </div>
      <div className="shrink-0">{chip}</div>
    </div>
  );
}

export default DecisionHistoryTimeline;
