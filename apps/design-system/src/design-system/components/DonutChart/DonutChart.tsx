import * as React from 'react';
import Link from 'next/link';

/**
 * DonutChart — a lightweight SVG donut (no chart library). Segments are drawn as
 * stroke arcs; the center shows a total, and an optional legend lists segments.
 * Colors are passed per-segment (use design tokens). Purely presentational.
 *
 * A segment may carry an `href`, which turns its legend row into the link to the
 * rows behind that wedge. The row keeps its colours exactly — the label stays
 * secondary and the value stays primary — because the affordance here is the row
 * itself, and re-tinting it blue would put a second visual system on top of the
 * one the swatch already establishes. Hover reveals it.
 */
export interface DonutSegment {
  label: string;
  value: number;
  /** A CSS color — pass a token, e.g. 'var(--ds-color-status-success-solid)'. */
  color: string;
  /** Where this slice's rows live. Makes the legend row a link. */
  href?: string;
}

export interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerValue?: React.ReactNode;
  centerLabel?: React.ReactNode;
  legend?: boolean;
  /** Accessible description of what the chart shows. */
  ariaLabel?: string;
}

export function DonutChart({
  segments,
  size = 180,
  thickness = 22,
  centerValue,
  centerLabel,
  legend = true,
  ariaLabel,
}: DonutChartProps) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const center = size / 2;

  let offset = 0;
  const arcs = segments.map((seg, i) => {
    const len = (seg.value / total) * c;
    const arc = (
      <circle
        key={i}
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth={thickness}
        strokeDasharray={`${len} ${c - len}`}
        strokeDashoffset={-offset}
      />
    );
    offset += len;
    return arc;
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={ariaLabel ?? 'Donut chart'}
        >
          {/* track */}
          <circle
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke="var(--ds-color-background-subtle)"
            strokeWidth={thickness}
          />
          <g transform={`rotate(-90 ${center} ${center})`}>{arcs}</g>
        </svg>
        {(centerValue != null || centerLabel != null) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue != null && (
              <div className="text-h2 leading-7 text-text-primary">{centerValue}</div>
            )}
            {centerLabel != null && <div className="text-caption text-text-secondary">{centerLabel}</div>}
          </div>
        )}
      </div>

      {legend && (
        // Columns size to their content and the block is centred, rather than
        // each cell stretching to half the card. Stretching put the value so far
        // from its own label that it sat nearer the *next* segment's swatch —
        // proximity said one thing and the row said another. Values still align
        // in a column, which is the reason the grid is here at all.
        // `minmax(0,auto)` and `w-full`, not bare `auto`: columns still size to
        // their content and the block still centres, but the grid can never grow
        // past the card, and the labels can still shrink and truncate inside a
        // narrow one.
        <ul className="grid w-full grid-cols-[minmax(0,auto)_minmax(0,auto)] justify-center gap-x-6 gap-y-1">
          {segments.map((seg, i) => {
            const row = (
              <>
                <span className="h-2 w-2 shrink-0 rounded-pill" style={{ background: seg.color }} />
                <span className="flex-1 truncate text-text-secondary">{seg.label}</span>
                <span className="font-emphasis text-text-primary">{seg.value}</span>
              </>
            );
            const rowClass = 'flex items-center gap-2 text-body-sm';
            return (
              <li key={i}>
                {seg.href ? (
                  <Link
                    href={seg.href}
                    className={`${rowClass} -mx-2 rounded-md px-2 py-1 transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle [&:hover>span:nth-child(2)]:underline`}
                  >
                    {row}
                  </Link>
                ) : (
                  // No horizontal padding here: only the link needs it, and it
                  // pays for it with a matching negative margin. Adding it to a
                  // plain row would take real width from the label in a narrow
                  // card and truncate a word that used to fit.
                  <span className={`${rowClass} py-1`}>{row}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default DonutChart;
