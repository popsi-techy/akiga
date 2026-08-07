# The Design-System-First Workflow

This is the operational expansion of §7 of [`AI_CONSTITUTION.md`](../../AI_CONSTITUTION.md).
It exists so every contributor — human or AI — solves problems the same way.

## The principle

> If it's new and real, it is **born in the Design System** — documented and recorded — before
> the IGA product is allowed to use it.

Reuse is cheaper than reinvention. Consistency beats novelty. The Design System only stays a
single source of truth if new needs flow *into* it instead of *around* it.

## The decision path

```
                         ┌──────────────────────────────┐
                         │  Understand the request       │
                         └───────────────┬──────────────┘
                                         ▼
                         ┌──────────────────────────────┐
                         │  Review docs, ADRs, this file │
                         └───────────────┬──────────────┘
                                         ▼
                         ┌──────────────────────────────┐
                         │  Search registries/*.json     │
                         │  + existing components,        │
                         │    patterns, templates         │
                         └───────────────┬──────────────┘
                                         ▼
                          Can I reuse or extend what exists?
                         ┌───────────────┴───────────────┐
                    YES  │                                │  NO
                         ▼                                ▼
              ┌────────────────────┐        Is this genuine exploration?
              │ Reuse / extend it. │        ┌───────────┴───────────┐
              │ Build in the IGA   │    YES │                       │ NO
              │ product.           │        ▼                       ▼
              └────────────────────┘   ┌──────────┐      ┌──────────────────────┐
                                       │ SPIKE     │      │ Create it in the      │
                                       │ (throwaway│      │ DESIGN SYSTEM FIRST   │
                                       │ cannot    │      └──────────┬───────────┘
                                       │ merge)    │                 ▼
                                       └────┬──────┘      ┌──────────────────────┐
                                            │ promote     │ Document (doc +        │
                                            │ outcome     │ registry entry)        │
                                            └────────────▶└──────────┬───────────┘
                                                                     ▼
                                                          ┌──────────────────────┐
                                                          │ Record ADR (if        │
                                                          │ significant)           │
                                                          └──────────┬───────────┘
                                                                     ▼
                                                          ┌──────────────────────┐
                                                          │ Add a changeset        │
                                                          └──────────┬───────────┘
                                                                     ▼
                                                          ┌──────────────────────┐
                                                          │ Implement in the IGA   │
                                                          │ product                │
                                                          └──────────────────────┘
```

## What counts as "reuse or extend"

- A token exists for the value you need → use it.
- An MUI component covers the need (possibly with theming/composition) → extend it.
- A pattern already solves this interaction → apply it, don't reinvent a divergent one.

## What counts as "genuinely new" (goes to the DS first)

- A visual value with no token.
- A component MUI cannot be extended to cover (state *why* in its doc).
- A recurring interaction with no existing pattern.
- A page shape with no existing template.

## The Spike lane (exploration without fragmentation)

Real design work sometimes needs to try things before committing. That is allowed **only** in a
clearly-labeled, time-boxed spike that **cannot be merged into the IGA product**. To ship, its
outcome is promoted through the full path above. This preserves exploration without letting
un-systematized UI leak into the product.

## Guardrails that make this real (not just documented)

- **Module boundaries + ESLint** enforce `IGA → Design System` (never the reverse).
- **Lint** bans hardcoded colors/spacing/etc. in product code — a value with no token cannot be
  used, so the correct move (add a token) is the *only* move.
- **A registry ↔ code check** in CI keeps registry entries honest.
- **Automated a11y checks** gate "done."

When a rule can be enforced by tooling, the tooling — not goodwill — is what holds the line.
