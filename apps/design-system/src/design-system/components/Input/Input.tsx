'use client';

import * as React from 'react';
import { typography } from '../../tokens/tokens';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { Tooltip } from '../Tooltip/Tooltip';

/**
 * Input — text field extended from MUI, themed by tokens.
 * The label sits ABOVE the box (a standalone <label> with a gap), matching the
 * product — not MUI's floating outlined label. Helper/error text renders below.
 * The label is associated to the field (htmlFor/id) for accessibility.
 */
export interface InputProps
  extends Omit<TextFieldProps, 'variant' | 'size' | 'error' | 'color' | 'label'> {
  label?: string;
  /**
   * Explanation shown in a tooltip on an info icon beside the label. For the
   * sentence a user only needs once — `helperText` is for what they need every
   * time, and putting it there would leave a permanent paragraph under a field
   * whose meaning is obvious after the first read.
   */
  hint?: React.ReactNode;
  helperText?: React.ReactNode;
  /** Error message; presence sets the error state. */
  error?: string;
  size?: 'xs' | 'sm' | 'md';
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

/** Vertical padding that lands each size on its `controlHeight`, at 14px/20px text. */
const PAD_Y: Record<'xs' | 'sm' | 'md', string> = { xs: '6px', sm: '8px', md: '10px' };

export function Input({
  label,
  hint,
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
          className="mb-1.5 flex items-center gap-1.5 text-body-sm-strong text-text-primary"
        >
          <span>
            {label}
            {required && (
              <span aria-hidden className="text-danger">
                {' '}
                *
              </span>
            )}
          </span>
          {hint && (
            <Tooltip title={hint}>
              {/* Focusable so the explanation is reachable without a pointer. */}
              <span
                tabIndex={0}
                aria-label={typeof hint === 'string' ? hint : undefined}
                className="inline-flex shrink-0 text-icon-subtle"
              >
                <InfoOutlined sx={{ fontSize: 15 }} />
              </span>
            </Tooltip>
          )}
        </label>
      )}
      <TextField
        id={fieldId}
        variant="outlined"
        size={size === 'md' ? 'medium' : 'small'}
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
          // Shared control-height scale (xs 32 / sm 36 / md 40) — matches Button &
          // Select so controls always align in a toolbar. Multiline keeps auto height.
          '& .MuiInputBase-input:not(.MuiInputBase-inputMultiline)': {
            paddingTop: PAD_Y[size],
            paddingBottom: PAD_Y[size],
          },
          '& .MuiFormHelperText-root': { marginLeft: 0, marginTop: '6px', fontSize: typography.caption.fontSize },
        }}
        {...rest}
      />
    </div>
  );
}

export default Input;
