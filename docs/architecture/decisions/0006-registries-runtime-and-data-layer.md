# ADR-0006: Registries are the runtime source of truth; data via a seed/service layer

- **Status:** Accepted
- **Date:** 2026-07-19
- **Deciders:** Repository maintainer + AI
- **Tags:** architecture, data, registries, product

## Context

The Product Knowledge Base registries (`registries/product/*.json`) were designed as the
"source of truth", but the app initially **hand-mirrored** some of them — the product navigation
was duplicated in `lib/iga-navigation.ts`, and the dashboard used inline mock data. Two copies of
the same truth drift apart. The constitution also calls for a **repository/service data-access
contract** so a real API can replace mock data without touching screens.

## Decision

1. **Registries are imported by the app at runtime.** The app reaches them via the `@registries/*`
   TypeScript path alias (`registries/product/*`) with Next.js `experimental.externalDir` enabled.
   The product navigation is now **derived** from `navigation.json` — the registry owns structure,
   labels, order, and grouping; the app only supplies presentation (icon components) and runtime
   badge counts. No hand-duplicated nav data.
2. **A seed/service data layer** lives at `src/data/`:
   - `seed.ts` — the single, deterministic mock dataset (one coherent fictional org; no
     `Date.now()`/`Math.random()` at module scope), per the PKB sample-data strategy.
   - Service modules (e.g. `dashboard.ts`) expose read functions (`getDashboardData()`,
     `getMyWorkCounts()`) that screens consume. **Screens never read raw seed data or fetch
     directly** — they call services, which are the seam a real repository/API sits behind.

## Consequences

- No duplication/drift: the registries and app agree because the app reads the registries.
- Swapping mock data for a real API is a change inside `src/data/*`, invisible to screens.
- Presentation concerns (icon components, token colors) stay in the app; data/structure stays in
  registries + seed. Clean separation.
- Pure-knowledge docs (compliance, UX principles, competitors) remain reference-only, as intended
  — only instance/structure registries are wired at runtime.

## Alternatives considered

- **Keep hand-mirroring:** rejected — guaranteed drift between "source of truth" and code.
- **Generate code from registries at build time:** rejected as overkill now; a direct import +
  thin adapter is simpler and sufficient.
- **Screens import seed directly:** rejected — violates the data-access contract; a service layer
  keeps the future API swap non-breaking.
