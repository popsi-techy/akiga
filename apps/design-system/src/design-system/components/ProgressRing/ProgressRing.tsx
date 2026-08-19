'use client';

import * as React from 'react';

/**
 * ProgressRing — "N of M done" as a ring small enough to sit inside a button.
 *
 * The case it exists for: a control that is disabled until some countable set of
 * things is finished. Left to itself that button says only "no", and the reader has
 * to find the explanation somewhere else on the screen — which is how a header ends
 * up carrying a separate meter beside the button it describes, two elements saying
 * one thing. Put the ring in the button and the control answers "why not yet" and
 * "how far off" in the place the reader is already looking.
 *
 * ## Why a ring rather than the segmented `SetupProgress`
 *
 * Segments read better standing alone, where there is room to count them. At icon
 * size there is no room to count anything, and a ring closing is legible at 18px in
 * a way three 6px dashes are not. Use `SetupProgress` when the indicator is its own
 * element; use this when it has to live inside a control.
 *
 * ## The completion moment
 *
 * The arc animates as the count changes, and the last step swaps it for a check that
 * draws itself. That is the one moment worth animating here — the visual language
 * asks for motion exactly where a state change would otherwise appear to teleport,
 * and "the button you could not press is now the button you should press" is that
 * change. Everything else is instant.
 *
 * ## Colour
 *
 * The track and the tick inherit (`currentColor`), so they dim with a disabled host
 * and turn with it when it goes primary — a ring that picked its own colour for those
 * would have to be told about every state its host can be in.
 *
 * The *progress arc* may take an `accent`, and usually should. Inheriting there means
 * the one part carrying information is drawn in the host's disabled grey, which is
 * exactly where it is least visible and most needed. Passing the success colour also
 * matches `SetupProgress`, where a completed segment has always been green.
 */
export interface ProgressRingProps {
  /** How many are done. Clamped to `total`. */
  value: number;
  /** How many there are in all. */
  total: number;
  /** Box size in px. @default 18 — sized for a button's icon slot. */
  size?: number;
  /** Ring thickness in px. @default 2 */
  thickness?: number;
  /**
   * Colour of the completed arc. Defaults to `currentColor`; pass a token when the
   * host is disabled, or the progress is drawn in the host's dimmest colour.
   */
  accent?: string;
  className?: string;
}

export function ProgressRing({
  value,
  total,
  size = 18,
  thickness = 2,
  accent,
  className = '',
}: ProgressRingProps) {
  const safeTotal = Math.max(1, total);
  const done = Math.max(0, Math.min(value, safeTotal));
  const complete = done >= safeTotal;

  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - done / safeTotal);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`shrink-0 ${className}`}
      // Decorative: every caller pairs this with a label that already states the
      // count, and a second announcement of the same number helps nobody.
      aria-hidden="true"
      focusable="false"
    >
      {/* The track, in the host's colour at low opacity — so it dims and brightens
          with whatever state the button is in, without naming a colour. */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={thickness}
        opacity={0.25}
      />
      {!complete && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={accent ?? 'currentColor'}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          // From 12 o'clock, clockwise — the direction a reader expects progress to
          // travel. SVG arcs start at 3 o'clock without this.
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: `stroke-dashoffset var(--ds-motion-duration-slower, 400ms) var(--ds-motion-easing-standard, ease)`,
          }}
        />
      )}
      {complete && (
        <path
          d={`M ${size * 0.28} ${size * 0.52} L ${size * 0.43} ${size * 0.68} L ${size * 0.73} ${size * 0.34}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ds-check-draw"
        />
      )}
    </svg>
  );
}

export default ProgressRing;
