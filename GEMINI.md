# GEMINI.md

> **Thin wrapper. Do not add unique rules here.**

All governance for this repository lives in one canonical, vendor-neutral document:

## 👉 Read and obey [`AI_CONSTITUTION.md`](./AI_CONSTITUTION.md)

Before generating anything, read the constitution and follow its §7 reuse-first workflow:
understand → review docs → search `registries/*.json` → search existing components/patterns/
templates → reuse or extend; if something is genuinely new, create it in the **Design System
first** (document → ADR → changeset), then use it in the IGA product.

Never hardcode colors/spacing/components. Consume the Design System. Ship every state
(loading/empty/error/success), stay accessible, and keep changes surgical. If this file
conflicts with `AI_CONSTITUTION.md`, the constitution wins.
