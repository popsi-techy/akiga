'use client';

import * as React from 'react';
import PersonOutline from '@mui/icons-material/PersonOutline';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import AltRouteOutlined from '@mui/icons-material/AltRouteOutlined';
import UndoOutlined from '@mui/icons-material/UndoOutlined';
import { StatusChip } from '@ds/components';
import type { ApprovalPolicy } from '@/data/automation-types';
import { toStages, type PolicyStage, type StageCondition } from '@/lib/policy-stages';

/**
 * The Workflow tab's read-only view of an approval policy, as a **sequence of
 * stages** rather than a graph.
 *
 * Why not the canvas: a policy's branch/merge structure is expensive to resolve
 * and, more to the point, is not what a reader comes here to learn. The question
 * is "who approves this, in what order, and how long can it take" — which is a
 * list. Branching survives as the condition footer on each stage ("Runs when …"),
 * which is the part that changes the answer.
 *
 * Each stage is three bands, so the eye can segregate them without reading:
 *   • a grey **header** — what kind of stage this is, and its deadline
 *   • a white **body** — who decides (the protagonist) and how they decide
 *   • a sunken **footer** — the condition gating the stage, when there is one
 *
 * The stage number lives in the rail badge and nowhere else: printing it again as
 * "STAGE 1" inside the card said the same thing twice in the same eyeful.
 */

const STAGE_KIND: Record<PolicyStage['kind'], string> = {
  approval: 'Approval',
  parallel: 'Parallel approval',
};

/** The condition path that reaches a stage, as one readable line. */
function ConditionFooter({ conditions }: { conditions: StageCondition[] }) {
  return (
    <div className="flex items-start gap-2 border-t border-border bg-sunken px-4 py-2.5">
      <span className="mt-px shrink-0 text-icon-subtle">
        <AltRouteOutlined sx={{ fontSize: 15 }} />
      </span>
      <p className="min-w-0 text-caption leading-5 text-text-secondary">
        <span className="text-caption-strong text-text-primary">Runs when</span>{' '}
        {conditions.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-text-tertiary"> and </span>}
            {c.kind === 'else' ? (
              <span className="text-text-tertiary">no earlier condition matched</span>
            ) : (
              <>
                <span className="text-text-primary">{c.text}</span>
                {c.extra > 0 && <span className="text-text-tertiary"> +{c.extra} more</span>}
              </>
            )}
          </React.Fragment>
        ))}
      </p>
    </div>
  );
}

function StageBlock({ stage, last }: { stage: PolicyStage; last: boolean }) {
  const parallel = stage.kind === 'parallel';
  return (
    <li className="flex gap-4">
      {/* Numbered rail — the spine that makes this read as a sequence, and the one
          place the stage number appears. The line stops at the last stage so the
          route visibly ends. */}
      <div className="flex shrink-0 flex-col items-center">
        <span
          aria-label={`Stage ${stage.number}`}
          className={[
            'grid h-8 w-8 shrink-0 place-items-center rounded-full border text-body-sm-strong tabular-nums',
            stage.complete
              ? 'border-border bg-surface text-text-secondary'
              : 'border-[var(--ds-color-status-warning-border)] bg-[var(--ds-color-status-warning-subtle)] text-[var(--ds-color-status-warning-fg)]',
          ].join(' ')}
        >
          {stage.number}
        </span>
        {!last && <span aria-hidden className="mt-1.5 w-px flex-1 bg-border" />}
      </div>

      <div className="min-w-0 flex-1 pb-5">
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          {/* Band 1 — what kind of stage, and by when. Grey so the white body below
              reads as the content and this reads as its label. */}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border bg-subtle px-4 py-2">
            <span className="min-w-0 truncate text-overline uppercase text-text-secondary">
              {STAGE_KIND[stage.kind]}
              {parallel && stage.rule ? ` · ${stage.rule}` : ''}
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {!stage.complete && <StatusChip intent="warning" label="Incomplete" />}
              {stage.sla && (
                <span className="inline-flex items-center gap-1 text-caption tabular-nums text-text-secondary">
                  <TimerOutlined sx={{ fontSize: 14 }} />
                  {stage.sla}
                </span>
              )}
            </span>
          </div>

          {/* Band 2 — who decides. The only strong type in the block. */}
          <div className="px-4 py-3">
            {parallel ? (
              <ul className="space-y-2">
                {stage.approvers.map((a, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-subtle text-icon-subtle">
                      <GroupsOutlined sx={{ fontSize: 15 }} />
                    </span>
                    <span className="min-w-0 truncate text-body-sm-strong text-text-primary">{a}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-subtle text-icon-subtle">
                  <PersonOutline sx={{ fontSize: 15 }} />
                </span>
                <span className="min-w-0 truncate text-body-strong text-text-primary">
                  {stage.approvers[0]}
                </span>
              </div>
            )}

            {/* Qualifiers sit under the decision, indented to the approver's text so
                they read as belonging to it rather than as new items. */}
            {(( !parallel && stage.rule) || stage.fallback) && (
              <div className="mt-2 space-y-1 pl-9">
                {!parallel && stage.rule && (
                  <p className="text-caption text-text-secondary">{stage.rule}</p>
                )}
                {stage.fallback && (
                  <p className="flex items-start gap-1.5 text-caption text-text-tertiary">
                    <span className="mt-px shrink-0">
                      <UndoOutlined sx={{ fontSize: 13 }} />
                    </span>
                    {stage.fallback}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Band 3 — the gate, only when there is one. */}
          {stage.conditions.length > 0 && <ConditionFooter conditions={stage.conditions} />}
        </div>
      </div>
    </li>
  );
}

export function PolicyStagesPreview({ policy }: { policy: ApprovalPolicy }) {
  const { stages } = React.useMemo(() => toStages(policy.root), [policy.root]);

  if (stages.length === 0) {
    return (
      <div className="grid place-items-center rounded-lg border border-dashed border-border bg-surface px-6 py-16 text-center">
        <div className="max-w-sm">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-subtle text-icon-subtle">
            <PersonOutline sx={{ fontSize: 22 }} />
          </span>
          <p className="mt-3 text-body-strong text-text-primary">No approval stages yet</p>
          <p className="mt-1 text-body-sm leading-5 text-text-secondary">
            Add an approval level in the workflow editor. Each one becomes a stage here, in the
            order requests pass through it.
          </p>
        </div>
      </div>
    );
  }

  const incomplete = stages.filter((s) => !s.complete).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-h5 text-text-primary">
          Approval route{' '}
          <span className="font-normal tabular-nums text-text-tertiary">
            ({stages.length} stage{stages.length === 1 ? '' : 's'})
          </span>
        </h2>
        {incomplete > 0 && (
          <StatusChip
            intent="warning"
            label={`${incomplete} stage${incomplete === 1 ? '' : 's'} need configuration`}
          />
        )}
      </div>

      <ol className="max-w-3xl">
        {stages.map((s, i) => (
          <StageBlock key={s.nodeId} stage={s} last={i === stages.length - 1} />
        ))}
      </ol>
    </div>
  );
}

export default PolicyStagesPreview;
