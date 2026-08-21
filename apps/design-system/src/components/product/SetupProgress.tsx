'use client';

import * as React from 'react';

/**
 * How close a draft is to being switchable on, sized to sit beside the button
 * that does it.
 *
 * Segments rather than a `Meter`: a Meter is a continuous proportion, and these
 * are a small countable set of discrete steps — four segments read as "four
 * things, three of them done", where a 75%-filled bar reads as a measurement and
 * invites the question "75% of what?".
 *
 * Counts only what actually gates activation. Sitting next to a disabled button,
 * an indicator that included the optional steps could read 4 of 5 while the
 * button stayed dead, and the reader would have no way to reconcile the two.
 */
export function SetupProgress({
  done,
  total,
  /** Phrase after the count — e.g. `required` or `required steps completed`. */
  label = 'required',
  /**
   * Which edge the count and bars hang off. `'end'` for the header it was built
   * for, where it sits against the action group; `'start'` in a left-hand column,
   * where a right-aligned tally would float away from everything above it.
   */
  align = 'end',
  layout = 'stack',
  className = '',
}: {
  done: number;
  total: number;
  label?: string;
  align?: 'start' | 'end';
  /**
   * `stack` — count above the bars (header). `inline` — count and bars on one
   * row, for a short docked footer.
   */
  layout?: 'stack' | 'inline';
  /** Replaces the default `hidden sm:flex` when the count must always show. */
  className?: string;
}) {
  return (
    <div
      className={[
        className || 'hidden sm:flex',
        layout === 'inline'
          ? 'flex-row items-center gap-2.5'
          : `flex-col gap-1.5 ${align === 'end' ? 'items-end' : 'items-start'}`,
      ].join(' ')}
      role="group"
      aria-label={`${done} of ${total} ${label}`}
    >
      <span className="whitespace-nowrap text-overline tabular-nums text-text-tertiary">
        {done} of {total} {label}
      </span>
      {/* aria-hidden: the label above already says the number, so the bars are
          decoration for a screen reader, not a second announcement. */}
      <span className="flex items-center gap-1" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`h-1 w-6 rounded-pill ${i < done ? '' : 'bg-border'}`}
            // Green from the first segment, not brand-orange until complete: a
            // done step is a done step, and it is the same green the checklist
            // below marks "Completed" with. It also keeps the header down to one
            // orange — the Activate button, once it is actually live.
            //
            // The status *fill* role, like Meter: a bar is a graphical object, and
            // the text roles read heavy as a solid block.
            style={i < done ? { background: 'var(--ds-color-status-success-fill)' } : undefined}
          />
        ))}
      </span>
    </div>
  );
}
