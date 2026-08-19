'use client';

import * as React from 'react';
import { typography } from '../../tokens/tokens';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

/**
 * Select — a single-choice dropdown built on MUI's select-mode TextField.
 * Matches Input: the label sits ABOVE the box (standalone <label>), helper/error
 * below. The label is associated via aria-labelledby for accessibility.
 */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: React.ReactNode;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md';
  fullWidth?: boolean;
  id?: string;
  /**
   * Accessible name when there is no visible `label` — e.g. a field that sits under
   * a shared heading. Without it the combobox announces only its current value,
   * which says nothing about what it controls.
   */
  ariaLabel?: string;
  /**
   * Which side butts against a neighbouring element in an attached group (e.g. a
   * static caption segment to the field's left). That side loses its corner radius
   * and its border, so the pair reads as one control instead of two touching ones.
   */
  attached?: 'left' | 'right';
}

export function Select({
  label,
  options,
  value,
  onChange,
  placeholder,
  helperText,
  error,
  required,
  disabled,
  size = 'sm',
  fullWidth = true,
  id,
  ariaLabel,
  attached,
}: SelectProps) {
  const reactId = React.useId();
  const fieldId = id ?? reactId;
  const labelId = `${fieldId}-label`;
  const r = 'var(--ds-radius-md)';
  const radius = attached === 'left' ? `0 ${r} ${r} 0` : attached === 'right' ? `${r} 0 0 ${r}` : r;

  return (
    <div className={fullWidth ? 'w-full' : 'inline-block'}>
      {label && (
        <label
          id={labelId}
          htmlFor={fieldId}
          className="mb-1.5 block text-body-sm-strong text-text-primary"
        >
          {label}
          {required && (
            <span aria-hidden className="text-danger">
              {' '}
              *
            </span>
          )}
        </label>
      )}
      <TextField
        id={fieldId}
        select
        variant="outlined"
        size={size === 'md' ? 'medium' : 'small'}
        required={required}
        disabled={disabled}
        error={Boolean(error)}
        helperText={error || helperText}
        fullWidth={fullWidth}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        SelectProps={{
          // MUI builds the combobox's accessible name from labelId — this links
          // our external <label> so screen readers announce it.
          labelId: label ? labelId : undefined,
          // The rendered combobox is the SelectDisplay node, so the name has to go
          // there — `inputProps` would land on MUI's hidden input instead.
          SelectDisplayProps: ariaLabel ? { 'aria-label': ariaLabel } : undefined,
          displayEmpty: Boolean(placeholder),
          renderValue: placeholder
            ? (selected) => {
                if (!selected) return <span className="text-text-disabled">{placeholder}</span>;
                return options.find((o) => o.value === selected)?.label ?? String(selected);
              }
            : undefined,
          MenuProps: { PaperProps: { sx: { '& .MuiMenuItem-root': { fontSize: typography.body.fontSize } } } },
        }}
        sx={{
          '& .MuiInputBase-root': { borderRadius: radius, fontSize: typography.body.fontSize, backgroundColor: 'var(--ds-color-surface-default)' },
          ...(attached && {
            // Drop the shared edge — the neighbour already draws it, and two 1px
            // borders meeting would read as a 2px seam down the middle.
            '& .MuiOutlinedInput-notchedOutline': {
              [attached === 'left' ? 'borderLeftWidth' : 'borderRightWidth']: 0,
            },
          }),
          // Shared control-height scale (sm 36px / md 40px) — matches Button & Input.
          '& .MuiSelect-select': {
            paddingTop: size === 'xs' ? '6px' : size === 'sm' ? '8px' : '10px',
            paddingBottom: size === 'xs' ? '6px' : size === 'sm' ? '8px' : '10px',
          },
          '& .MuiFormHelperText-root': { marginLeft: 0, marginTop: '6px', fontSize: typography.caption.fontSize },
        }}
      >
        {options.map((o) => (
          <MenuItem key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </MenuItem>
        ))}
      </TextField>
    </div>
  );
}

export default Select;
