'use client';

import * as React from 'react';
import { Avatar, FileAttachmentField, PeekPanel } from '@ds/components';
import { formatDateTime } from '@/lib/datetime';
import {
  formatElapsed,
  formatSlaClock,
  slaSpentPercent,
  type ApprovalHop,
  type ItemFlowProgress,
} from '@/data/request-governance';
import { FLOW_COLOR, levelStateLabel, levelApproverLine, levelToneOf } from './flowVocabulary';

/**
 * One approval level, read closely — the panel that docks beside the chain.
 *
 * It takes width from the flow, which a column of stacked cards can afford: they reflow to
 * a narrower measure and stay readable, where a left-to-right diagram would have to
 * scroll. The header stays above both, so the board keeps saying which line is on it while
 * a level is open.
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
  itemName,
  hop,
  index,
  progress,
  onClose,
}: {
  itemName: string;
  hop: ApprovalHop;
  index: number;
  progress: ItemFlowProgress;
  onClose: () => void;
}) {
  const { view, slaStatus } = progress;
  const tone = levelToneOf(hop, slaStatus);
  const decided = hop.decision === 'approved' || hop.decision === 'rejected';
  const opened = view.stages.find((s) => s.id === 'approval')?.startedAt;
  const elapsed = formatElapsed(opened);
  const files = hop.attachments ?? [];

  return (
    <PeekPanel
      docked
      // No "of N": the chain's length is not known until it has finished, so a total here
      // would be a number the board itself refuses to claim.
      eyebrow={`${itemName} · Level ${index + 1}`}
      title={hop.label}
      subtitle={[levelStateLabel(tone), !decided && elapsed ? `${elapsed} open` : null]
        .filter(Boolean)
        .join(' · ')}
      onClose={onClose}
    >
      {/* The SLA belongs to the line, not to this level — the model has one clock per cart
          line — so it is labelled as the item's and shown only while this level is the one
          holding it up. Attributing it to the level would invent a deadline. */}
      {!decided && (
        <Block title={`SLA on ${itemName}`}>
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
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={hop.approver.name} size="s" kind="person" />
          <div className="min-w-0">
            <p className="truncate text-body-sm-strong text-text-primary">{hop.approver.name}</p>
            <p className="truncate text-caption text-text-secondary">
              {hop.approver.title ?? hop.label}
            </p>
            <p className="truncate text-caption text-text-tertiary">{hop.approver.email}</p>
          </div>
        </div>
      </Block>

      <Block title="Decision">
        <Row label="Outcome" value={levelStateLabel(tone)} />
        {hop.decidedAt && <Row label="Decided" value={formatDateTime(hop.decidedAt)} />}
        {!decided && opened && <Row label="Open for" value={elapsed} />}
        {hop.note ? (
          <p className="mt-2 text-body-sm text-text-secondary">&ldquo;{hop.note}&rdquo;</p>
        ) : (
          <p className="mt-2 text-body-sm text-text-tertiary">
            {decided ? 'No justification was recorded.' : 'Nothing has been recorded yet.'}
          </p>
        )}
      </Block>

      <Block title={files.length === 1 ? '1 attachment' : `${files.length} attachments`}>
        {files.length > 0 ? (
          /* The Block heading already counts them; the field's default label would be a
             second one. */
          <FileAttachmentField readOnly files={files} label="" />
        ) : (
          <p className="text-body-sm text-text-tertiary">No files were filed with this decision.</p>
        )}
      </Block>

      <div className="pb-2" />
    </PeekPanel>
  );
}
