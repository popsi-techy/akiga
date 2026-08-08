'use client';

import * as React from 'react';
import { typography } from '../../tokens/tokens';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

/**
 * Input — text field extended from MUI, themed by tokens.
 * The label sits ABOVE the box (a standalone <label> with a gap), matching the
 * product — not MUI's floating outlined label. Helper/error text renders below.
 * The label is associated to the field (htmlFor/id) for accessibility.
 */
export interface InputProps
  extends Omit<TextFieldProps, 'variant' | 'size' | 'error' | 'color' | 'label'> {
  label?: string;
  helperText?: React.ReactNode;
  /** Error message; presence sets the error state. */
  error?: string;
  size?: 'sm' | 'md';
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

export function Input({
  label,
  helperText,
  error,
  required,
  size = 'sm',
  startAdornment,
  endAdornment,
  fullWidth = true,
  id,
  InputProps,
  ...rest
}: InputProps) {
  const reactId = React.useId();
  const fieldId = id ?? reactId;

  return (
    <div className={fullWidth ? 'w-full' : 'inline-block'}>
      {label && (
        <label
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
        variant="outlined"
        size={size === 'sm' ? 'small' : 'medium'}
        required={required}
        error={Boolean(error)}
        helperText={error || helperText}
        fullWidth={fullWidth}
        InputProps={{
          ...InputProps,
          startAdornment: startAdornment ? (
            <InputAdornment position="start">{startAdornment}</InputAdornment>
          ) : (
            InputProps?.startAdornment
          ),
          endAdornment: endAdornment ? (
            <InputAdornment position="end">{endAdornment}</InputAdornment>
          ) : (
            InputProps?.endAdornment
          ),
        }}
        sx={{
          '& .MuiInputBase-root': { borderRadius: 'var(--ds-radius-md)', fontSize: typography.body.fontSize, backgroundColor: 'var(--ds-color-surface-default)' },
          // Shared control-height scale (sm 36px / md 40px) — matches Button & Select
          // so controls always align in a toolbar. Multiline keeps auto height.
          '& .MuiInputBase-input:not(.MuiInputBase-inputMultiline)': {
            paddingTop: size === 'sm' ? '8px' : '10px',
            paddingBottom: size === 'sm' ? '8px' : '10px',
          },
          '& .MuiFormHelperText-root': { marginLeft: 0, marginTop: '6px', fontSize: typography.caption.fontSize },
        }}
        {...rest}
      />
    </div>
  );
}

export default Input;
