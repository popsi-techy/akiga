'use client';

import * as React from 'react';
import { Avatar, FileAttachmentField } from '@ds/components';
import { formatDateTime } from '@/lib/datetime';
import {
  STAGE_LABEL,
  approvalFlowComplete,
  approvalLevels,
  visibleApprovalLevels,
  type ApprovalHop,
  type ItemFlowProgress,
} from '@/data/request-governance';
import {
  FLOW_COLOR,
  LevelStateChip,
  levelApproverLine,
  levelToneOf,
  type FlowTone,
} from './flowVocabulary';

/**
 * The approval chain for one cart line, as a canvas.
 *
 * Approval levels only. The request's other lifecycle phases — submission, the policy and
 * SoD check, provisioning — are not decisions anybody makes, and putting them on the same
 * ladder as "Meera Iyer approved this" made three quarters of the diagram machine steps a
 * reader scrolls past to reach the one part with a person in it.
 *
 * Top to bottom, and **only as far as the chain has actually got**. A level that has not
 * been reached is not drawn: an approval chain branches on what the level before it
 * decided, so the rest of the ladder is a route nobody has taken. The whole chain appears
 * exactly when it becomes a fact — once every level has decided.
 *
 * A decision is shown with its evidence: who, when, the justification they typed, and any
 * files they filed with it. "Approved" on its own is a state; the sentence and the
 * sign-off are what make it an audit record.
 */
function LevelNode({
  hop,
  index,
  tone,
  slaClock,
  selected,
  onSelect,
}: {
  hop: ApprovalHop;
  index: number;
  tone: FlowTone;
  slaClock: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const decided = hop.decision === 'approved' || hop.decision === 'rejected';
  const live = !decided;
  const files = hop.attachments ?? [];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
      className={[
        'w-full rounded-xl border bg-surface p-5 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
        // One signal per 1px edge: orange is the level you are reading, yellow the level
        // deciding now. Selection wins when they meet — the chip already says which level
        // is live, and nothing else says which node the open panel belongs to.
        selected ? 'border-brand' : live ? '' : 'border-border hover:border-border-strong',
      ].join(' ')}
      style={!selected && live ? { borderColor: 'var(--ds-color-status-warning-fill)' } : undefined}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-overline uppercase text-text-tertiary">Level {index + 1}</span>
        <LevelStateChip tone={tone} />
      </div>

      <h3 className="mt-1.5 text-h5 text-text-primary">{hop.label}</h3>
      <p className="text-caption text-text-secondary">{levelApproverLine(hop)}</p>

      <div className="mt-4 border-t border-border-subtle pt-4">
        <div className="flex min-w-0 items-start gap-2.5">
          <Avatar name={hop.approver.name} size="s" kind="person" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-sm-strong text-text-primary">{hop.approver.name}</p>
            <p className="truncate text-caption text-text-secondary">
              {hop.approver.title ?? hop.label}
            </p>
            {decided && hop.decidedAt ? (
              <p className="mt-1 text-caption text-text-secondary">
                {hop.decision === 'rejected' ? 'Rejected' : 'Approved'}{' '}
                {formatDateTime(hop.decidedAt)}
              </p>
            ) : (
              <p className="mt-1 flex items-center gap-1.5 text-caption-medium text-text-secondary">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 shrink-0 rounded-pill"
                  style={{ background: 'var(--ds-color-status-info-fill)' }}
                />
                Waiting on this decision
              </p>
            )}
          </div>
        </div>

        {/* The justification in the approver's own words. Quoted, so it reads as testimony
            rather than as the product describing the decision. */}
        {hop.note && <p className="mt-3 text-body-sm text-text-secondary">&ldquo;{hop.note}&rdquo;</p>}

        {/* The field's own label slot rather than a heading beside it — its default is
            "Supporting files", which is the wrong noun for evidence filed with a decision
            and would have sat under a second heading saying the same thing. */}
        {files.length > 0 && (
          <div className="mt-3">
            <FileAttachmentField
              readOnly
              files={files}
              label={`${files.length === 1 ? '1 file' : `${files.length} files`} filed with this decision`}
            />
          </div>
        )}
      </div>

      {live && (
        <div className="mt-4 flex items-center justify-between gap-3 text-caption">
          <span className="text-text-secondary">SLA</span>
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
        </div>
      )}
    </button>
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

  if (levels.length === 0) {
    const configured = approvalLevels(view).length > 0;
    return (
      <Note>
        {configured
          ? `Approvals have not started. This line is still at ${STAGE_LABEL[view.currentStage]}.`
          : 'No approval levels have run on this line.'}
      </Note>
    );
  }

  return (
    <div className="flex flex-col items-stretch">
      {levels.map((hop, i) => (
        <React.Fragment key={hop.id}>
          {i > 0 && (
            /* The rail takes the colour of the level above it, so the line reads as
               "this much of the chain has been decided". */
            <span
              aria-hidden
              className="ml-8 h-6 w-0.5 shrink-0"
              style={{
                background:
                  levels[i - 1].decision === 'rejected' ? FLOW_COLOR.failed : FLOW_COLOR.done,
              }}
            />
          )}
          <LevelNode
            hop={hop}
            index={i}
            tone={levelToneOf(hop, slaStatus)}
            slaClock={slaClock}
            selected={selectedLevelIndex === i}
            onSelect={() => onSelectLevel(i)}
          />
        </React.Fragment>
      ))}

      {/* Why the ladder stops here, said in the open. An absence with no explanation reads
          as a page that failed to load the rest of itself. */}
      {!complete && (
        <>
          <span
            aria-hidden
            className="ml-8 h-6 w-0.5 shrink-0"
            style={{ background: FLOW_COLOR.pending }}
          />
          <Note>
            {levels[levels.length - 1].decision === 'rejected'
              ? 'The chain ended here. Nothing after a rejection was asked of anyone.'
              : 'What comes after this level depends on how it decides, so nothing further is shown yet.'}
          </Note>
        </>
      )}
    </div>
  );
}
