'use client';

import * as React from 'react';
import { PeekPanel } from '@ds/components';
import { formatDateTime } from '@/lib/datetime';
import {
  formatElapsed,
  formatSlaClock,
  hopApprovers,
  requiredApprovalCount,
  slaSpentPercent,
  visibleApprovalLevels,
  type ApprovalHop,
  type ItemFlowProgress,
} from '@/data/request-governance';
import { ApproverCard } from './ApproverCard';
import { FLOW_COLOR, LevelStateChip, levelApproverLine, levelToneOf } from './flowVocabulary';

/**
 * One approval level, read closely — the panel that docks beside the chain.
 *
 * It is the same object as the card it opens from, so it is built from the same parts: the
 * level number as an eyebrow, its name as the title, its condition as a **chip** rather
 * than as grey prose, and its approvers as {@link ApproverCard}s. The panel used to draw
 * its own divided rows and write its own status sentence, which made one decision look
 * like two different objects a click apart.
 *
 * What the panel adds is depth, not a second copy: each approver's address, the item's SLA
 * while this level is the one holding it, and the level's own clock. It does not repeat
 * the line's name — the canvas header two inches to the left is already saying it, and the
 * eyebrow was spending its width on a word the reader could see for free.
 *
 * Actions are deliberately absent for now. Nudge, escalate and reassign belong on the
 * level that is actually waiting, and that is a decision about routing rather than about
 * this panel's layout.
 */
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="shrink-0 text-caption text-text-secondary">{label}</span>
      <span className="min-w-0 text-right text-body-sm text-text-primary">{value}</span>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border-subtle py-4 first:border-t-0">
      <h4 className="mb-2.5 text-overline uppercase text-text-tertiary">{title}</h4>
      {children}
    </section>
  );
}

export function LevelDetailPanel({
  hop,
  index,
  progress,
  onClose,
}: {
  hop: ApprovalHop;
  index: number;
  progress: ItemFlowProgress;
  onClose: () => void;
}) {
  const { view, slaStatus } = progress;
  const tone = levelToneOf(hop, slaStatus);
  const decided = hop.decision === 'approved' || hop.decision === 'rejected';
  const approvers = hopApprovers(hop);
  const approved = approvers.filter((a) => a.decision === 'approved').length;

  /**
   * The same two instants the card's footer carries, read the same way: a level opens when
   * the one above it closes, and closes on the last answer that satisfied its rule — not
   * on whichever decision happens to sit first in the array.
   */
  const levels = visibleApprovalLevels(view);
  const approvalStartedAt = view.stages.find((s) => s.id === 'approval')?.startedAt;
  const openedAt = index === 0 ? approvalStartedAt : levels[index - 1]?.decidedAt ?? approvalStartedAt;
  const closedAt =
    hop.decidedAt ??
    approvers
      .map((a) => a.decidedAt)
      .filter((t): t is string => Boolean(t))
      .sort()
      .pop();
  const elapsed = formatElapsed(openedAt);

  return (
    <PeekPanel
      docked
      // Just the position. The line's name lived here until the canvas header beside it
      // was already saying it in full, twice the size.
      eyebrow={`Level ${index + 1}`}
      title={hop.label}
      // The condition as the object it is. "Approved" set in grey prose here contradicted
      // the green chip on the card this panel opened from — §5.2, status colour belongs on
      // the status object, and the same fact should not change species between surfaces.
      subtitle={
        <>
          <LevelStateChip tone={tone} />
          {!decided && elapsed && <span>{elapsed} open</span>}
        </>
      }
      onClose={onClose}
    >
      {/* The SLA belongs to the line, not to this level — the model has one clock per cart
          line — so it is labelled as the item's and shown only while this level is the one
          holding it up. Attributing it to the level would invent a deadline. */}
      {!decided && (
        <Block title="SLA on this item">
          <div className="h-1.5 w-full overflow-hidden rounded-pill bg-subtle">
            <div
              className="h-full rounded-pill"
              style={{ width: `${slaSpentPercent(view)}%`, background: FLOW_COLOR[tone] }}
            />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-3 text-caption">
            <span className="text-text-secondary">Due {formatDateTime(view.slaDueAt)}</span>
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
              {formatSlaClock(view)}
            </span>
          </div>
        </Block>
      )}

      <Block title={levelApproverLine(hop)}>
        {/* Every approver, each with their own answer — a level satisfied by "any one of
            two" still owes the reader the second person and what they did or did not do.
            The same card the canvas draws, with the address it leaves out. */}
        <div className="flex flex-col gap-2.5">
          {approvers.map((decision) => (
            <ApproverCard
              key={decision.approver.id}
              decision={decision}
              label={hop.label}
              showEmail
            />
          ))}
        </div>

        {/* Only while the rule is still open. A settled level printed "1 of 1 needed
            approvals recorded" under a heading that already said "Any one of 2" and a chip
            that already said "Approved" — three ways of saying one thing. */}
        {approvers.length > 1 && !decided && (
          <p className="mt-3 text-caption text-text-tertiary">
            {approved} of {requiredApprovalCount(hop)} needed approvals recorded.
          </p>
        )}
      </Block>

      {/* The level's own clock. No "Outcome" row: the chip in the header is the outcome,
          and no level note either — for a single-approver level `hop.note` *is* that
          approver's justification, already quoted on their card above. */}
      <Block title="Timing">
        {openedAt && <Row label="Opened" value={formatDateTime(openedAt)} />}
        {decided
          ? closedAt && <Row label="Closed" value={formatDateTime(closedAt)} />
          : elapsed && <Row label="Open for" value={elapsed} />}
      </Block>

      <div className="pb-2" />
    </PeekPanel>
  );
}
