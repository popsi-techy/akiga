# AGENTS.md

> **Thin wrapper. Do not add unique rules here.**
>
> `AGENTS.md` is the emerging cross-tool convention read by many AI coding agents
> (Cursor, Copilot's agent modes, Amp, Aider, and others). This file exists so those tools
> load the same governance every other tool does.

All governance for this repository lives in one canonical, vendor-neutral document:

## 👉 Read and obey [`AI_CONSTITUTION.md`](./AI_CONSTITUTION.md)

Non-negotiable summary (the constitution is authoritative):

- **Two products, one repo:** the 🎨 Design System (a living product) and the 🛡️ IGA Product
  (which consumes it). The dependency arrow points one way — the IGA product uses the Design
  System; the Design System never imports the product.
- **Reuse before you build.** Search `registries/*.json` and existing components/patterns/
  templates first. Anything genuinely new is created **in the Design System first**, then
  documented, recorded as an ADR (if significant), given a changeset, and only then used in the
  product.
- **Never hardcode** colors, spacing, radii, elevation, or motion. Consume tokens/theme.
- **Every screen ships** loading, empty, error, and success states, is accessible (WCAG 2.1
  AA), permission-aware, and talks to data through the repository/service layer — never
  `localStorage`/`fetch` directly.
- **Think before coding; ask when unclear; keep changes surgical.**

If this file ever conflicts with `AI_CONSTITUTION.md`, the constitution wins.
