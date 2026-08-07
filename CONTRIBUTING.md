# Contributing

This repository is built by humans and AI assistants together. Everyone follows the same
governance: **[`AI_CONSTITUTION.md`](./AI_CONSTITUTION.md)** is authoritative. This file adds
the practical process and the Definition of Done.

## The workflow (short form)

Every task follows §7 of the constitution:

```
Understand → review docs & ADRs → search registries/*.json → search components/patterns/templates
→ reuse or extend   ┌─ if genuinely new: create in the Design System first →
                    │  document → record ADR (if significant) → add changeset →
                    └─ then implement in the IGA product
```

Genuine exploration is allowed in a **throwaway spike** that must not merge into the product.

## Definition of Done ✅

A change is **not done** until all of the following are true. AI assistants must self-check
these before claiming completion, and must say plainly which ones were not verified.

**System integrity**
- [ ] No hardcoded colors, spacing, radii, elevation, z-index, or motion. Tokens/theme only.
- [ ] No one-off component that duplicates an existing one. Reuse/extend was attempted first.
- [ ] The Design System was not bypassed; the IGA product did not leak logic into the DS.
- [ ] Any new component/pattern/template has a `registries/*.json` entry and a doc page.

**UX completeness (for any screen/flow)**
- [ ] Loading (skeletons), empty, error, and success states are all designed and present.
- [ ] Destructive actions are confirmed; mutations give feedback (toast/inline).
- [ ] Actions are permission-aware for the current mock role.
- [ ] Realistic sample data and realistic simulated latency.

**Quality**
- [ ] Accessible: roles/labels, keyboard operable, visible focus, reduced-motion respected.
- [ ] **Color contrast verified mechanically** — run `npm run check:contrast` (in
      `apps/design-system`). All semantic token pairings meet WCAG AA. **Any new or changed color
      token must be added to the checker** (`scripts/check-contrast.ts`) with its intended
      foreground/background. A token that fails AA for its use is a defect, not a preference.
- [ ] Responsive; long text and overflow handled without layout breakage.
- [ ] Strict TypeScript; no `any` in public APIs. Types/lint/tests/build pass locally.
- [ ] Data access goes through the repository/service layer — not `localStorage`/`fetch`
      directly.

**Record-keeping**
- [ ] Docs updated in the same change.
- [ ] ADR added for any significant/cross-cutting decision.
- [ ] Changeset added if the Design System changed.

## Decisions

Non-trivial decisions → an ADR in `docs/architecture/decisions/` using the
[template](./docs/architecture/decisions/0000-adr-template.md). See
[ADR-0001](./docs/architecture/decisions/0001-record-architecture-decisions.md).

## Changelog & versioning

Design System changes are versioned with **Changesets** (`.changeset/`). Each PR that touches
the Design System includes a changeset describing the change and its semver impact.

## Reporting honestly

State what you verified and what you did not. If tests fail, show the output. Never report
"done and verified" for work you didn't actually run.
