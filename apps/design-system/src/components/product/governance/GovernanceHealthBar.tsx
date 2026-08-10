'use client';

import * as React from 'react';
import { Meter } from '@ds/components';
import type { GovHealthMetric, GovHealthMetricId } from '@/data/governance-types';

/**
 * The governance health summary — six numbers, each one a way into the model.
 *
 * It is a hairline-divided strip rather than a row of stat tiles because it is
 * *chrome above the protagonist*, not the protagonist itself: six cards here would
 * out-weigh the map they describe. Every metric that corresponds to a set of
 * findings is a button that scopes the whole page to those findings, so the number
 * and the way to act on it are the same control.
 */
export function GovernanceHealthBar({
  metrics,
  activeId,
  onSelect,
}: {
  metrics: GovHealthMetric[];
  activeId: GovHealthMetricId | null;
  onSelect: (metric: GovHealthMetric) => void;
}) {
  return (
    // Each cell holds a floor width and the strip scrolls rather than squeezing:
    // six metrics crushed to 85px wrap their labels to three lines and stop being
    // scannable, which is the only thing this strip is for.
    <div
      className="ds-scroll flex shrink-0 items-stretch overflow-x-auto border-b border-border bg-canvas"
      role="group"
      aria-label="Governance health"
    >
      {metrics.map((m) => {
        const interactive = m.kinds.length > 0;
        const active = activeId === m.id;
        const isZero = m.value === '0';
        // Status rides on a dot beside the label, never on the numeral. Six
        // coloured 24px numbers across the top of the page fails the squint test:
        // the eye sees a band of colour instead of the one thing it should act on.
        const flagged = !isZero && (m.tone === 'danger' || m.tone === 'warning');
        const body = (
          <>
            <div className="flex items-center gap-1.5">
              {flagged && (
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 shrink-0 rounded-pill"
                  style={{ background: `var(--ds-color-status-${m.tone}-fill)` }}
                />
              )}
              <span className="text-caption text-text-secondary">{m.label}</span>
            </div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-stat tabular-nums text-text-primary">{m.value}</span>
              {m.id === 'coverage' && (
                <span className="w-16 pb-1">
                  <Meter value={parseInt(m.value, 10)} size="sm" tone={m.tone === 'danger' ? 'danger' : m.tone === 'warning' ? 'warning' : 'success'} />
                </span>
              )}
            </div>
          </>
        );

        if (!interactive) {
          return (
            <div key={m.id} className="min-w-[136px] flex-1 border-r border-border px-4 py-2.5 last:border-r-0">
              {body}
            </div>
          );
        }
        return (
          <button
            key={m.id}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(m)}
            className={[
              'relative min-w-[136px] flex-1 border-r border-border px-4 py-2.5 text-left transition-colors last:border-r-0',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-subtle',
              active ? 'bg-surface-selected' : 'hover:bg-surface-hover',
            ].join(' ')}
          >
            {body}
            {active && <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-brand" />}
          </button>
        );
      })}
    </div>
  );
}
