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

export type StepTrackerStatus = 'done' | 'skipped';

export interface StepTrackerStep {
  label: string;
  /** What this step is for, in the reader's terms. Shown under the label. */
  description?: string;
  /**
   * The step's own state, for flows where position is not the whole story.
   *
   * Omit it and the rail derives state from `current`, which is right for a
   * form that must be filled in order. Pass it when a step can be walked past
   * without being finished: `'skipped'` then keeps the rail honest, where the
   * derived version would mark everything behind the reader as done.
   *
   * The current step ignores this — you are here, whatever the work says.
   */
  status?: StepTrackerStatus;
  /**
   * Marks a step whose work must exist before the flow's goal is reachable.
   *
   * The point of saying so on the rail rather than only at the end: in a flow
   * that can be skipped, "can I pass this?" is asked at the step, and an answer
   * that only arrives on the final screen arrives too late to act on.
   */
  required?: boolean;
}

export interface StepTrackerProps {
  steps: StepTrackerStep[];
  /** Zero-based index of the step being worked on. */
  current: number;
  /**
   * Jump to a step. Offered for steps behind the reader and for any step
   * carrying a `status` — going forward is the job of the form's own action,
   * which is what validates the current step. A skipped step must stay
   * reachable, or skipping becomes a one-way door.
   */
  onStepClick?: (index: number) => void;
  /** Heading above the list. @default 'Your progress' */
  title?: string;
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
 * Four states, and the colour of each is doing work: a completed step is a
 * success mark, the current one carries the brand accent, and upcoming steps
 * recede to an outline. Both of the first two wear a halo, so the two markers
 * that mean something are findable at a glance in a column of five.
 *
 * The fourth is `'skipped'` — passed by, with nothing in it. Its marker is the
 * upcoming outline turned dashed, borrowing the connector's own language: dashed
 * means not settled yet. It reads as neither done nor untouched, which is the
 * truth, and it is the one state whose second line is not a description but a
 * consequence — a skipped step the reader must come back to says so there.
 *
 * Numbers stay put. A completed step keeps its number rather than swapping it
 * for a tick: the tick is redundant beside a filled green marker, and losing the
 * number means "step 3 of 5" stops being checkable against the rail — the reader
 * has to count.
 *
 * The steps sit at the top with one spacing between them, whatever height the
 * container has. An earlier version stretched them down a tall panel; the gaps
 * then changed with the viewport, which made the rhythm of the list an accident
 * of the window rather than a decision. Empty space below is the better outcome.
 */
export function StepTracker({
  steps,
  current,
  onStepClick,
  title = 'Your progress',
}: StepTrackerProps) {
  return (
    <nav aria-label={title}>
      <p className="mb-4 text-body-sm-strong text-text-primary">{title}</p>
      <ol>
        {steps.map((step, i) => {
          const active = i === current;
          // An explicit status wins over position, except on the step the reader
          // is standing on: "here" outranks whatever the work says about it.
          const done = !active && (step.status ? step.status === 'done' : i < current);
          const skipped = !active && step.status === 'skipped';
          const clickable = Boolean(onStepClick) && (i < current || Boolean(step.status));
          const last = i === steps.length - 1;

          return (
            <li
              key={step.label}
              // One spacing between steps, and none under the last — the padding
              // separates steps, so there is nothing under the final one to
              // separate it from.
              className={`relative flex gap-3 ${last ? 'pb-0' : 'pb-6'}`}
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
                  done || active
                    ? ''
                    : `border border-border bg-surface text-text-tertiary ${skipped ? 'border-dashed' : ''}`,
                ].join(' ')}
                style={done ? doneMarker : active ? activeMarker : undefined}
              >
                {i + 1}
              </span>

              <span className="min-w-0 flex-1 pt-1">
                {/* `gap-1`, about the width of a space at this size — the same
                    spacing `Input` gets by rendering its asterisk inside the label
                    after a literal `{' '}`. A required marker modifies the word it
                    follows; wider than a space and it reads as its own item. */}
                <span className="flex items-center gap-1">
                  {clickable ? (
                    <button
                      type="button"
                      onClick={() => onStepClick?.(i)}
                      className={[
                        'rounded-sm text-left text-body-sm-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
                        done ? 'text-success' : 'text-text-secondary',
                      ].join(' ')}
                    >
                      {step.label}
                    </button>
                  ) : (
                    <span
                      className={[
                        'text-body-sm-strong',
                        active ? 'text-brand' : 'text-text-primary',
                      ].join(' ')}
                      aria-current={active ? 'step' : undefined}
                    >
                      {step.label}
                    </span>
                  )}
                  {/* The same marker a required field carries, so "required" means
                      one thing across forms, checklists and this rail. Nothing
                      here has a `required` attribute for assistive tech to read,
                      so the word is kept rather than dropped with the glyph. */}
                  {step.required && (
                    <>
                      <span aria-hidden className="shrink-0 text-body-sm-strong text-danger">
                        *
                      </span>
                      <span className="sr-only">Required</span>
                    </>
                  )}
                </span>
                {/* A skipped step's description has done its job — the reader has
                    already decided against it. What they need instead is whether
                    passing it cost them anything. */}
                {skipped ? (
                  <span
                    className={`mt-0.5 block text-body-sm ${
                      step.required ? 'text-danger' : 'text-text-tertiary'
                    }`}
                  >
                    {step.required ? 'Skipped — still required' : 'Skipped'}
                  </span>
                ) : (
                  step.description && (
                    <span className="mt-0.5 block text-body-sm text-text-secondary">
                      {step.description}
                    </span>
                  )
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
