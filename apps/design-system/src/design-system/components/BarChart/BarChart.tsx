import * as React from 'react';

/**
 * BarChart — a horizontal, ranked bar comparison (no chart library).
 *
 * The sibling of `DonutChart`, and the two are not interchangeable: a donut
 * answers "how does this whole split up", where this answers "which of these is
 * biggest". Reach for it whenever the categories are *named things* rather than
 * parts of one quantity — applications, departments, policies. A ranked list of
 * five application names rendered as a donut is five near-identical wedges the
 * reader has to consult a legend to tell apart.
 *
 * Horizontal, not vertical, because the labels are names: a vertical bar chart
 * has to rotate them or truncate them, and a name the reader cannot read makes
 * the bar above it meaningless.
 *
 * Built from divs rather than SVG, unlike the donut. A donut's geometry needs
 * arcs; a bar is a rectangle, and expressing it in markup keeps the labels and
 * values as real text — selectable, translatable, and read in order by a screen
 * reader without an `aria-label` having to restate the whole dataset.
 */
export interface BarDatum {
  label: string;
  value: number;
  /** A CSS color — pass a token, e.g. 'var(--ds-color-status-info-fill)'. */
  color: string;
}

export interface BarChartProps {
  bars: BarDatum[];
  /**
   * The value the longest bar represents. Defaults to the largest in `bars`.
   *
   * Pass it explicitly to put two charts on one scale — without it, each chart
   * normalises to its own maximum and two side-by-side charts imply a comparison
   * that is not true.
   */
  max?: number;
  /** Rendered after each value, e.g. '%'. */
  suffix?: string;
  /** Accessible name for the group. */
  ariaLabel?: string;
}

export function BarChart({ bars, max, suffix = '', ariaLabel }: BarChartProps) {
  const ceiling = Math.max(max ?? 0, ...bars.map((b) => b.value), 1);

  if (bars.length === 0) {
    return <p className="text-body-sm text-text-tertiary">Nothing to plot in this scope.</p>;
  }

  return (
    <ul className="flex flex-col gap-2.5" aria-label={ariaLabel}>
      {bars.map((b) => {
        const share = (b.value / ceiling) * 100;
        return (
          <li key={b.label} className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_auto] items-center gap-3">
            <span className="truncate text-body-sm text-text-secondary" title={b.label}>
              {b.label}
            </span>
            {/* The track is what makes the bars comparable — without it a short bar
                reads as a small thing rather than a small share of the same scale. */}
            <span className="h-2 w-full overflow-hidden rounded-pill bg-subtle">
              <span
                className="block h-full rounded-pill"
                // A minimum width so a nonzero-but-tiny value is still visibly a
                // bar. Zero stays zero: inventing a stub for it would be a lie.
                style={{ width: b.value === 0 ? 0 : `max(3px, ${share}%)`, background: b.color }}
              />
            </span>
            <span className="w-10 text-right text-body-sm-strong tabular-nums text-text-primary">
              {b.value.toLocaleString()}
              {suffix}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default BarChart;
