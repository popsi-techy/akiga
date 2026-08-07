'use client';

import * as React from 'react';
import ChevronRight from '@mui/icons-material/ChevronRight';
import ArrowBack from '@mui/icons-material/ArrowBack';

/**
 * Stepper — a horizontal, numbered progress indicator for short linear flows
 * (e.g. Select access → Preview & activate). Steps keep their number throughout;
 * completed steps use a success fill, the current step is brand-filled, and
 * upcoming steps are muted. Steps are joined by right chevrons to signal forward
 * progression. From step 2 onward, a back arrow sits beside step 1 for quick
 * return to the previous step.
 */
export interface StepperStep {
  label: string;
}
export interface StepperProps {
  steps: StepperStep[];
  /** Zero-based index of the active step. */
  current: number;
  onStepClick?: (index: number) => void;
  /**
   * Show the back arrow beside step 1. Set false on a step that owns its own way
   * back — a final review screen, say, where an explicit Edit action belongs with
   * the content being edited rather than in the progress indicator. @default true
   */
  showBack?: boolean;
}

export function Stepper({ steps, current, onStepClick, showBack = true }: StepperProps) {
  const canGoBack = showBack && Boolean(onStepClick) && current > 0;

  return (
    <ol className="flex min-w-0 items-center gap-1.5 sm:gap-2">
      {canGoBack && (
        <li className="shrink-0">
          <button
            type="button"
            aria-label="Go to previous step"
            title="Go back"
            onClick={() => onStepClick?.(current - 1)}
            className="grid h-6 w-6 place-items-center text-icon transition-colors hover:text-text-primary"
          >
            <ArrowBack sx={{ fontSize: 18 }} />
          </button>
        </li>
      )}
      {steps.map((step, i) => {
        const complete = i < current;
        const active = i === current;
        const clickable = Boolean(onStepClick) && i <= current;
        return (
          <React.Fragment key={i}>
            <li className="shrink-0">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(i)}
                title={step.label}
                className={['inline-flex items-center gap-1.5 sm:gap-2', clickable ? 'cursor-pointer' : 'cursor-default'].join(' ')}
              >
                <span
                  className={[
                    'grid h-6 w-6 shrink-0 place-items-center rounded-full text-caption font-semibold transition-colors',
                    complete
                      ? 'bg-[var(--ds-color-status-success-fill)] text-white'
                      : active
                        ? 'bg-brand text-brand-on'
                        : 'border border-border bg-surface text-text-tertiary',
                  ].join(' ')}
                >
                  {i + 1}
                </span>
                <span
                  className={[
                    'whitespace-nowrap text-body-sm',
                    active || complete ? 'font-medium text-text-primary' : 'text-text-secondary',
                  ].join(' ')}
                >
                  {step.label}
                </span>
              </button>
            </li>
            {i < steps.length - 1 && (
              <li aria-hidden className="grid shrink-0 place-items-center text-icon-subtle">
                <ChevronRight sx={{ fontSize: 18 }} />
              </li>
            )}
          </React.Fragment>
        );
      })}
    </ol>
  );
}

export default Stepper;
