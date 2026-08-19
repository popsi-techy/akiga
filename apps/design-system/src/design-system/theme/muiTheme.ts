/**
 * MUI theme derived from the design tokens.
 * This is how the IGA Product (and DS component demos) inherit the brand:
 * we EXTEND MUI via this theme rather than restyling components ad hoc.
 */
'use client';

import { createTheme } from '@mui/material/styles';
import { palette as p } from '../tokens/palette';
import {
  color,
  radius,
  elevation,
  fontFamily,
  fontWeight,
  typography as t,
} from '../tokens/tokens';

export const muiTheme = createTheme({
  palette: {
    mode: 'light',
    // Semantic palette derives from the AA-verified status tokens (main = solid,
    // contrastText = onSolid), so filled MUI components (e.g. danger buttons,
    // error text) inherit contrast the gate already enforces. Primary is the
    // documented brand exception (#EB5424, see ADR-0005).
    primary: { main: p.orange[700], dark: p.orange[800], light: p.orange[500], contrastText: '#FFFFFF' },
    secondary: { main: p.ink[800], contrastText: '#FFFFFF' },
    info: { main: color.status.info.solid, light: color.status.info.subtle, dark: p.blue[900], contrastText: color.status.info.onSolid },
    success: { main: color.status.success.solid, light: color.status.success.subtle, dark: p.green[700], contrastText: color.status.success.onSolid },
    warning: { main: color.status.warning.solid, light: color.status.warning.subtle, dark: p.yellow[700], contrastText: color.status.warning.onSolid },
    error: { main: color.status.danger.solid, light: color.status.danger.subtle, dark: p.red[700], contrastText: color.status.danger.onSolid },
    text: { primary: color.text.primary, secondary: color.text.secondary, disabled: color.text.disabled },
    background: { default: color.background.canvas, paper: color.surface.default },
    divider: color.border.default,
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: fontFamily.sans,
    fontWeightRegular: fontWeight.regular,
    fontWeightMedium: fontWeight.medium,
    fontWeightBold: fontWeight.bold,
    htmlFontSize: 16,
    fontSize: 14,
    h1: t.h1,
    h2: t.h2,
    h3: t.h3,
    h4: t.h4,
    h5: t.h5,
    h6: t.h5,
    subtitle1: t.bodyStrong,
    subtitle2: { ...t.bodySm, fontWeight: fontWeight.medium },
    body1: t.body,
    body2: t.bodySm,
    // Button labels take the emphasis step (600). At 500 a label sat at the same
    // visual weight as the body text around it — the defect this scale fixes.
    button: { ...t.bodyStrong, textTransform: 'none' as const },
    caption: t.caption,
    overline: t.overline,
  },
  shadows: [
    'none',
    elevation.xs,
    elevation.sm,
    elevation.sm,
    elevation.md,
    elevation.md,
    elevation.md,
    elevation.lg,
    elevation.lg,
    elevation.lg,
    elevation.lg,
    elevation.xl,
    elevation.xl,
    elevation.xl,
    elevation.xl,
    elevation.xl,
    elevation.xl,
    elevation.xl,
    elevation.xl,
    elevation.xl,
    elevation.xl,
    elevation.xl,
    elevation.xl,
    elevation.xl,
    elevation.xl,
  ] as unknown as import('@mui/material/styles').Theme['shadows'],
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          fontWeight: fontWeight.medium,
          paddingInline: '16px',
          /**
           * Disabled: grey, flat, and still legible.
           *
           * It used to be `opacity: 0.45` with the comment "dim rather than recolor"
           * — but MUI recolors a disabled contained button anyway, to
           * rgba(0,0,0,0.26) on rgba(0,0,0,0.12), so the result was a recolor AND a
           * dim, and the label came out at barely over 1:1. A disabled control still
           * has to say what it is: a button reading "2 steps to activate" is useless
           * if the reader cannot make out the words.
           *
           * These are the product's own tokens rather than MUI's blacks, and there is
           * no opacity on top. It still cannot be mistaken for active — flat grey
           * beside a filled orange is unambiguous — it can simply be read.
           */
          '&.Mui-disabled': {
            backgroundColor: 'var(--ds-color-background-subtle)',
            color: 'var(--ds-color-text-tertiary)',
            borderColor: 'var(--ds-color-border-default)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: { rounded: { borderRadius: radius.lg } },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: radius.pill, fontWeight: fontWeight.medium } },
    },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: radius.md } },
    },
    // Contained-thumb baseline for any MUI Switch still used outside the DS
    // wrapper. Prefer `@ds/components` Switch — it owns size + full token styling.
    MuiSwitch: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: { padding: 0, overflow: 'visible' },
        switchBase: {
          '&.Mui-checked + .MuiSwitch-track': { opacity: 1 },
          '&.Mui-disabled + .MuiSwitch-track': { opacity: 0.4 },
        },
        track: { opacity: 1, borderRadius: 9999 },
      },
    },
  },
});

export default muiTheme;
