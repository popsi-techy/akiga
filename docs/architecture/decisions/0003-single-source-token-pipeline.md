# ADR-0003: Single-source design-token pipeline (light first, dark derived)

- **Status:** Accepted (pipeline strategy) — token *values* to be created in a later step
- **Date:** 2026-07-19
- **Deciders:** Repository maintainer
- **Tags:** design-system, tokens, themes

## Context

The product needs a Light theme first and a Dark theme derived later, and the same visual values
must feed three consumers: **CSS variables**, **Tailwind CSS**, and the **MUI theme**.
Hand-maintaining these in separate places guarantees drift — the exact fragmentation this
repository exists to prevent. Per the constitution, "one source, many outputs."

**Note:** This ADR fixes the *strategy* only. No token values, colors, or themes are created
here — that is an explicit later step.

## Decision

We will define design tokens **once**, in the **DTCG (Design Tokens Community Group) JSON
format**, at `registries/tokens.json`, and generate all downstream artifacts from it via a build
step (e.g. Style Dictionary) in `packages/design-tokens`:

- CSS custom properties (the runtime theme layer),
- a Tailwind theme extension,
- an MUI theme object.

The **Light theme is authored first.** The **Dark theme is derived** from the finalized token
semantics (semantic/alias tokens map to different primitive values per theme), not
hand-rewritten. Components and screens consume **semantic tokens**, never primitive values and
never literals.

## Consequences

- A single change to a token propagates to CSS, Tailwind, and MUI automatically — no drift.
- Dark theme becomes a mapping exercise over finalized semantics, not a parallel rewrite.
- Requires a token build step in the pipeline; consumers import generated outputs, not raw JSON.
- Enables the lint rule that bans hardcoded visual values, because every legitimate value has a
  token to reference.

## Alternatives considered

- **Author themes directly in the MUI theme object:** rejected — MUI-only; Tailwind and raw CSS
  would need duplicate definitions.
- **Tailwind config as the source of truth:** rejected — not a neutral interchange format; MUI
  and design tooling can't consume it cleanly.
- **Two independently authored light/dark themes:** rejected — guarantees drift and doubles
  maintenance; contradicts "one source, many outputs."
