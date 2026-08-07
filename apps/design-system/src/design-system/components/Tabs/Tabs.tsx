'use client';

import * as React from 'react';
import MuiTabs from '@mui/material/Tabs';
import MuiTab from '@mui/material/Tab';

/**
 * Tabs — section navigation matching the product: an orange underline indicator
 * with the active label in brand orange (AA-safe darker orange as text; the
 * vibrant indicator is a UI graphic). Used for detail-page sections.
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
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--ds-color-text-secondary)',
          '&:hover': { color: 'var(--ds-color-text-primary)' },
          '&.Mui-selected': { color: 'var(--ds-color-text-brand)', fontWeight: 600 },
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
