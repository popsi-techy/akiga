'use client';

import * as React from 'react';
import MuiButton, { type ButtonProps as MuiButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { controlHeight as CONTROL_HEIGHT } from '../../tokens/tokens';

/**
 * Button — extends MUI Button with the product's semantic variants.
 * We map product variants onto MUI's variant+color and theme the rest via muiTheme,
 * rather than restyling MUI ad hoc. Custom logic added only for `loading`.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends Omit<MuiButtonProps, 'variant' | 'color' | 'size'> {
  /** Visual role. @default 'primary' */
  variant?: ButtonVariant;
  /** @default 'md' */
  size?: ButtonSize;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
}

const sizeMap: Record<ButtonSize, MuiButtonProps['size']> = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
};

export function Button({
  variant = 'primary',
  size = 'sm',
  loading = false,
  disabled,
  startIcon,
  children,
  sx,
  ...rest
}: ButtonProps) {
  const muiVariant: MuiButtonProps['variant'] =
    variant === 'secondary' ? 'outlined' : variant === 'tertiary' ? 'text' : 'contained';
  const color: MuiButtonProps['color'] = variant === 'danger' ? 'error' : 'primary';

  // Secondary is a neutral-bordered button (matches the product's white "Filter"/"Deactivate").
  const secondarySx =
    variant === 'secondary'
      ? {
          color: 'var(--ds-color-text-primary)',
          borderColor: 'var(--ds-color-border-default)',
          backgroundColor: 'var(--ds-color-surface-default)',
          '&:hover': {
            borderColor: 'var(--ds-color-border-strong)',
            backgroundColor: 'var(--ds-color-surface-hover)',
          },
        }
      : {};

  const tertiarySx =
    variant === 'tertiary'
      ? { color: 'var(--ds-color-text-secondary)', '&:hover': { backgroundColor: 'var(--ds-color-surface-hover)' } }
      : {};

  // Shared control-height scale — every form control (Button/Input/Select) uses
  // the SAME height per size, so same-size controls always line up in a toolbar.
  const heightSx = { minHeight: CONTROL_HEIGHT[size], height: CONTROL_HEIGHT[size] };

  return (
    <MuiButton
      variant={muiVariant}
      color={color}
      size={sizeMap[size]}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={16} color="inherit" thickness={5} /> : startIcon}
      sx={{ ...heightSx, ...secondarySx, ...tertiarySx, ...sx }}
      {...rest}
    >
      {children}
    </MuiButton>
  );
}

export default Button;
