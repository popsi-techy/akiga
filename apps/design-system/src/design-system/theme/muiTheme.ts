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
    action: {
      disabled: color.text.disabled,
      disabledBackground: color.surface.disabled,
      // MUI TableRow / ListItem still mix `primary.main` at `selectedOpacity`
      // (~0.08) unless we override the component. These values cover any
      // consumer that reads `action.selected` directly.
      selected: color.surface.selected,
      selectedOpacity: 1,
      hover: color.surface.hover,
    },
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
           * Unavailable (gated) buttons. Not native-disabled — see Button.tsx.
           *
           * ## A fill *and* an edge
           *
           * "A contained primary already has a filled shape" was the previous reasoning
           * for having no outline, and it was wrong twice over. `surface.disabled` was
           * `neutral[100]` #F8F8FA — 1.06:1 off white and 1.01:1 off `background.subtle`,
           * so the shape it was relying on did not exist on any surface in the system. In
           * a justification dock, which is `subtle`, the Submit button was simply not
           * there.
           *
           * The fill is now `neutral[1000]` #C4C9D2 (1.59:1 on `subtle`), and the button
           * also carries a hairline. Both, because a component cannot know what it has
           * been dropped on: a fill can only ever be tuned against one ground, an edge
           * reads on all of them. `inset` box-shadow rather than a border, since a
           * contained button has none and a real one would shift the label a pixel
           * between states.
           *
           * Contrast: `text.secondary` on the darker fill is 4.60:1. It has to clear AA —
           * these buttons are `aria-disabled` and stay focusable so the tooltip explaining
           * *why* is reachable, and a focusable control is not "inactive" for 1.4.3.
           * `text.tertiary` would be 3.24:1 and fail. Keyboard focus still gets the brand
           * ring (2.4.7).
           */
          '&.Mui-disabled, &[aria-disabled="true"]': {
            backgroundColor: 'var(--ds-color-surface-disabled)',
            color: 'var(--ds-color-text-secondary)',
            borderColor: 'transparent',
            boxShadow: 'inset 0 0 0 1px var(--ds-color-border-default)',
            outline: 'none',
            opacity: 1,
            pointerEvents: 'auto',
            cursor: 'not-allowed',
            '&:hover': {
              backgroundColor: 'var(--ds-color-surface-disabled)',
              borderColor: 'transparent',
              boxShadow: 'inset 0 0 0 1px var(--ds-color-border-default)',
            },
            '&.Mui-focusVisible': {
              outline: '2px solid var(--ds-color-border-focus)',
              outlineOffset: '2px',
            },
          },
          // Outlined carries a real border, so it drops the shared ring rather than
          // wearing both — two edges a pixel apart read as a double border.
          '&.MuiButton-outlined.Mui-disabled, &.MuiButton-outlined[aria-disabled="true"]': {
            borderColor: 'var(--ds-color-border-default)',
            boxShadow: 'none',
            '&:hover': { borderColor: 'var(--ds-color-border-default)', boxShadow: 'none' },
          },
          '&.MuiButton-text.Mui-disabled, &.MuiButton-text[aria-disabled="true"]': {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            '&:hover': { backgroundColor: 'transparent', boxShadow: 'none' },
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
    // Selected rows / list items use `surface.selected` (orange[50] #FFF4EE),
    // not MUI's default 8% wash of brand orange.
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'var(--ds-color-surface-selected)',
          },
          '&.Mui-selected:hover': {
            backgroundColor: 'var(--ds-color-surface-selectedHover)',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'var(--ds-color-surface-selected)',
          },
          '&.Mui-selected:hover': {
            backgroundColor: 'var(--ds-color-surface-selectedHover)',
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'var(--ds-color-surface-selected)',
          },
          '&.Mui-selected:hover': {
            backgroundColor: 'var(--ds-color-surface-selectedHover)',
          },
        },
      },
    },
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
