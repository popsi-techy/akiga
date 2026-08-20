'use client';

import * as React from 'react';

/**
 * SetupBar — a floating strip that walks a draft through its remaining steps.
 *
 * It sits under the work, not in a tab: the page already holds the real editors,
 * and this is the guide that says which one is current and what happens next.
 * Remove it when the object goes live — a finished thing has no setup left.
 *
 * Elevation is `md` because the bar floats above the page. Colour stays greyscale
 * except for the one action the caller puts in `primary` (Activate, Connect).
 */
export interface SetupBarProps {
  /**
   * Optional control before the stepper — a setup-guide icon, not another step.
   * Stays out of `progress` so it does not count against the Stepper’s four-step cap.
   */
  leading?: React.ReactNode;
  /** Progress — typically a {@link Stepper}. */
  progress: React.ReactNode;
  /** Back / Next. The path through the steps. */
  actions: React.ReactNode;
  /**
   * The payoff once required work is done (Activate, Connect). Omit it until
   * that moment so the bar does not carry a dead primary beside Next.
   */
  primary?: React.ReactNode;
  className?: string;
}

export function SetupBar({ leading, progress, actions, primary, className = '' }: SetupBarProps) {
  return (
    <div
      role="region"
      aria-label="Setup"
      className={[
        'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-md',
        className,
      ].join(' ')}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
        {leading}
        <div className="min-w-0 flex-1">{progress}</div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {actions}
        {primary}
      </div>
    </div>
  );
}

export default SetupBar;
