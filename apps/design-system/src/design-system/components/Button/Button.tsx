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
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends Omit<MuiButtonProps, 'variant' | 'color' | 'size'> {
  /** Visual role. @default 'primary' */
  variant?: ButtonVariant;
  /** @default 'md' */
  size?: ButtonSize;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
  /**
   * Square the button around a lone icon — pass the icon as `children`, not as
   * `startIcon`, and always pass `aria-label`, since the button has no text to
   * name it. Usually worth a `Tooltip` too: an icon says *bin*, not *what it
   * removes*.
   *
   * For a **bordered** icon action sitting beside a labelled one, so the set
   * reads as one row of buttons. A borderless icon action in a table row is
   * `RowActions`, not this.
   */
  iconOnly?: boolean;
}

const sizeMap: Record<ButtonSize, MuiButtonProps['size']> = {
  // `xs` rides MUI's `small` and takes its height from the shared scale below.
  xs: 'small',
  sm: 'small',
  md: 'medium',
  lg: 'large',
};

/*
  There is no local "unavailable" style here on purpose.

  Every variant's gated look — the fill, the hairline, the label colour, the not-allowed
  cursor, the focus ring — lives in one place, `muiTheme`'s `MuiButton` overrides, which
  already branch on `.MuiButton-outlined` and `.MuiButton-text`. This file used to carry a
  near-copy that only `secondary` and `tertiary` applied on top, and the two drifted: an
  edit to the copy changed nothing for the contained primary, because the primary never
  read it.
*/
/**
 * `forwardRef` is load-bearing, not boilerplate.
 *
 * `Tooltip` anchors its popper to the child's DOM node, so a Button that swallows the ref
 * gets no tooltip at all — React logs "Function components cannot be given refs" and the
 * popper never renders. That had been true of every `<Tooltip><Button/></Tooltip>` in the
 * product, including the one explaining *why* a gated button is unavailable, which is the
 * entire reason `disabled` maps to `aria-disabled` here rather than the native attribute.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'sm',
    loading = false,
    disabled = false,
    iconOnly = false,
    startIcon,
    children,
    sx,
    onClick,
    className,
    ...rest
  },
  ref,
) {
  const muiVariant: MuiButtonProps['variant'] =
    variant === 'secondary' ? 'outlined' : variant === 'tertiary' ? 'text' : 'contained';
  const color: MuiButtonProps['color'] =
    variant === 'danger' ? 'error' : variant === 'success' ? 'success' : 'primary';
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
        }
      : {};

  const tertiarySx =
    variant === 'tertiary'
      ? {
          color: 'var(--ds-color-text-secondary)',
          '&:hover': { backgroundColor: 'var(--ds-color-surface-hover)' },
        }
      : {};

  // Shared control-height scale — every form control (Button/Input/Select) uses
  // the SAME height per size, so same-size controls always line up in a toolbar.
  const heightSx = { minHeight: CONTROL_HEIGHT[size], height: CONTROL_HEIGHT[size] };

  // Square: width follows the shared height scale, so an icon button and the
  // labelled button beside it are the same height and the icon sits centred.
  // MUI's 64px `minWidth` and text padding both have to go, or the "square"
  // comes out as a wide pill with a glyph adrift in it.
  const iconOnlySx = iconOnly
    ? { minWidth: CONTROL_HEIGHT[size], width: CONTROL_HEIGHT[size], paddingInline: 0 }
    : {};

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
      ref={ref}
      variant={muiVariant}
      color={color}
      size={sizeMap[size]}
      disabled={loading}
      aria-disabled={unavailable || undefined}
      className={[unavailable ? 'Mui-disabled' : '', className].filter(Boolean).join(' ') || undefined}
      onClick={handleClick}
      startIcon={loading ? <CircularProgress size={16} color="inherit" thickness={5} /> : startIcon}
      sx={{ ...heightSx, ...iconOnlySx, ...secondarySx, ...tertiarySx, ...sx }}
      {...rest}
    >
      {children}
    </MuiButton>
  );
});

export default Button;
