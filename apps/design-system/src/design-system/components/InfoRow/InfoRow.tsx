import * as React from 'react';

/**
 * InfoRow — label/value row for framed Card flush lists (padding="none").
 *
 * Laid out like a two-column table via CSS subgrid: the label column shares one
 * width across the group so every value starts on the same left edge. The bottom
 * border is on the row (full width); the last row has no border.
 */
export interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  /** Optional leading icon (inherits `text-icon`). */
  icon?: React.ReactNode;
  /** Applied to the row (e.g. `px-4` when not inside a DS Card gutter). */
  className?: string;
}

export function InfoRow({ label, value, icon, className = '' }: InfoRowProps) {
  return (
    <div
      role="row"
      className={[
        'col-span-2 grid grid-cols-subgrid items-center border-b border-border last:border-b-0',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div role="cell" className="flex min-w-0 items-center gap-2.5 py-3 text-body-sm text-text-secondary">
        {icon != null && <span className="shrink-0 text-icon">{icon}</span>}
        <span className="whitespace-nowrap">{label}</span>
      </div>
      <div
        role="cell"
        className="min-w-0 truncate py-3 text-left text-body-sm font-medium text-text-primary"
      >
        {value}
      </div>
    </div>
  );
}

/**
 * Wraps InfoRows so they share one column layout (values line up) and full-width
 * row dividers.
 */
export function InfoRowGroup({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="table"
      className={[
        'grid w-full grid-cols-[auto_minmax(0,1fr)] gap-x-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

export default InfoRow;
