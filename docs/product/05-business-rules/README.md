# 05 · Business Rules

The precise, testable rules that govern product behavior. **This is the source of truth for how
the product acts** — the thing an AI consults before implementing any logic-bearing flow.

> **Populated.** · **Feeds:** `business-rules.json`

Each rule has a stable ID (`BR-<AREA>-<NNN>`), enterprise-default logic, and a `ui` hint.

> **Populated.** To avoid duplication we keep **one** readable reference —
> [`rules-reference.md`](./rules-reference.md) — backed by the normative
> `registries/product/business-rules.json`. Areas covered: approval, risk, ownership,
> certification, access-duration, emergency-access, SoD, and lifecycle (JML). Split into
> per-area files later only if one area grows large enough to warrant it.

> A rule that isn't testable is a wish. Every rule must be specific enough that two engineers
> implement it identically. Update `business-rules.json` with every addition or change, and record
> a PDR when the behavior itself is a decision.
