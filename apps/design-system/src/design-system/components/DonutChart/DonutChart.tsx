import * as React from 'react';

/**
 * DonutChart — a lightweight SVG donut (no chart library). Segments are drawn as
 * stroke arcs; the center shows a total, and an optional legend lists segments.
 * Colors are passed per-segment (use design tokens). Purely presentational.
 */
export interface DonutSegment {
  label: string;
  value: number;
  /** A CSS color — pass a token, e.g. 'var(--ds-color-status-success-solid)'. */
  color: string;
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
        <ul className="grid w-full grid-cols-2 gap-x-6 gap-y-2">
          {segments.map((seg, i) => (
            <li key={i} className="flex items-center gap-2 text-body-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-pill" style={{ background: seg.color }} />
              <span className="flex-1 truncate text-text-secondary">{seg.label}</span>
              <span className="font-emphasis text-text-primary">{seg.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DonutChart;
