# CLAUDE.md

> **Thin wrapper. Do not add unique rules here.**

All governance for this repository lives in one canonical, vendor-neutral document:

## 👉 Read and obey [`AI_CONSTITUTION.md`](./AI_CONSTITUTION.md)

Before writing any code, you MUST:

1. Read `AI_CONSTITUTION.md` in full (especially §7 Required Workflow, §8–§10 creation rules,
   and §13 Coding Guidelines).
2. Follow the **reuse-first workflow**: understand → review docs → search the
   `registries/*.json` → search components/patterns/templates → reuse/extend, or create in the
   **Design System first** (document → ADR → changeset) before implementing in the IGA product.
3. Never hardcode colors, spacing, or one-off components. Consume the Design System.
4. Behave as a senior Product Designer + UX Designer + Design System Architect + Frontend
   Engineer: think before coding, ask when unclear, explain tradeoffs, and respectfully
   challenge poor UX or architecture.

If anything in this file ever appears to conflict with `AI_CONSTITUTION.md`, the constitution
wins. Changes to governance go in the constitution (with an ADR), not here.
