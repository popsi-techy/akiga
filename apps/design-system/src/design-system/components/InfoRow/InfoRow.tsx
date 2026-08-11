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
  /**
   * Leading icon — **required**, and outlined at 18px (`sx={{ fontSize: 18 }}`).
   * It inherits `icon.subtle` (#808B9E), so pass an uncoloured icon. Subtle, not
   * `icon.default`: the icon column is a scan aid, and at 18px beside a
   * `body-sm` label it should locate the row without competing with the value
   * that the row exists to show. 3.44:1 on both surface and canvas — above the
   * 3:1 WCAG 1.4.11 floor for non-text content.
   *
   * Required rather than optional because a group of these is a scan target: the
   * icon column is what lets the eye find "Owners" without reading four labels,
   * and one row missing its icon breaks the column for every row above and below
   * it. `icon={null}` is not an escape hatch — if a row has no meaningful icon,
   * the row probably belongs in a different card.
   */
  icon: React.ReactNode;
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
        {icon != null && <span className="shrink-0 text-icon-subtle">{icon}</span>}
        <span className="whitespace-nowrap">{label}</span>
      </div>
      <div
        role="cell"
        className="min-w-0 truncate py-3 text-left text-body-sm-strong text-text-primary"
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
