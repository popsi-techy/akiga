'use client';

import * as React from 'react';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import HourglassEmptyOutlined from '@mui/icons-material/HourglassEmptyOutlined';
import PostAddOutlined from '@mui/icons-material/PostAddOutlined';
import { Avatar, FileAttachmentField } from '@ds/components';
import { TimelineItem, type TimelineTone } from '@/components/product/TimelineRail';
import { formatDateTime } from '@/lib/datetime';
import {
  STAGE_LABEL,
  approvalFlowComplete,
  approvalLevels,
  hopApprovers,
  requiredApprovalCount,
  visibleApprovalLevels,
  type ApprovalHop,
  type GovernanceRequest,
  type ItemFlowProgress,
} from '@/data/request-governance';
import { ApproverCard } from './ApproverCard';
import { LevelStateChip, levelApproverLine, levelToneOf, type FlowTone } from './flowVocabulary';

/**
 * The approval chain for one cart line, as a timeline.
 *
 * The same rail the SoD review and the request lifecycle use — a dashed column of dated
 * events, each with a node in its own state. An approval chain *is* that object, so it
 * gets the rail rather than a third hand-drawn column of connectors. The cards keep their
 * white surface; the rail supplies the marker and the line.
 *
 * Approval levels only. The request's other lifecycle phases — the policy and SoD check,
 * provisioning — are not decisions anybody makes, and putting them on the same ladder as
 * "Meera Iyer approved this" made three quarters of the diagram machine steps a reader
 * scrolls past to reach the one part with a person in it.
 *
 * Only as far as the chain has actually got. A level nobody has reached is not drawn: an
 * approval chain branches on what the level before it decided, so the rest of the ladder
 * is a route nobody has taken. The whole chain appears exactly when it becomes a fact.
 *
 * Time lives where it is true. An approver's decision time is on their own card; a
 * level's opened-and-closed times are its footer. A single timestamp at the top of a
 * level read well until a level had three approvers deciding on three different days,
 * and then it was a summary no one instant could honestly give.
 */
const TONE_TO_TIMELINE: Record<FlowTone, TimelineTone> = {
  done: 'success',
  current: 'warning',
  risk: 'warning',
  breached: 'danger',
  pending: 'neutral',
  failed: 'danger',
  skipped: 'neutral',
};

function toneIcon(tone: FlowTone): React.ReactNode {
  if (tone === 'done') return <CheckOutlined sx={{ fontSize: 18 }} />;
  if (tone === 'failed') return <CloseOutlined sx={{ fontSize: 18 }} />;
  return <HourglassEmptyOutlined sx={{ fontSize: 18 }} />;
}

function LevelCard({
  hop,
  index,
  tone,
  openedAt,
  slaClock,
  selected,
  onSelect,
}: {
  hop: ApprovalHop;
  index: number;
  tone: FlowTone;
  /** When this level started asking — the moment the level above it closed. */
  openedAt?: string;
  slaClock: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const decided = hop.decision === 'approved' || hop.decision === 'rejected';
  const live = !decided;
  const approvers = hopApprovers(hop);
  const group = approvers.length > 1;
  const approved = approvers.filter((a) => a.decision === 'approved').length;

  /**
   * When the level itself settled — the last decision that satisfied the rule, not the
   * first one recorded.
   *
   * This used to lead the card, which was wrong the moment a level had more than one
   * approver: three people deciding on three different days cannot be summarised by a
   * timestamp at the top, and the one shown was whichever answer happened to sit first in
   * the array. Each approver carries their own time on their own card; the level's two
   * times — opened and closed — are a footer, because a level opens once and closes once
   * however many people decided in between.
   */
  const closedAt =
    hop.decidedAt ??
    approvers
      .map((a) => a.decidedAt)
      .filter((t): t is string => Boolean(t))
      .sort()
      .pop();

  return (
    /*
     * A container with an overlay control, not a control containing content. The card holds
     * an attachment list whose row menu is itself a button, and a button inside a button is
     * invalid HTML — React refused to hydrate it. The select affordance is a transparent
     * layer over the whole card; the content sits above it but stays transparent to the
     * pointer, so clicking anywhere still opens the panel and the file menu still opens.
     */
    <div
      className={[
        'relative w-full rounded-xl border bg-surface p-5 text-left transition-colors',
        // One signal per 1px edge: orange is the level you are reading, yellow the level
        // deciding now. Selection wins when they meet — the chip already says which level
        // is live, and nothing else says which card the open panel belongs to.
        selected ? 'border-brand' : live ? '' : 'border-border hover:border-border-strong',
      ].join(' ')}
      style={!selected && live ? { borderColor: 'var(--ds-color-status-warning-fill)' } : undefined}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? 'true' : undefined}
        aria-label={`Level ${index + 1} — ${hop.label}`}
        className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
      />

      <div className="pointer-events-none relative flex items-center justify-between gap-3">
        <span className="text-overline uppercase text-text-tertiary">Level {index + 1}</span>
        <LevelStateChip tone={tone} />
      </div>

      {/* Eyebrow, then name — the pattern every other card on this board uses. The level
          number was set inside the title in a lighter grey, which made one heading read as
          two half-headings. */}
      <h3 className="pointer-events-none relative mt-1.5 text-h5 text-text-primary">{hop.label}</h3>

      {/* The rule, plus a tally only while it still matters. A settled level said its
          numbers twice — "Any one of 2 — 1 of 1 recorded" — for a question the state chip
          beside the eyebrow had already answered. Running levels keep the count, because
          "2 of 3 required" alone does not say how close the level is to closing. */}
      <p className="pointer-events-none relative mt-0.5 text-caption text-text-secondary">
        {levelApproverLine(hop)}
        {group && live && (
          <span className="text-text-tertiary">{` · ${approved} recorded`}</span>
        )}
      </p>

      {/* No divider: each answer is a bordered card, and a rule above a row of boxes is a
          second separator for a boundary the boxes already draw. */}
      <div className="pointer-events-none relative mt-4 flex flex-col gap-2.5">
        {approvers.map((decision) => (
          <ApproverCard key={decision.approver.id} decision={decision} label={hop.label} />
        ))}
      </div>

      {/*
        * The level's own clock, under the answers it bounds — but only where it says
        * something the cards above do not. A settled level with one approver closed at
        * exactly the moment that approver answered, so "Closed 1:05 PM" under "Approved
        * 1:05 PM" was the same instant printed twice. A group needs it (the level closed
        * on the last of several answers) and a running level needs it (nothing above it
        * says when the asking started, or how overdue it now is).
        */}
      {(live || group) && (
      <div className="pointer-events-none relative mt-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-caption">
        <span className="text-text-secondary">
          {decided
            ? closedAt
              ? `Closed ${formatDateTime(closedAt)}`
              : 'Closed'
            : openedAt
              ? `Opened ${formatDateTime(openedAt)}`
              : 'Open now'}
        </span>
        {live && (
          <span
            className="tabular-nums"
            style={{
              color:
                tone === 'breached'
                  ? 'var(--ds-color-status-danger-fg)'
                  : tone === 'risk'
                    ? 'var(--ds-color-status-warning-fg)'
                    : 'var(--ds-color-text-secondary)',
            }}
          >
            {slaClock}
          </span>
        )}
      </div>
      )}
    </div>
  );
}

/**
 * The head of the chain: what was asked for, by whom, and why.
 *
 * An entry rather than a fact strip, because it is the first thing that happened and the
 * levels below it are answers to it. Reading "approved — scoped to the payments boundary"
 * without the sentence it is scoping is reading half a conversation.
 */
function SubmissionCard({ row }: { row: GovernanceRequest }) {
  const onBehalf = row.requester.id !== row.target.id;
  const files = row.attachments ?? [];

  return (
    <section className="w-full rounded-xl border border-border bg-surface p-5">
      {/* Time first, and no chip: "Submitted" is the whole of what a status would say
          here, and the rail's node already carries it. */}
      <span className="text-overline uppercase text-text-tertiary">Request submitted</span>

      <div className="mt-4 flex min-w-0 items-start gap-2.5">
        <Avatar name={row.requester.name} size="s" kind="person" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-sm-strong text-text-primary">{row.requester.name}</p>
          <p className="truncate text-caption text-text-secondary">
            {row.requester.title ?? 'Requester'}
          </p>
          <p className="mt-1 text-caption text-text-secondary">
            {formatDateTime(row.submittedAt)}
          </p>
          {/* Only when the two differ. "Requested for: themselves" is a line that exists
              to say nothing, and it is the on-behalf case an approver needs to notice. */}
          {onBehalf && (
            <p className="mt-1 text-caption text-text-secondary">
              Requested for <span className="text-text-primary">{row.target.name}</span>
              {row.target.title ? ` — ${row.target.title}` : ''}
            </p>
          )}
        </div>
      </div>

      {row.businessJustification && (
        <div className="mt-4">
          <p className="text-overline uppercase text-text-tertiary">Business justification</p>
          <p className="mt-1.5 text-body-sm text-text-secondary">
            &ldquo;{row.businessJustification}&rdquo;
          </p>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-4">
          <FileAttachmentField
            readOnly
            itemVariant="outlined"
            files={files}
            label={`${files.length === 1 ? '1 file' : `${files.length} files`} attached to this request`}
          />
        </div>
      )}
    </section>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border px-5 py-4 text-body-sm text-text-secondary">
      {children}
    </p>
  );
}

export function ApprovalFlowCanvas({
  progress,
  selectedLevelIndex,
  onSelectLevel,
}: {
  progress: ItemFlowProgress;
  selectedLevelIndex: number | null;
  onSelectLevel: (index: number) => void;
}) {
  const { view, slaStatus, slaClock } = progress;
  const levels = visibleApprovalLevels(view);
  const complete = approvalFlowComplete(view);
  const configured = approvalLevels(view).length > 0;
  const approvalStartedAt = view.stages.find((st) => st.id === 'approval')?.startedAt;

  // The trailing note is an entry on the rail too, so the dash reaches it rather than
  // stopping at the last card and leaving the explanation floating. It only earns a node
  // when it has something to say: an empty/not-started line, or a chain that ended on a
  // rejection. A line that is simply still pending shows no tail — "more may come depending
  // on the decision" is the default state of any open chain and does not need stating.
  const tailMessage =
    levels.length === 0
      ? configured
        ? `Approvals have not started. This line is still at ${STAGE_LABEL[view.currentStage]}.`
        : 'No approval levels have run on this line.'
      : levels[levels.length - 1].decision === 'rejected'
        ? 'The chain ended here. Nothing after a rejection was asked of anyone.'
        : null;
  const showTail = (levels.length === 0 || !complete) && tailMessage !== null;

  return (
    <ol className="flex flex-col">
      {/* A record being filed, not a message being sent. The paper plane is the send
          control of every mail and chat client there is, and nothing here was sent
          anywhere — a request was written down and entered the chain. The document with a
          plus says that, and it stays clearly distinct from the tick, cross and hourglass
          the decision nodes below it wear. */}
      <TimelineItem
        icon={<PostAddOutlined sx={{ fontSize: 18 }} />}
        tone="info"
        ground="subtle"
        first
        last={levels.length === 0 && !showTail}
      >
        <SubmissionCard row={view} />
      </TimelineItem>

      {levels.map((hop, i) => {
        const tone = levelToneOf(hop, slaStatus);
        return (
          <TimelineItem
            key={hop.id}
            icon={toneIcon(tone)}
            tone={TONE_TO_TIMELINE[tone]}
            ground="subtle"
            last={i === levels.length - 1 && !showTail}
          >
            <LevelCard
              hop={hop}
              index={i}
              tone={tone}
              openedAt={i === 0 ? approvalStartedAt : levels[i - 1].decidedAt ?? approvalStartedAt}
              slaClock={slaClock}
              selected={selectedLevelIndex === i}
              onSelect={() => onSelectLevel(i)}
            />
          </TimelineItem>
        );
      })}

      {/* Why the ladder stops here, said in the open. An absence with no explanation reads
          as a page that failed to load the rest of itself. */}
      {showTail && tailMessage && (
        <TimelineItem icon={<HourglassEmptyOutlined sx={{ fontSize: 18 }} />} tone="neutral" ground="subtle" last>
          <Note>{tailMessage}</Note>
        </TimelineItem>
      )}
    </ol>
  );
}
