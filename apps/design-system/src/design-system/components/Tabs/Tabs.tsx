'use client';

import * as React from 'react';
import MuiTabs from '@mui/material/Tabs';
import MuiTab from '@mui/material/Tab';
import { typography } from '../../tokens/tokens';

/**
 * Tabs — section navigation matching the product: a 1px brand underline with the
 * active label in the same vibrant brand orange. 14px regular throughout; the
 * selected tab is marked by colour and the indicator, not by weight, so labels
 * never shift width as the selection moves.
 *
 * A tab is **32px** tall, so the band a page devotes to section switching stays a
 * thin strip rather than a second header.
 *
 * ACCESSIBILITY EXCEPTION, chosen by the product owner: `brand.primary` (#EB5424) on
 * a white surface is 3.60:1, below WCAG AA for 14px regular text — that is exactly
 * why `text.brand` (#C9441E, 4.85:1) exists and was used here before. Recorded as a
 * waiver in `check-contrast.ts`. The underline is a non-colour cue and `aria-selected`
 * carries the state, so selection is not conveyed by colour alone.
 */
export interface TabItem {
  value: string;
  label: string;
  /** Optional count shown after the label (e.g. Owners (4)). */
  count?: number;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  'aria-label'?: string;
  /** Omit the bottom border (e.g. when a parent provides a full-width line). */
  noBorder?: boolean;
}

export function Tabs({ items, value, onChange, 'aria-label': ariaLabel, noBorder = false }: TabsProps) {
  return (
    <MuiTabs
      value={value}
      onChange={(_, v) => onChange(v)}
      aria-label={ariaLabel}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 32,
        ...(noBorder ? {} : { borderBottom: '1px solid var(--ds-color-border-default)' }),
        // MUI hides the scrollable strip's native scrollbar two ways: a CSS rule
        // (`scrollbar-width: none` + `::-webkit-scrollbar`) AND, as a fallback for
        // engines that ignore it, a negative `margin-bottom` on the scroller equal
        // to the measured scrollbar height, clipped by `overflow: hidden` on the
        // root. On classic-scrollbar platforms (e.g. the Windows webview Cursor
        // embeds) that margin is ~-10px, which drags the 1px indicator — pinned to
        // the scroller's bottom — into the clipped zone, so the active underline
        // vanishes. The CSS rule already hides the scrollbar, so we can zero the
        // fallback margin and keep the indicator on the baseline everywhere.
        '& .MuiTabs-scroller': { marginBottom: '0 !important' },
        '& .MuiTabs-indicator': { backgroundColor: 'var(--ds-color-brand-primary)', height: '1px' },
        '& .MuiTab-root': {
          // 32px exactly. MUI's default 12px block padding around a 17.5px label
          // made the tab 41.5px tall and overrode any minHeight below that, so the
          // padding is zeroed and the height comes from minHeight alone — the label
          // is centred by the Tab's own flex, which keeps the number on the 4px grid
          // instead of needing a 7px padding to hit 32.
          minHeight: 32,
          paddingBlock: 0,
          paddingInline: 0,
          marginRight: '24px',
          textTransform: 'none',
          // From the scale, not literals: a tab label is `body` (14/400). Selection is
          // marked by colour and the indicator, never by weight, so labels never shift
          // width as the selection moves.
          fontSize: typography.body.fontSize,
          fontWeight: typography.body.fontWeight,
          color: 'var(--ds-color-text-secondary)',
          '&:hover': { color: 'var(--ds-color-text-primary)' },
          // Same orange as the indicator — see the accessibility note above.
          '&.Mui-selected': { color: 'var(--ds-color-brand-primary)' },
        },
      }}
    >
      {items.map((t) => (
        <MuiTab
          key={t.value}
          value={t.value}
          disabled={t.disabled}
          label={t.count != null ? `${t.label} (${t.count})` : t.label}
        />
      ))}
    </MuiTabs>
  );
}

export default Tabs;
