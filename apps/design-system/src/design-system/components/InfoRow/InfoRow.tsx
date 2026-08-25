'use client';

import * as React from 'react';

/**
 * InfoRow — label/value row for framed Card flush lists (padding="none").
 *
 * Client component: the group shares its emphasis with its rows through context,
 * and `createContext` is client-only.
 *
 * Laid out like a two-column table via CSS subgrid: the label column shares one
 * width across the group so every value starts on the same left edge. The bottom
 * border is on the row (full width); the last row has no border.
 */

/**
 * Which half of the pair carries the weight.
 *
 * - `value` (default) — the label names the field quietly and the **value** is
 *   emphasised. Right almost everywhere: on a detail rail you already know the
 *   fields, and you are scanning for what they say.
 * - `label` — the **label** is emphasised and the value recedes. For a summary
 *   read cold, where the reader is learning *which* fields exist as much as what
 *   is in them (e.g. a peek drawer opened from a table). Also darkens the icon
 *   to `icon.default`, since the icon belongs to the label.
 *
 * Set it on `InfoRowGroup` — the whole group shares one emphasis, because a
 * group with two of them has no hierarchy left to read.
 */
export type InfoRowEmphasis = 'value' | 'label';

const EmphasisContext = React.createContext<InfoRowEmphasis>('value');

export interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  /**
   * Leading icon, outlined at 18px (`sx={{ fontSize: 18 }}`).
   * It inherits its colour from the group's emphasis, so pass an uncoloured icon:
   * `icon.subtle` (#808B9E) by default, `icon.default` (#44546F) when the label
   * leads. Both clear the 3:1 WCAG 1.4.11 floor on surface and canvas.
   *
   * Default on a scan list: the icon column is what lets the eye find a field
   * without reading every label. Omit it on **every** row in a group — a tight
   * peek, for example — never on one row and not the others, or the column
   * breaks for the rows around it.
   */
  icon?: React.ReactNode;
  /** Applied to the row (e.g. `px-4` when not inside a DS Card gutter). */
  className?: string;
  /**
   * Drop the value cell's `truncate`, so it neither ellipsizes nor clips.
   *
   * The default is right for text — a clipped sentence still reads, and every row
   * keeps the same height. It is wrong twice over for richer values: clipping cuts
   * a chip in half, and `overflow: hidden` also shaves anything that paints
   * outside its own box, such as a circle avatar's ring. A value that still needs
   * to ellipsize can truncate its own text span inside.
   */
  valueWrap?: boolean;
}

export function InfoRow({ label, value, icon, className = '', valueWrap = false }: InfoRowProps) {
  const emphasis = React.useContext(EmphasisContext);
  const labelLeads = emphasis === 'label';

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
      <div
        role="cell"
        className={[
          'flex min-w-0 items-center gap-2.5 py-3',
          labelLeads ? 'text-body-sm-strong text-text-primary' : 'text-body-sm text-text-secondary',
        ].join(' ')}
      >
        {icon != null && (
          <span
            className={[
              // 18×18 matches the required icon size. `block` on the SVG kills the
              // inline baseline gap that left outlined glyphs sitting a pixel above
              // the label; `translate-y-px` then matches the optical centre of
              // body-sm (cap-height, not the full line box).
              'inline-flex h-[18px] w-[18px] shrink-0 translate-y-px items-center justify-center [&_svg]:block',
              labelLeads ? 'text-icon' : 'text-icon-subtle',
            ].join(' ')}
          >
            {icon}
          </span>
        )}
        <span className="whitespace-nowrap">{label}</span>
      </div>
      <div
        role="cell"
        className={[
          'min-w-0 py-3 text-left',
          valueWrap ? '' : 'truncate',
          labelLeads ? 'text-body-sm text-text-secondary' : 'text-body-sm-medium text-text-primary',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {value}
      </div>
    </div>
  );
}

/**
 * Wraps InfoRows so they share one column layout (values line up), full-width
 * row dividers, and one emphasis.
 */
export function InfoRowGroup({
  children,
  emphasis = 'value',
  className = '',
}: {
  children: React.ReactNode;
  /** Which half carries the weight — see {@link InfoRowEmphasis}. @default 'value' */
  emphasis?: InfoRowEmphasis;
  className?: string;
}) {
  return (
    <EmphasisContext.Provider value={emphasis}>
      <div
        role="table"
        className={['grid w-full grid-cols-[auto_minmax(0,1fr)] gap-x-4', className]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    </EmphasisContext.Provider>
  );
}

export default InfoRow;
