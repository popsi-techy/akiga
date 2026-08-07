/**
 * Semantic design tokens — the vocabulary components consume.
 * Everything here maps PRIMITIVES (palette.ts) + scales to product ROLES.
 * Components MUST use these, never raw palette values or literals.
 */
import { palette as p } from './palette';

/* ------------------------------------------------------------------ *
 * COLOR — semantic roles (light theme). Dark theme derives from these.
 * ------------------------------------------------------------------ */
export const color = {
  // Backgrounds (page-level)
  background: {
    canvas: p.white, //          page background
    subtle: p.neutral[50], //    alternate / striped surfaces
    sunken: p.neutral[100], //   wells, code blocks
    sidebar: p.sidebar, //       product dark navigation
  },
  // Surfaces (component-level)
  surface: {
    default: p.white, //         cards, sheets, menus
    hover: p.neutral[50],
    selected: p.orange[50], //   selected row / active tint
    disabled: p.neutral[100],
    inverse: p.ink[800],
  },
  // Borders & dividers
  border: {
    subtle: p.neutral[400], //   #E6E8EC hairlines
    default: p.neutral[500], //  #E1E4E8 default control border
    // Boundary of an interactive control that carries no fill of its own — an
    // unchecked checkbox or radio. WCAG 1.4.11 wants >= 3:1 against the surface
    // behind it, which the hairline borders above cannot reach (default 1.28:1,
    // strong 1.66:1), so those must never outline a control.
    control: p.ink[300], //       #54637B unchecked checkbox / radio
    strong: p.neutral[1000], //  #C4C9D2 emphasized border
    focus: p.orange[700], //     focus ring (brand)
  },
  // Text
  text: {
    primary: p.ink[800], //      #172B4D headings & body
    secondary: p.ink[500], //    #44546F secondary text
    tertiary: p.ink[300], //     #54637B muted
    disabled: p.ink[50], //      #808B9E disabled / placeholder
    inverse: p.white, //         on dark surfaces
    link: p.blue[800], //        #1976D2 (4.6:1 on white)
    // Small brand-colored TEXT uses the darker orange for AA (#EB5424 is only 3.6:1).
    // The vibrant #EB5424 (brand.primary) is reserved for fills, indicators, focus, and large text.
    brand: p.orange[800], //     #C9441E (4.85:1 on white)
  },
  // Icons
  icon: {
    default: p.ink[500], //      #44546F
    subtle: p.ink[50],
    inverse: p.white,
    brand: p.orange[700],
  },
  // Brand / primary
  brand: {
    primary: p.orange[700], //         #EB5424
    primaryHover: p.orange[800], //    #C9441E
    primaryActive: p.orange[900], //   #9E3416
    onPrimary: p.white,
    subtle: p.orange[50], //           tint background (avatars, icon squares)
    subtleHover: p.orange[100],
    border: p.orange[200],
  },
  // Status — each role: fg (text/icon), solid (dot/emphasis), subtle (bg), border, onSolid
  // fg meets WCAG AA (>=4.5:1) as small text on its own `subtle` bg;
  // onSolid meets AA on `solid`. Enforced by `npm run check:contrast`.
  // `fg` is for text and `solid` for filled chips (which carry `onSolid` text).
  // `fill` is the graphical role — progress bars, chart segments, legend dots —
  // where the colour is the information, not a background for words. It exists
  // because `fg` was being used for fills: those values are chosen to be dark
  // enough for AA *text*, so as a bar they read heavy and muddy. Every `fill`
  // clears 3:1 on surface (WCAG 1.4.11) with margin, and also 4.5:1 under white
  // text, so a consumer that labels a bar cannot accidentally fall below AA.
  //
  // `border` outlines a tinted `subtle` surface (chip, callout, lane label). It has
  // to be visible against that fill or the shape has no edge — the first pass took
  // each family's [200] step blindly, which for blue and yellow is a near-white that
  // vanished on its own tint (1.07:1 and 1.08:1) while red read fine at 1.60:1. These
  // are chosen so every intent lands in one band, 1.57–1.80:1 against its own
  // `subtle`, and stays well clear of `fg` so the outline never competes with the
  // words inside it. Enforced by `npm run check:contrast`. The band is luminance
  // only, which understates high-chroma hues — `warning` sits deliberately below it
  // and is waived, see the note there.
  status: {
    info: { fg: p.blue[900], solid: p.blue[800], fill: p.blue[800], subtle: p.blue[50], border: p.blue[500], onSolid: p.white },
    success: { fg: p.green[600], solid: p.green[600], fill: p.green[550], subtle: p.green[100], border: p.green[400], onSolid: p.white },
    // `border` is yellow[300] at the owner's direction — two steps softer than the
    // band and below VISIBLE_MIN (1.18:1 on its own tint), so it is carried as a
    // documented waiver in check-contrast.ts rather than by lowering the floor.
    // Yellow is the highest-chroma family here, so it survives a lower ratio than a
    // pale blue would; even so this is the faintest outline in the set. If a Medium
    // chip ever needs to read as clearly bounded, [400] (1.33:1) is the step back.
    warning: { fg: p.yellow[800], solid: p.yellow[500], fill: p.yellow[750], subtle: p.yellow[50], border: p.yellow[300], onSolid: p.ink[900] },
    // Between warning and danger — the orange step. Exists so a four-level scale
    // (e.g. Risk Score) has a distinct hue per level instead of reusing one twice.
    // `subtle` is orange[50], matching every other intent's [50]-weight tint. It was
    // [100] to avoid colliding with `brand-subtle`, but [100] sits 1.20:1 off white
    // where the others sit 1.03–1.08, so a High chip read three times heavier than
    // its neighbours in the same ramp. The collision is not a real problem here: what
    // separates caution from brand is the orange border and orange text, not the
    // tint. Only an unbordered fill should worry about it. Same story for
    // `surface.selected` (also orange[50]): a High chip inside a selected row shares
    // the row's fill, and the border is what still reads it as a chip — verified.
    caution: { fg: p.orange[900], solid: p.orange[800], fill: p.orange[800], subtle: p.orange[50], border: p.orange[300], onSolid: p.white },
    danger: { fg: p.red[600], solid: p.red[600], fill: p.red[550], subtle: p.red[50], border: p.red[200], onSolid: p.white },
    neutral: { fg: p.ink[500], solid: p.neutral[1000], fill: p.ink[50], subtle: p.neutral[100], border: p.neutral[1000], onSolid: p.ink[800] },
  },
  // Risk-score tiers map onto the `status` roles above (Critical→danger, High→warning,
  // Medium→info, Low→neutral) via RiskScoreChip — no separate risk palette.
} as const;

/* ------------------------------------------------------------------ *
 * TYPOGRAPHY — DM Sans. rem-based; base = 14px (0.875rem).
 * ------------------------------------------------------------------ */
export const fontFamily = {
  sans: "'DM Sans Variable', 'DM Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  mono: "'DM Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

/** Each style: [fontSize, { lineHeight, fontWeight, letterSpacing }] */
export const typography = {
  display: { fontSize: '2rem', lineHeight: '2.5rem', fontWeight: fontWeight.bold, letterSpacing: '-0.02em' }, // 32/40
  h1: { fontSize: '1.75rem', lineHeight: '2.25rem', fontWeight: fontWeight.bold, letterSpacing: '-0.02em' }, // 28/36
  h2: { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: fontWeight.bold, letterSpacing: '-0.01em' }, // 24/32
  h3: { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: fontWeight.semibold, letterSpacing: '-0.01em' }, // 20/28
  h4: { fontSize: '1.125rem', lineHeight: '1.625rem', fontWeight: fontWeight.semibold, letterSpacing: '0' }, // 18/26
  h5: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: fontWeight.semibold, letterSpacing: '0' }, // 16/24
  bodyLg: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: fontWeight.regular, letterSpacing: '0' }, // 16/24
  body: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: fontWeight.regular, letterSpacing: '0' }, // 14/20 (base)
  bodyMedium: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: fontWeight.medium, letterSpacing: '0' },
  bodySm: { fontSize: '0.8125rem', lineHeight: '1.125rem', fontWeight: fontWeight.regular, letterSpacing: '0' }, // 13/18
  caption: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: fontWeight.regular, letterSpacing: '0' }, // 12/16
  overline: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: fontWeight.semibold, letterSpacing: '0.06em', textTransform: 'uppercase' as const }, // 12/16
  micro: { fontSize: '0.625rem', lineHeight: '0.875rem', fontWeight: fontWeight.regular, letterSpacing: '0' }, // 10/14 — badge initials, tiny eyebrows
  stat: { fontSize: '1.5rem', lineHeight: '1.75rem', fontWeight: fontWeight.bold, letterSpacing: '-0.01em' }, // 24/28 — KPI / metric numerals
} as const;

export type TypographyToken = keyof typeof typography;

/* ------------------------------------------------------------------ *
 * SPACING — 4px base scale.
 * ------------------------------------------------------------------ */
export const spacing = {
  0: '0px',
  0.5: '2px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

/* ------------------------------------------------------------------ *
 * RADIUS
 * ------------------------------------------------------------------ */
export const radius = {
  none: '0px',
  xs: '4px',
  sm: '6px',
  md: '8px', //   inputs, buttons
  lg: '12px', //  cards
  xl: '16px', //  large cards / modals
  '2xl': '20px',
  avatar: '10px', // softly rounded-square avatars (matches product design)
  pill: '9999px',
} as const;

/* ------------------------------------------------------------------ *
 * ELEVATION — subtle, enterprise. Shadow color = ink-based, low alpha.
 * ------------------------------------------------------------------ */
export const elevation = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(23, 43, 77, 0.04)',
  sm: '0 1px 3px 0 rgba(23, 43, 77, 0.06), 0 1px 2px 0 rgba(23, 43, 77, 0.04)',
  md: '0 4px 8px -2px rgba(23, 43, 77, 0.08), 0 2px 4px -2px rgba(23, 43, 77, 0.04)',
  lg: '0 12px 16px -4px rgba(23, 43, 77, 0.08), 0 4px 6px -2px rgba(23, 43, 77, 0.04)',
  xl: '0 20px 24px -4px rgba(23, 43, 77, 0.10), 0 8px 8px -4px rgba(23, 43, 77, 0.04)',
} as const;

/* ------------------------------------------------------------------ *
 * MOTION
 * ------------------------------------------------------------------ */
export const motion = {
  duration: {
    instant: '80ms',
    fast: '120ms',
    base: '200ms',
    slow: '300ms',
    slower: '400ms',
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    decelerate: 'cubic-bezier(0, 0, 0, 1)',
    accelerate: 'cubic-bezier(0.3, 0, 1, 1)',
    emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
  },
} as const;

/* ------------------------------------------------------------------ *
 * Z-INDEX — one scale to avoid stacking wars.
 * ------------------------------------------------------------------ */
export const zIndex = {
  base: 0,
  raised: 10,
  sticky: 1100,
  dropdown: 1200,
  drawer: 1300,
  modal: 1400,
  toast: 1500,
  tooltip: 1600,
} as const;

/* ------------------------------------------------------------------ *
 * BREAKPOINTS & LAYOUT
 * ------------------------------------------------------------------ */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const layout = {
  sidebarWidth: '260px',
  sidebarCollapsedWidth: '72px',
  topbarHeight: '64px',
  contentMaxWidth: '1440px',
} as const;

/* ------------------------------------------------------------------ *
 * CONTROL HEIGHT — the single scale ALL form controls share (Button,
 * Input, Select). Same size ⇒ identical height, so controls always align.
 * ------------------------------------------------------------------ */
export const controlHeight = {
  sm: '36px',
  md: '40px',
  lg: '48px',
} as const;
