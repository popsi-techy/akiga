'use client';

import * as React from 'react';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import AutorenewOutlined from '@mui/icons-material/AutorenewOutlined';
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';
import RemoveCircleOutlineOutlined from '@mui/icons-material/RemoveCircleOutlineOutlined';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import NotificationsActiveOutlined from '@mui/icons-material/NotificationsActiveOutlined';
import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined';
import SwapHorizOutlined from '@mui/icons-material/SwapHorizOutlined';
import AdminPanelSettingsOutlined from '@mui/icons-material/AdminPanelSettingsOutlined';
import ReplayOutlined from '@mui/icons-material/ReplayOutlined';
import ConfirmationNumberOutlined from '@mui/icons-material/ConfirmationNumberOutlined';
import ReportProblemOutlined from '@mui/icons-material/ReportProblemOutlined';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { Avatar, StatusChip, type StatusIntent } from '@ds/components';
import { TimelineItem, type TimelineTone } from '@/components/product/TimelineRail';
import { buildRequestTimeline } from './request-timeline';
import {
  STAGE_LABEL,
  formatGovDateTime,
  type AuditEvent,
  type GovernanceRequest,
  type LifecycleStage,
  type StageState,
} from '@/data/request-governance';

const STATE_CHIP: Record<StageState, { label: string; intent: StatusIntent }> = {
  done: { label: 'Done', intent: 'success' },
  current: { label: 'In progress', intent: 'info' },
  failed: { label: 'Failed', intent: 'danger' },
  pending: { label: 'Waiting', intent: 'neutral' },
  skipped: { label: 'Skipped', intent: 'warning' },
};

/**
 * The node for a stage: its icon and tone come from the state, so the marker, the chip
 * and the connector can never tell three different stories about one stage.
 *
 * A number in the circle said only where the stage sat in the list, which the order
 * already says. An icon says what happened to it.
 */
function stageNode(state: StageState): { icon: React.ReactNode; tone: TimelineTone } {
  const sx = { fontSize: 18 } as const;
  if (state === 'done') return { icon: <CheckCircleOutlined sx={sx} />, tone: 'success' };
  if (state === 'current') return { icon: <AutorenewOutlined sx={sx} />, tone: 'info' };
  if (state === 'failed') return { icon: <ErrorOutlineOutlined sx={sx} />, tone: 'danger' };
  if (state === 'skipped') return { icon: <RemoveCircleOutlineOutlined sx={sx} />, tone: 'warning' };
  return { icon: <ScheduleOutlined sx={sx} />, tone: 'neutral' };
}

function StageBlock({
  stage,
  first,
  last,
}: {
  stage: LifecycleStage;
  first: boolean;
  last: boolean;
}) {
  const chip = STATE_CHIP[stage.state];
  const hops = stage.hops ?? [];
  const node = stageNode(stage.state);
  return (
    <TimelineItem icon={node.icon} tone={node.tone} first={first} last={last}>
      {/* Each stage is a card, as in the SoD review timeline — it groups the stage's
          times, actor, note and approval hops into one object instead of leaving them as
          loose lines that belong to whichever heading is nearest above. */}
      <article className="rounded-xl bg-subtle p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-body-sm-strong text-text-primary">{STAGE_LABEL[stage.id]}</h3>
          <StatusChip intent={chip.intent} dot={false} label={chip.label} />
        </div>
        {/* An en dash between the clauses, not a middot. The middot now binds a date to
            its time, so using it here as well produced "Started Aug 26, 2026 · 8:05 AM ·
            Finished Aug 26, 2026 · 8:05 AM · Noah Okonkwo" — five marks at two levels,
            and no way to see which ones belonged to a timestamp. */}
        <p className="mt-1 text-caption text-text-secondary">
          {stage.startedAt ? `Started ${formatGovDateTime(stage.startedAt)}` : 'Not started'}
          {stage.completedAt ? ` – Finished ${formatGovDateTime(stage.completedAt)}` : ''}
          {stage.actor ? ` – ${stage.actor.name}` : ''}
        </p>
        {stage.note && <p className="mt-2 text-body-sm text-text-secondary">{stage.note}</p>}
        {/* Hops are white on the card's grey: they used to be a grey well on a white
            page, and the stage card has taken that grey, which would have left them
            invisible against their own container. */}
        {hops.length > 0 && (
          <ol className="mt-3 space-y-2">
            {hops.map((hop) => (
              <li
                key={hop.id}
                className="rounded-md border border-border bg-surface px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={hop.approver.name} size="s" />
                    <div className="min-w-0">
                      <div className="truncate text-body-sm-strong text-text-primary">{hop.approver.name}</div>
                      <div className="truncate text-caption text-text-secondary">
                        {hop.label}
                        {hop.approver.title ? ` · ${hop.approver.title}` : ''}
                      </div>
                    </div>
                  </div>
                  <StatusChip
                    intent={
                      hop.decision === 'approved'
                        ? 'success'
                        : hop.decision === 'rejected'
                          ? 'danger'
                          : hop.state === 'current'
                            ? 'info'
                            : 'neutral'
                    }
                    dot={false}
                    label={
                      hop.decision === 'approved'
                        ? 'Approved'
                        : hop.decision === 'rejected'
                          ? 'Rejected'
                          : hop.state === 'current'
                            ? 'Waiting'
                            : 'Queued'
                    }
                  />
                </div>
                {hop.decidedAt && (
                  <p className="mt-1.5 text-caption text-text-secondary">{formatGovDateTime(hop.decidedAt)}</p>
                )}
                {hop.note && <p className="mt-1 text-body-sm text-text-secondary">{hop.note}</p>}
              </li>
            ))}
          </ol>
        )}
      </article>
    </TimelineItem>
  );
}

/**
 * The node for an audit event.
 *
 * Interventions carry the tone of what they did — an override is a warning, a breached SLA
 * is a caution, a closed request is a success — and anything unrecognised falls back to
 * neutral rather than guessing. Neutral is the honest answer for a line we can only
 * display, not interpret.
 */
function eventNode(action: string): { icon: React.ReactNode; tone: TimelineTone } {
  const sx = { fontSize: 16 } as const;
  const a = action.trim().toLowerCase();
  if (a === 'approver nudged') return { icon: <NotificationsActiveOutlined sx={sx} />, tone: 'info' };
  if (a === 'approver reassigned') return { icon: <SwapHorizOutlined sx={sx} />, tone: 'info' };
  if (a === 'admin override') return { icon: <AdminPanelSettingsOutlined sx={sx} />, tone: 'warning' };
  if (a === 'provisioning retried') return { icon: <ReplayOutlined sx={sx} />, tone: 'info' };
  if (a === 'converted to ticket') return { icon: <ConfirmationNumberOutlined sx={sx} />, tone: 'info' };
  if (a === 'marked complete') return { icon: <CheckCircleOutlined sx={sx} />, tone: 'success' };
  if (a === 'sod conflict') return { icon: <ReportProblemOutlined sx={sx} />, tone: 'warning' };
  if (a.startsWith('sla')) return { icon: <TimerOutlined sx={sx} />, tone: 'caution' };
  if (a.startsWith('auto-alert')) return { icon: <NotificationsOutlined sx={sx} />, tone: 'neutral' };
  return { icon: <InfoOutlined sx={sx} />, tone: 'neutral' };
}

/**
 * One audit event on the trail.
 *
 * Deliberately not a card. The stages are the structure of a request and they are cards;
 * an event is something that happened during one, and giving it the same filled container
 * would flatten four stages and a dozen notifications into one undifferentiated stack.
 * The rail keeps a single node diameter either way — two sizes on one vertical line reads
 * as a misalignment, not a hierarchy — so the weight difference is carried by the fill.
 *
 * The `px-4` has no visible box behind it: it exists so an event's text starts on the same
 * vertical line as the text inside the stage cards. Without it the column has two left
 * edges 16px apart and reads as ragged rather than as two levels.
 */
function EventRow({ event }: { event: AuditEvent }) {
  return (
    <div className="px-4 pt-1.5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <h3 className="text-body-sm-strong text-text-primary">{event.action}</h3>
        <span className="text-caption text-text-secondary">{event.actor}</span>
        <span className="tabular-nums text-caption text-text-tertiary">
          {formatGovDateTime(event.at)}
        </span>
      </div>
      {event.detail && <p className="mt-1 text-body-sm text-text-secondary">{event.detail}</p>}
    </div>
  );
}

/**
 * The request's history, as one timeline.
 *
 * ## Why one tab and not two
 *
 * Lifecycle and Audit Trail were separate tabs describing the same run at two grains, and
 * the split cost the reader the only thing they were both for: when something happened
 * relative to everything else. Answering "was the approver nudged before or after
 * Security picked it up" meant holding a timestamp in your head and switching tabs. Worse,
 * the two overlapped — the audit log restated every stage transition the stage cards
 * already carried, in less detail.
 *
 * Merged, the stages are the spine and each intervention sits inside the stage it
 * happened in. `buildRequestTimeline` drops the entries a stage card already states; see
 * `request-timeline.ts` for why that blocklist is shaped the way it is.
 *
 * Purely presentational, so both the tab and the drawer can host it. The `ring-surface`
 * on each node assumes a light container.
 */
export function RequestTimeline({ row }: { row: GovernanceRequest }) {
  const items = React.useMemo(() => buildRequestTimeline(row), [row]);

  if (items.length === 0) {
    return <p className="text-body-sm text-text-secondary">Nothing has happened on this request yet.</p>;
  }

  return (
    <ol className="m-0 list-none p-0">
      {items.map((item, i) => {
        const first = i === 0;
        const last = i === items.length - 1;
        if (item.kind === 'stage') {
          return <StageBlock key={`stage-${item.stage.id}`} stage={item.stage} first={first} last={last} />;
        }
        const node = eventNode(item.event.action);
        return (
          <TimelineItem key={`event-${item.event.id}`} icon={node.icon} tone={node.tone} first={first} last={last}>
            <EventRow event={item.event} />
          </TimelineItem>
        );
      })}
    </ol>
  );
}
