'use client';

import * as React from 'react';

/**
 * SetupBar — a floating strip that walks a draft through its remaining steps.
 *
 * It sits under the work, not in a tab: the page already holds the real editors,
 * and this bar is Back / Next / Activate — optionally a Stepper when the page
 * does not already name the steps. Remove it when the object goes live.
 *
 * Elevation is `md` because the bar floats above the page. Colour stays greyscale
 * except for the one action the caller puts in `primary` (Activate, Connect).
 */
export interface SetupBarProps {
  /**
   * Optional control before the rest — a setup-guide icon, not a step.
   */
  leading?: React.ReactNode;
  /**
   * Progress — typically a {@link Stepper}. Omit it when the page already shows
   * the steps (tabs, a rail) and this bar is only Back / Next / Activate.
   */
  progress?: React.ReactNode;
  /** Back / Next. The path through the steps. */
  actions: React.ReactNode;
  /**
   * The payoff once required work is done (Activate, Connect). Omit it until
   * that moment so the bar does not carry a dead primary beside Next.
   */
  primary?: React.ReactNode;
  /**
   * Right-aligned status — a required-steps count, not another control.
   * Stays at the trailing edge while Back / Next stay leading.
   */
  status?: React.ReactNode;
  className?: string;
}

export function SetupBar({ leading, progress, actions, primary, status, className = '' }: SetupBarProps) {
  return (
    <div
      role="region"
      aria-label="Setup"
      className={[
        'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-md',
        className,
      ].join(' ')}
    >
      <div className={`flex min-w-0 items-center gap-2 ${progress != null ? 'flex-1' : ''}`}>
        {leading}
        {progress != null && <div className="min-w-0 flex-1 overflow-x-auto">{progress}</div>}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
          {primary}
        </div>
      </div>
      {status}
    </div>
  );
}

export default SetupBar;
