# ADR-0004: Design System as a standalone app; tokens-as-code (no pipeline yet)

- **Status:** Accepted
- **Date:** 2026-07-19
- **Deciders:** Repository maintainer + AI
- **Tags:** design-system, architecture, tooling

## Context

We are building the Design System now, before the IGA Product, and the owner asked to **start
building the actual product** — explicitly deferring monorepo tooling (Turborepo/pnpm workspaces),
a Style Dictionary token pipeline, and CI guardrails until they provide real value. The DS must be
a **polished application with its own navigation and documentation**, not a component gallery. Brand
assets were provided: a light-theme palette (Ink/Neutral/Blue/Orange/Green/Red/Yellow), DM Sans,
and screenshots of the existing miniOrange product.

## Decision

1. Build the Design System as a **standalone Next.js (App Router) application** at
   `apps/design-system` (port 3001) — runnable on its own, absorbable into a workspace later.
2. **Tokens live as code** (`src/design-system/tokens/*.ts`) as the single source of truth. A small
   in-repo generator emits **CSS variables** (`--ds-*`); **Tailwind** and the **MUI theme** consume
   those. No external token pipeline (Style Dictionary/DTCG build) yet — revisit when
   multi-package or multi-platform output is actually needed (supersedes the *timing*, not the
   intent, of ADR-0003).
3. **Extend MUI via a theme** derived from tokens; use **Tailwind (preflight off)** for docs/layout
   so it doesn't fight MUI's `CssBaseline`. DM Sans via `@fontsource-variable/dm-sans` (no
   build-time font fetch).
4. Brand mapping (light theme): primary = Orange `#EB5424`; text = Ink; link/info = Blue; status =
   Green/Yellow/Red; surfaces/borders = Neutral; product nav = `#1E2C38`. Risk levels reuse status
   roles (low→green, medium→yellow, high→orange, critical→red).

## Consequences

- Fast path to a running, on-brand DS the owner can see and use immediately.
- Single source of truth preserved (tokens → CSS vars → Tailwind + MUI) without pipeline overhead.
- Dark theme remains a later derivation from these finalized semantics.
- When the IGA Product is built, it will consume this same theme; if/when we extract the DS into a
  shared package or add a token pipeline/CI, this ADR is superseded rather than contradicted.
- Deferring monorepo tooling means no enforced import-boundary lint yet — the DS↔Product boundary
  is currently upheld by convention until the product exists to enforce it against.

## Alternatives considered

- **Full monorepo + Style Dictionary now:** rejected per owner direction — infrastructure before
  value; slows the first real deliverable.
- **DS as a Storybook-only gallery:** rejected — the owner wants a real documentation *product*
  with its own IA, which Storybook doesn't provide as a standalone app.
- **Tailwind with preflight on + no MUI baseline:** rejected — dueling resets; MUI components need
  their baseline for correct rendering.
