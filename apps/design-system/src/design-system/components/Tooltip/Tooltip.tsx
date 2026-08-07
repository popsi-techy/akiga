'use client';

import * as React from 'react';
import MuiTooltip, { type TooltipProps as MuiTooltipProps } from '@mui/material/Tooltip';

/**
 * Tooltip — a small contextual label on hover/focus. Wraps MUI Tooltip (overlay,
 * positioning, focus/hover handling) and themes it with design-system tokens: the
 * dark sidebar surface + white text, matching the product's inverse surfaces.
 *
 * The single child must forward a ref (a DOM element or a component using
 * forwardRef) so the tooltip can anchor to it.
 */
export interface TooltipProps {
  title: React.ReactNode;
  children: React.ReactElement;
  placement?: MuiTooltipProps['placement'];
  /** Show the little pointer arrow. @default true for `label`, false for `card` */
  arrow?: boolean;
  /**
   * - `label` (default) — small dark contextual label for a few words.
   * - `card` — light surface panel for rich content. The tooltip contributes only
   *   the surface, border and elevation; the content supplies its own padding and
   *   type, so it can hold headings, dividers and chips. No arrow by default, since
   *   a bordered arrow cannot meet a bordered panel cleanly.
   */
  variant?: 'label' | 'card';
}

export function Tooltip({
  title,
  children,
  placement = 'top',
  arrow,
  variant = 'label',
}: TooltipProps) {
  const isCard = variant === 'card';
  const showArrow = arrow ?? !isCard;

  return (
    <MuiTooltip
      title={title}
      placement={placement}
      arrow={showArrow}
      componentsProps={{
        tooltip: {
          sx: isCard
            ? {
                bgcolor: 'var(--ds-color-surface-default)',
                color: 'var(--ds-color-text-primary)',
                // MUI's tooltip class sets 500; a card is a surface, so reset to a
                // normal baseline and let its content opt into weight. Otherwise
                // body copy inherits label weight and flattens the hierarchy.
                fontWeight: 400,
                p: 0,
                maxWidth: 'none',
                borderRadius: 'var(--ds-radius-lg)',
                border: '1px solid var(--ds-color-border-default)',
                boxShadow: 'var(--ds-elevation-lg)',
              }
            : {
                bgcolor: 'var(--ds-color-background-sidebar)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 500,
                lineHeight: 1.4,
                borderRadius: 'var(--ds-radius-md)',
                px: 1.25,
                py: 0.75,
              },
        },
        arrow: {
          sx: {
            color: isCard
              ? 'var(--ds-color-surface-default)'
              : 'var(--ds-color-background-sidebar)',
          },
        },
      }}
    >
      {children}
    </MuiTooltip>
  );
}

export default Tooltip;
