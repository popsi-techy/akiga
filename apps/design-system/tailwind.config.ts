import type { Config } from 'tailwindcss';

/**
 * Tailwind consumes the design tokens via the `--ds-*` CSS variables
 * (generated from tokens.ts and injected at the root). Tokens stay the single
 * source of truth; Tailwind is just a consumer. Preflight is OFF — MUI's
 * CssBaseline provides the reset so the two don't fight.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans Variable'", "'DM Sans'", 'system-ui', 'sans-serif'],
      },
      // The typography scale from tokens.ts, exposed as semantic classes (text-h5,
      // text-body, text-body-sm, text-caption, …). Each carries size + line-height
      // (+ tracking); weight stays a separate `font-*` utility so the two compose
      // without conflict. Prefer these over arbitrary `text-[Npx]`.
      // Every entry carries its own fontWeight, so a `text-*` class IS the complete
      // type style. That is the point: weight belongs to the token, never to a
      // `font-*` utility chosen at the call site. To emphasise, switch to the
      // `-strong` partner — do not bolt `font-semibold` onto a size class.
      fontSize: {
        display: ['2rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em', fontWeight: '700' }],
        h1: ['1.75rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em', fontWeight: '700' }],
        h2: ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.01em', fontWeight: '700' }],
        h3: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em', fontWeight: '600' }],
        h4: ['1.125rem', { lineHeight: '1.625rem', fontWeight: '600' }],
        h5: ['1rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        'card-title': ['0.9375rem', { lineHeight: '1.25rem', fontWeight: '400' }],
        'body-lg': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        body: ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
        'body-medium': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '500' }],
        'body-strong': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '600' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.125rem', fontWeight: '400' }],
        'body-sm-medium': ['0.8125rem', { lineHeight: '1.125rem', fontWeight: '500' }],
        'body-sm-strong': ['0.8125rem', { lineHeight: '1.125rem', fontWeight: '600' }],
        caption: ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
        'caption-medium': ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }],
        'caption-strong': ['0.75rem', { lineHeight: '1rem', fontWeight: '600' }],
        overline: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.06em', fontWeight: '600' }],
        micro: ['0.625rem', { lineHeight: '0.875rem', fontWeight: '600' }],
        stat: ['1.5rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em', fontWeight: '700' }],
      },
      // Inline emphasis for text whose size is inherited or set dynamically — a run
      // inside a paragraph, an Avatar's initials, a value inside a chip whose size
      // its parent sets. These are the ONLY weight utilities the system permits:
      // `font-medium` / `font-semibold` / `font-bold` let each call site invent a
      // step, which is how the scale drifted. Pair either with a `text-*` class and
      // you have re-created the banned pattern — use the -strong / -medium partner.
      //
      // `emphasis` is the firm step (600), `emphasis-soft` the soft one (500) — the
      // same two steps every sized token offers as `-strong` and `-medium`, so a run
      // with an inherited size is not forced to choose between 600 and nothing.
      fontWeight: { emphasis: '600', 'emphasis-soft': '500' },
      colors: {
        canvas: 'var(--ds-color-background-canvas)',
        subtle: 'var(--ds-color-background-subtle)',
        sunken: 'var(--ds-color-background-sunken)',
        sidebar: 'var(--ds-color-background-sidebar)',
        surface: {
          DEFAULT: 'var(--ds-color-surface-default)',
          hover: 'var(--ds-color-surface-hover)',
          selected: 'var(--ds-color-surface-selected)',
          disabled: 'var(--ds-color-surface-disabled)',
          inverse: 'var(--ds-color-surface-inverse)',
        },
        border: {
          subtle: 'var(--ds-color-border-subtle)',
          DEFAULT: 'var(--ds-color-border-default)',
          strong: 'var(--ds-color-border-strong)',
          control: 'var(--ds-color-border-control)',
          focus: 'var(--ds-color-border-focus)',
        },
        text: {
          primary: 'var(--ds-color-text-primary)',
          secondary: 'var(--ds-color-text-secondary)',
          tertiary: 'var(--ds-color-text-tertiary)',
          disabled: 'var(--ds-color-text-disabled)',
          inverse: 'var(--ds-color-text-inverse)',
          link: 'var(--ds-color-text-link)',
          brand: 'var(--ds-color-text-brand)',
        },
        icon: {
          DEFAULT: 'var(--ds-color-icon-default)',
          subtle: 'var(--ds-color-icon-subtle)',
          inverse: 'var(--ds-color-icon-inverse)',
          brand: 'var(--ds-color-icon-brand)',
        },
        brand: {
          DEFAULT: 'var(--ds-color-brand-primary)',
          hover: 'var(--ds-color-brand-primaryHover)',
          active: 'var(--ds-color-brand-primaryActive)',
          on: 'var(--ds-color-brand-onPrimary)',
          subtle: 'var(--ds-color-brand-subtle)',
          'subtle-hover': 'var(--ds-color-brand-subtleHover)',
          border: 'var(--ds-color-brand-border)',
        },
        info: 'var(--ds-color-status-info-fg)',
        success: 'var(--ds-color-status-success-fg)',
        warning: 'var(--ds-color-status-warning-fg)',
        danger: 'var(--ds-color-status-danger-fg)',
      },
      spacing: {
        0: 'var(--ds-space-0)',
        0.5: 'var(--ds-space-0_5)',
        1: 'var(--ds-space-1)',
        2: 'var(--ds-space-2)',
        3: 'var(--ds-space-3)',
        4: 'var(--ds-space-4)',
        5: 'var(--ds-space-5)',
        6: 'var(--ds-space-6)',
        8: 'var(--ds-space-8)',
        10: 'var(--ds-space-10)',
        12: 'var(--ds-space-12)',
        16: 'var(--ds-space-16)',
        20: 'var(--ds-space-20)',
        24: 'var(--ds-space-24)',
      },
      borderRadius: {
        none: 'var(--ds-radius-none)',
        xs: 'var(--ds-radius-xs)',
        sm: 'var(--ds-radius-sm)',
        md: 'var(--ds-radius-md)',
        lg: 'var(--ds-radius-lg)',
        xl: 'var(--ds-radius-xl)',
        '2xl': 'var(--ds-radius-2xl)',
        avatar: 'var(--ds-radius-avatar)',
        pill: 'var(--ds-radius-pill)',
      },
      boxShadow: {
        xs: 'var(--ds-elevation-xs)',
        sm: 'var(--ds-elevation-sm)',
        md: 'var(--ds-elevation-md)',
        lg: 'var(--ds-elevation-lg)',
        xl: 'var(--ds-elevation-xl)',
      },
    },
  },
  plugins: [],
};

export default config;
