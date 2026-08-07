# akiga · Design System (application)

A polished, running application that **is** the Design System — its own navigation and
documentation, not just a component gallery. Built from the miniOrange brand palette, DM Sans, and
the existing product's UI language.

## Run it

```bash
cd apps/design-system
npm install      # first time only
npm run dev      # http://localhost:3001
```

Other scripts: `npm run build`, `npm run start`, `npm run typecheck`.

## Stack
Next.js (App Router) · TypeScript (strict) · MUI (extended via theme) · Tailwind (token-driven,
preflight off) · DM Sans (`@fontsource-variable/dm-sans`).

## How it's organized
```
src/
├─ design-system/
│  ├─ tokens/        # SINGLE SOURCE OF TRUTH
│  │  ├─ palette.ts  #   raw brand palettes (primitives)
│  │  └─ tokens.ts   #   semantic tokens + type/space/radius/elevation/motion/z/breakpoints
│  └─ theme/
│     ├─ cssVars.ts       # tokens → CSS variables (--ds-*)
│     ├─ muiTheme.ts      # tokens → MUI theme (how the product inherits the brand)
│     └─ ThemeRegistry.tsx# MUI + Emotion SSR setup
├─ app/               # the docs application (Foundations pages, etc.)
├─ components/        # the docs site's own chrome (shell) + doc primitives
└─ lib/navigation.ts  # DS app IA
```

## Token flow (single source → many consumers)
`tokens.ts` → **CSS variables** (`cssVars.ts`, injected at root) → **Tailwind** (via `var(--ds-*)`)
and **MUI theme** (`muiTheme.ts`). Change a token once; it propagates everywhere. No hardcoded
values in components.

## Status
- ✅ **Foundations**: colors, typography, spacing, radius, elevation, iconography, grid, motion,
  accessibility — all live and documented.
- ⏭️ **Next**: core components (Button, Input, Table, StatusChip, RiskBadge, Avatar, Tabs, Drawer,
  Dialog, Toast…), then enterprise + IGA patterns.

## Rule
When a product screen needs something new, add/update it **here first**, document it, then use it
in the product. The Design System and the IGA Product evolve together.
