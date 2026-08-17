'use client';

import * as React from 'react';
import { color } from '../../tokens/tokens';

/**
 * StatusChip — the product's status/label pill (colored dot + label on a tinted
 * background). One component, one intent→color mapping, used for every status
 * and (with `dot={false}`) risk/severity badge across the product.
 *
 * Intents map to semantic status tokens, which in turn map to lifecycle-state
 * "intents" in the Product Knowledge Base (neutral/info/warning/success/error).
 */
export type StatusIntent = 'info' | 'success' | 'warning' | 'caution' | 'danger' | 'neutral';

export interface StatusChipProps {
  /** Semantic role. @default 'neutral' */
  intent?: StatusIntent;
  /** Text shown in the chip. */
  label: string;
  /** Leading status dot. Set false for risk/severity badges. @default true */
  dot?: boolean;
  /** Emphasis: subtle tinted (default) or solid fill. @default 'subtle' */
  emphasis?: 'subtle' | 'solid';
}

export function StatusChip({
  intent = 'neutral',
  label,
  dot = true,
  emphasis = 'subtle',
}: StatusChipProps) {
  const s = color.status[intent];
  const style: React.CSSProperties =
    emphasis === 'solid'
      ? { background: s.solid, color: s.onSolid, border: `1px solid ${s.solid}` }
      : { background: s.subtle, color: s.fg, border: `1px solid ${s.border}` };

  return (
    <span
      /* Height comes from the `caption` type step (12/16) — no `leading-*`
         override, so the chip stays 22px and tracks the scale if it changes.
         `whitespace-nowrap` because a chip is a single mark: as a flex item in a
         tight cell it would otherwise shrink and wrap its label onto a second
         line, silently making one table row taller than its neighbours.

         `-medium` (500), not `-strong` (600): a chip is already marked out by a
         tint, a border and a dot, so 600 was a fourth signal saying the same
         thing — and in a table it made every status read louder than the row it
         describes. Done by switching the type token, which is the only way the
         scale permits a weight change (see `check:type`). */
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill px-2 py-0.5 text-caption-medium"
      style={style}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-pill"
          style={{ background: emphasis === 'solid' ? s.onSolid : s.solid }}
        />
      )}
      {label}
    </span>
  );
}

export default StatusChip;
