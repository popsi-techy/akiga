'use client';

import * as React from 'react';
import MuiButton, { type ButtonProps as MuiButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { controlHeight as CONTROL_HEIGHT } from '../../tokens/tokens';

/**
 * Button — extends MUI Button with the product's semantic variants.
 * We map product variants onto MUI's variant+color and theme the rest via muiTheme,
 * rather than restyling MUI ad hoc. Custom logic added only for `loading` and for
 * how `disabled` is exposed to assistive tech.
 *
 * A gated action (Activate until setup is done) must stay in the tab order.
 * Native `disabled` removes it (`tabindex=-1`), so a hover-only tooltip of *why*
 * fails keyboard access (2.1.1) and never appears on focus (1.4.13). We map
 * `disabled` to `aria-disabled` instead: it looks unavailable, clicks are
 * swallowed, and a wrapping Tooltip can open on focus. `loading` still uses
 * native `disabled` — a spinner is not something to inspect.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

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
  // `xs` rides MUI's `small` and takes its height from the shared scale below.
  xs: 'small',
  sm: 'small',
  md: 'medium',
  lg: 'large',
};

/** Shared unavailable look — receded fill, AA text, no extra outline. */
const unavailableSx = {
  color: 'var(--ds-color-text-tertiary)',
  backgroundColor: 'var(--ds-color-surface-disabled)',
  borderColor: 'transparent',
  boxShadow: 'none',
  outline: 'none',
  cursor: 'not-allowed',
  '&:hover': {
    color: 'var(--ds-color-text-tertiary)',
    backgroundColor: 'var(--ds-color-surface-disabled)',
    borderColor: 'transparent',
    boxShadow: 'none',
  },
};

export function Button({
  variant = 'primary',
  size = 'sm',
  loading = false,
  disabled = false,
  startIcon,
  children,
  sx,
  onClick,
  className,
  ...rest
}: ButtonProps) {
  const muiVariant: MuiButtonProps['variant'] =
    variant === 'secondary' ? 'outlined' : variant === 'tertiary' ? 'text' : 'contained';
  const color: MuiButtonProps['color'] = variant === 'danger' ? 'error' : 'primary';
  const unavailable = Boolean(disabled) && !loading;

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
          '&.Mui-disabled, &[aria-disabled="true"]': {
            ...unavailableSx,
            borderColor: 'var(--ds-color-border-default)',
            '&:hover': {
              ...unavailableSx['&:hover'],
              borderColor: 'var(--ds-color-border-default)',
            },
          },
        }
      : {};

  const tertiarySx =
    variant === 'tertiary'
      ? {
          color: 'var(--ds-color-text-secondary)',
          '&:hover': { backgroundColor: 'var(--ds-color-surface-hover)' },
          '&.Mui-disabled, &[aria-disabled="true"]': {
            ...unavailableSx,
            backgroundColor: 'transparent',
            boxShadow: 'none',
            '&:hover': { backgroundColor: 'transparent' },
          },
        }
      : {};

  // Shared control-height scale — every form control (Button/Input/Select) uses
  // the SAME height per size, so same-size controls always line up in a toolbar.
  const heightSx = { minHeight: CONTROL_HEIGHT[size], height: CONTROL_HEIGHT[size] };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (unavailable) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClick?.(event);
  };

  return (
    <MuiButton
      variant={muiVariant}
      color={color}
      size={sizeMap[size]}
      disabled={loading}
      aria-disabled={unavailable || undefined}
      className={[unavailable ? 'Mui-disabled' : '', className].filter(Boolean).join(' ') || undefined}
      onClick={handleClick}
      startIcon={loading ? <CircularProgress size={16} color="inherit" thickness={5} /> : startIcon}
      sx={{ ...heightSx, ...secondarySx, ...tertiarySx, ...sx }}
      {...rest}
    >
      {children}
    </MuiButton>
  );
}

export default Button;
