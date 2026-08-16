'use client';

import * as React from 'react';
import { color } from '../../tokens/tokens';

/**
 * A filled marker is a graphical object, so it takes the status *solid* role —
 * the text roles read heavy as a block of fill. Same rule as Meter and the solid
 * StatusChip, which is why this comes from tokens rather than a utility class.
 *
 * The halo is a spread-only shadow rather than a real ring: a ring would occupy
 * layout and shift the connector line off the marker's centre, where a shadow
 * paints outside the box and leaves the geometry alone.
 */
const HALO = '0 0 0 4px';

const doneMarker: React.CSSProperties = {
  background: color.status.success.solid,
  color: color.status.success.onSolid,
  boxShadow: `${HALO} ${color.status.success.subtle}`,
};

const activeMarker: React.CSSProperties = {
  background: color.brand.primary,
  color: color.brand.onPrimary,
  boxShadow: `${HALO} ${color.brand.subtle}`,
};

/**
 * The connector, drawn as a repeating gradient rather than a dashed border.
 *
 * `border-style: dashed` hands the dash length to the browser, which sizes it
 * from the border width — so a 1px line gets 1px dashes and reads as a dotted
 * smear. A gradient states the rhythm outright: 6px of line, 2px of gap.
 */
function connector(tone: string): React.CSSProperties {
  return {
    backgroundImage: `repeating-linear-gradient(to bottom, ${tone} 0 6px, transparent 6px 8px)`,
  };
}

export interface StepTrackerStep {
  label: string;
  /** What this step is for, in the reader's terms. Shown under the label. */
  description?: string;
}

export interface StepTrackerProps {
  steps: StepTrackerStep[];
  /** Zero-based index of the step being worked on. */
  current: number;
  /**
   * Jump to a step. Only steps already completed are offered — going forward is
   * the job of the form's own action, which is what validates the current step.
   */
  onStepClick?: (index: number) => void;
  /** Heading above the list. @default 'Your progress' */
  title?: string;
  /**
   * Stretch to the height of the container, spreading the steps down it.
   *
   * For a rail that sits beside a tall form: left at its natural height it
   * bunches at the top of a panel it is supposed to occupy. Has no effect unless
   * the parent actually constrains height. @default false
   */
  fill?: boolean;
}

/**
 * StepTracker — a vertical, numbered progress rail for a multi-step form.
 *
 * The sibling of `Stepper`, not a replacement for it: `Stepper` is a horizontal
 * strip of labels that fits in a toolbar above a canvas, where this is a column
 * that can carry a sentence per step and sits beside the form for its whole
 * length. Use this when the steps need explaining and the reader will be on the
 * screen long enough to look; use `Stepper` when they need only a position.
 *
 * Three states, and the colour of each is doing work: a completed step is a
 * success mark, the current one carries the brand accent, and upcoming steps
 * recede to an outline. Both of the first two wear a halo, so the two markers
 * that mean something are findable at a glance in a column of five.
 *
 * Numbers stay put. A completed step keeps its number rather than swapping it
 * for a tick: the tick is redundant beside a filled green marker, and losing the
 * number means "step 3 of 5" stops being checkable against the rail — the reader
 * has to count.
 */
export function StepTracker({
  steps,
  current,
  onStepClick,
  title = 'Your progress',
  fill = false,
}: StepTrackerProps) {
  return (
    <nav aria-label={title} className={fill ? 'flex h-full flex-col' : undefined}>
      <p className="mb-4 shrink-0 text-body-sm-strong text-text-primary">{title}</p>
      <ol className={fill ? 'flex min-h-0 flex-1 flex-col' : ''}>
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const clickable = Boolean(onStepClick) && done;
          const last = i === steps.length - 1;

          return (
            <li
              key={step.label}
              className={[
                'relative flex gap-3',
                // `grow shrink-0`, never `flex-1`: flex-1 sets the basis to 0, so
                // a step whose description wraps to three lines is squeezed below
                // its own content and the text collides with the step beneath it.
                // Growing from the natural height shares only the spare space.
                //
                // The last step never grows — otherwise the spare height lands
                // under it, reading as a gap rather than as spacing between steps.
                fill && !last ? 'shrink-0 grow' : '',
                last ? 'pb-0' : 'pb-6',
              ].join(' ')}
            >
              {/* The connector runs from under this marker to the next one. It is
                  behind the marker, not between markers, so a step's height can
                  vary with its description without breaking the line. */}
              {!last && (
                <span
                  aria-hidden
                  className="absolute bottom-0 left-[15px] top-8 w-px"
                  style={connector(done ? color.status.success.solid : color.border.default)}
                />
              )}

              <span
                className={[
                  'relative z-[1] grid h-8 w-8 shrink-0 place-items-center rounded-full text-caption-strong tabular-nums',
                  done || active ? '' : 'border border-border bg-surface text-text-tertiary',
                ].join(' ')}
                style={done ? doneMarker : active ? activeMarker : undefined}
              >
                {i + 1}
              </span>

              <span className="min-w-0 flex-1 pt-1">
                {clickable ? (
                  <button
                    type="button"
                    onClick={() => onStepClick?.(i)}
                    className="rounded-sm text-left text-body-sm-strong text-success hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
                  >
                    {step.label}
                  </button>
                ) : (
                  <span
                    className={[
                      'block text-body-sm-strong',
                      active ? 'text-brand' : 'text-text-primary',
                    ].join(' ')}
                    aria-current={active ? 'step' : undefined}
                  >
                    {step.label}
                  </span>
                )}
                {step.description && (
                  <span className="mt-0.5 block text-body-sm text-text-secondary">
                    {step.description}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default StepTracker;
