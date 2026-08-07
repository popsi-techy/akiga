/**
 * Primitive color palettes — the raw, brand-derived values.
 * Source: miniOrange light-theme palette provided by the product owner.
 * These are PRIMITIVES. Never consume them directly in components — use the
 * semantic tokens in `tokens.ts`, which map these to roles (text, surface, brand, status…).
 */

export const palette = {
  white: '#FFFFFF',
  black: '#000000',

  /** Product navigation bar background (dark slate). */
  sidebar: '#1E2C38',

  /** Blue — informational & links. */
  blue: {
    50: '#F5FAFE',
    100: '#E1E5ED',
    200: '#E8F3FD',
    300: '#E3F2FD',
    400: '#CFE5FC',
    500: '#90CAF9',
    600: '#64B5F6',
    700: '#42A5F5',
    800: '#1976D2', // link color
    900: '#0D47A1',
  },

  /** Orange — the brand / primary. */
  orange: {
    50: '#FFF4EE',
    100: '#FFE5D8',
    200: '#FFCCB5',
    300: '#FFB38F',
    400: '#FF8E5C',
    500: '#F86A36',
    600: '#F05B27',
    700: '#EB5424', // primary
    800: '#C9441E',
    900: '#9E3416',
  },

  /** Green — success. */
  green: {
    50: '#E7FAF9',
    100: '#F0FFF4',
    200: '#BEDECE',
    300: '#9AE6B4',
    400: '#68D391',
    500: '#38A169',
    550: '#12855A', // graphical fill — bright enough to read, dark enough for white text
    600: '#00695C',
    700: '#094A25',
    800: '#002C26',
    900: '#001E18',
  },

  /** Red — error / critical. */
  red: {
    50: '#FEF5F5',
    100: '#FEECEC',
    200: '#FEB2B2',
    300: '#FC8181',
    400: '#F56B6B',
    500: '#E53E3E',
    550: '#DC2F2F', // graphical fill
    600: '#C53030',
    700: '#9B2C2C',
    800: '#742A2A',
    900: '#63171B',
  },

  /** Yellow — warning. */
  yellow: {
    50: '#FFFBEC',
    100: '#FFF9E0',
    200: '#FFF2BD',
    300: '#FFE794',
    400: '#FFD94D',
    500: '#FACC15',
    600: '#EAB308',
    700: '#B2910B',
    750: '#B45309', // graphical fill — amber, since yellow cannot reach 3:1 on white
    800: '#856404',
    900: '#704F00',
  },

  /** Neutral — light surfaces, borders, dividers. */
  neutral: {
    50: '#F9FAFB',
    100: '#F8F8FA',
    200: '#F4F5F6',
    300: '#F3F4F5',
    400: '#E6E8EC',
    500: '#E1E4E8',
    600: '#DDE0E5',
    700: '#D7DBE0',
    800: '#D1D5DD',
    900: '#DCDFE4',
    1000: '#C4C9D2',
  },

  /** Ink — text & dark slate tones. */
  ink: {
    50: '#808B9E',
    100: '#5D6B83',
    200: '#55647C',
    300: '#54637B',
    400: '#455571',
    500: '#44546F', // icon color
    600: '#3C4D6A',
    700: '#2C3E5D',
    800: '#172B4D',
    900: '#292A2E',
  },
} as const;

export type Palette = typeof palette;
export type ColorFamily = keyof Omit<Palette, 'white' | 'black' | 'sidebar'>;
