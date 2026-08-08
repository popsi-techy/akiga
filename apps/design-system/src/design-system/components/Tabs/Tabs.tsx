'use client';

import * as React from 'react';
import MuiTabs from '@mui/material/Tabs';
import MuiTab from '@mui/material/Tab';
import { typography } from '../../tokens/tokens';

/**
 * Tabs — section navigation matching the product: a 2px brand underline with the
 * active label in the same vibrant brand orange. 14px regular throughout; the
 * selected tab is marked by colour and the indicator, not by weight, so labels
 * never shift width as the selection moves.
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
        minHeight: 40,
        ...(noBorder ? {} : { borderBottom: '1px solid var(--ds-color-border-default)' }),
        '& .MuiTabs-indicator': { backgroundColor: 'var(--ds-color-brand-primary)', height: 2 },
        '& .MuiTab-root': {
          minHeight: 40,
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
