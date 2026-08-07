# GitHub Copilot Instructions

> **Thin wrapper. Do not add unique rules here.**

All governance for this repository lives in one canonical, vendor-neutral document at the repo
root: **`AI_CONSTITUTION.md`**. Read and obey it.

Key rules Copilot must respect when suggesting code:

- Two products in one repo: the **Design System** (a living product) and the **IGA Product**
  (which consumes it). The IGA product imports the Design System; the Design System never
  imports the product.
- **Reuse first.** Prefer existing components/patterns/templates (see `registries/*.json`).
  Anything new is created in the Design System first, documented, and recorded before the
  product uses it.
- **Never hardcode** colors, spacing, radii, elevation, or motion — consume tokens/theme.
  Prefer extending MUI over rebuilding it.
- Every screen ships loading/empty/error/success states, is accessible (WCAG 2.1 AA),
  permission-aware, and uses the repository/service data layer — not `localStorage`/`fetch`
  directly.

If this file conflicts with `AI_CONSTITUTION.md`, the constitution wins.
