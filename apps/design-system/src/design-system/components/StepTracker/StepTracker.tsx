'use client';

import * as React from 'react';
import { color } from '../../tokens/tokens';

/**
 * A filled marker is a graphical object, so it takes a status *fill* or *solid*
 * role — the text roles read heavy as a block of fill. Same rule as Meter and the
 * solid StatusChip, which is why this comes from tokens rather than a utility
 * class.
 *
 * The halo is a spread-only shadow rather than a real ring: a ring would occupy
 * layout and shift the connector line off the marker's centre, where a shadow
 * paints outside the box and leaves the geometry alone.
 *
 * 4px, and the weight comes from the colour rather than the spread. Its role is
 * `halo`, not `subtle`: a tint-strength ring on a card is very nearly the card, so
 * widening the spread was the wrong lever — two rungs up the ramp is what makes the
 * marker sit in something, and once it does, 6px reads as a band around the step
 * instead of a glow behind it.
 */
const HALO = '0 0 0 4px';

/**
 * Done takes `success.fill` (#12855A), not `success.solid` (#00695C).
 *
 * Solid is a near-black teal, and a column of them sat heavier on the rail than
 * the orange marker for the step actually being worked on — the completed steps
 * were the loudest thing in a rail whose job is to show where you are. `fill` is
 * the role meant for graphical blocks, and it holds white 12px text at 4.63:1,
 * clear of the 4.5:1 AA floor. `check:contrast` enforces that pairing now.
 */
const doneMarker: React.CSSProperties = {
  background: color.status.success.fill,
  color: color.status.success.onSolid,
  boxShadow: `${HALO} ${color.status.success.halo}`,
};

const activeMarker: React.CSSProperties = {
  background: color.brand.primary,
  color: color.brand.onPrimary,
  boxShadow: `${HALO} ${color.brand.halo}`,
};

/**
 * Skipped is a solid fill with a white numeral, like done and current — not the
 * outline-and-tint the unreached steps wear.
 *
 * It had the outline treatment on the reasoning that a skipped step is *empty*, so
 * the solid fills should mean "has an outcome". Beside the others that read as an
 * absence: same construction as the steps below it, differing only in hue, so a
 * step the reader passed over looked like one they had not got to. Skipped is a
 * state, and it now looks like one.
 *
 * `warning.fill` (#B45309) and not `warning.solid` (#FACC15): yellow at full
 * strength carries white at 1.53:1, which is why its `onSolid` is near-black ink —
 * and a black-on-yellow disc would outshout the step the reader is actually on.
 * The amber holds white at 5.02:1, clear of AA and stronger than either of the
 * other two markers. `check:contrast` enforces it.
 *
 * The dashed border goes with the change: a dash cannot read against a solid fill,
 * so "passed over" is carried by hue alone from here.
 */
const skippedMarker: React.CSSProperties = {
  background: color.status.warning.fill,
  // `text.inverse`, not `warning.onSolid` — that role is near-black, paired with
  // the bright `solid` yellow rather than with this amber `fill`.
  color: color.text.inverse,
  boxShadow: `${HALO} ${color.status.warning.halo}`,
};

/**
 * The connector, drawn as a repeating gradient rather than a dashed border.
 *
 * `border-style: dashed` hands the dash length to the browser, which sizes it
 * from the border width — so a 1px line gets 1px dashes and reads as a dotted
 * smear. A gradient states the rhythm outright: 6px of line, 2px of gap.
 *
 * Always grey, whatever the steps either side of it have done. The line is the
 * track the steps sit on — a fixed part of the frame — and the markers are what
 * carry state. Colouring completed segments green made the rail read as a
 * progress bar with a status of its own, and put a second green on screen
 * competing with the markers that actually mean something.
 */
function connector(): React.CSSProperties {
  return {
    backgroundImage: `repeating-linear-gradient(to bottom, ${color.border.default} 0 6px, transparent 6px 8px)`,
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

          /**
           * Rendered *inside* the label, after its text, exactly as `Input` puts its
           * asterisk inside its own label after a literal space.
           *
           * As a sibling in the flex row it sat at the edge of the label's box, which
           * is the same place as its last word only while the label fits on one line.
           * On a wrapping label it drifted to the right margin, next to whatever mark
           * followed — and a required marker modifies the word it follows or it says
           * nothing. The space is literal because `gap` cannot apply inside a text run.
           */
          const requiredMark = step.required ? (
            <>
              <span aria-hidden className="text-danger">
                {' *'}
              </span>
              <span className="sr-only">Required</span>
            </>
          ) : null;

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
                  // `left` and `top` are the marker's geometry, not free numbers:
                  // 13px puts the 1px line under the centre of a 28px box, and
                  // top-7 starts it where that box ends. Both move if the size does.
                  className="absolute bottom-0 left-[13px] top-7 w-px"
                  style={connector()}
                />
              )}

              <span
                className={[
                  'relative z-[1] grid h-7 w-7 shrink-0 place-items-center rounded-full text-caption-strong tabular-nums',
                  // Only the unreached steps are drawn as an outline. Done, current
                  // and skipped are all solid fills, set in the style objects above.
                  done || active || skipped ? '' : 'border border-border bg-surface text-text-tertiary',
                ].join(' ')}
                style={done ? doneMarker : active ? activeMarker : skipped ? skippedMarker : undefined}
              >
                {i + 1}
              </span>

              <span className="min-w-0 flex-1 pt-0.5">
                {/* `gap-1`, about the width of a space at this size — the same
                    spacing `Input` gets by rendering its asterisk inside the label
                    after a literal `{' '}`. A required marker modifies the word it
                    follows; wider than a space and it reads as its own item. */}
                <span className="flex items-start gap-2">
                  {/* Label and its asterisk are one unit. The skipped mark is a
                      separate flex item, so it can be pushed right without dragging
                      the asterisk with it — which is what happened when all three
                      sat in one row and the label wrapped: the marker for "this step
                      is required" ended up beside "SKIPPED" instead of the word it
                      modifies. */}
                  <span className="min-w-0">
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
                      {requiredMark}
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
                      {requiredMark}
                    </span>
                  )}
                  </span>
                  {/* Skipped rides on the header row, at its trailing edge, rather
                      than replacing the description below it. The description says
                      what the step is for, which is exactly what a reader deciding
                      whether to go back and fill it in needs — taking it away to
                      print one word was trading the useful line for the obvious
                      one. `ml-auto` pins it right so the marks form a column down
                      the rail instead of drifting with the label's length. */}
                  {skipped && (
                    <span className="ml-auto shrink-0 text-caption-strong uppercase text-[var(--ds-color-status-warning-fg)]">
                      Skipped
                    </span>
                  )}
                </span>
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
