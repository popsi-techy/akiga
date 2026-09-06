'use client';

import * as React from 'react';
import { Tooltip } from '@ds/components';
import {
  LIFECYCLE_ORDER,
  STAGE_LABEL,
  STAGE_SHORT,
  type GovernanceRequest,
  type StageState,
} from '@/data/request-governance';

function markerClass(state: StageState): string {
  if (state === 'done') return 'bg-[var(--ds-color-status-success-fill)]';
  if (state === 'current') return 'bg-brand';
  if (state === 'failed') return 'bg-[var(--ds-color-status-danger-fill)]';
  if (state === 'skipped') return 'bg-[var(--ds-color-status-warning-fill)]';
  return 'border border-border bg-surface';
}

/**
 * Compact four-beat trail for the operations table.
 *
 * The full labels live in the drawer. Here the reader only needs "where is it
 * and is it stuck" — four markers, the current name, and a tooltip per beat.
 */
export function LiveStageStepper({ row }: { row: GovernanceRequest }) {
  const current = row.stages.find((s) => s.id === row.currentStage);
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <ol className="flex items-center" aria-label="Request stage">
        {LIFECYCLE_ORDER.map((id, i) => {
          const stage = row.stages.find((s) => s.id === id);
          const state = stage?.state ?? 'pending';
          return (
            <li key={id} className="flex items-center">
              {i > 0 && <span aria-hidden className="h-px w-3 bg-border" />}
              <Tooltip title={`${STAGE_LABEL[id]} — ${state.replace('_', ' ')}`}>
                <span
                  aria-current={state === 'current' ? 'step' : undefined}
                  className={[
                    'block rounded-full',
                    state === 'current' || state === 'failed' ? 'h-3 w-3' : 'h-2.5 w-2.5',
                    markerClass(state),
                  ].join(' ')}
                />
              </Tooltip>
            </li>
          );
        })}
      </ol>
      <span className="truncate text-body-sm text-text-primary">
        {STAGE_SHORT[row.currentStage]}
        {current?.state === 'failed' ? ' failed' : ''}
      </span>
    </div>
  );
}
