# akiga — Enterprise IGA Product & Design System

A single repository containing **two first-class products**:

- 🎨 **Design System** — a *living product* (tokens, themes, components, patterns, templates,
  standards). The single source of truth for how everything looks and behaves.
- 🛡️ **IGA Product** — an enterprise **Identity Governance & Administration** prototype that
  *consumes* the Design System and never bypasses it.

The application always begins at a **Workspace** screen with two cards (Design System · IGA
Product) and a persistent **Back to Workspace** action.

> **Status:** Foundation phase. Governance, architecture, and documentation strategy are
> established. The application, components, tokens, and themes have **not** been built yet — by
> design. See `AI_CONSTITUTION.md` for how work proceeds.

---

## 🧭 Start here

| If you are… | Read this first |
|---|---|
| **An AI assistant** (any model/tool) | [`AI_CONSTITUTION.md`](./AI_CONSTITUTION.md) — mandatory |
| A human contributor | This README, then [`CONTRIBUTING.md`](./CONTRIBUTING.md) |
| Looking for *why* a decision was made | [`docs/architecture/decisions/`](./docs/architecture/decisions/) (ADRs) |
| Looking for *what already exists* | [`registries/`](./registries/) (machine-readable source of truth) |

---

## 🗺️ Repository map

```
akiga/
├─ AI_CONSTITUTION.md      ⭐ Canonical, vendor-neutral AI governance (the brain)
├─ AGENTS.md / CLAUDE.md / GEMINI.md / .cursor/ / .github/ / .windsurfrules
│                          Thin wrappers — every AI tool loads the same brain
├─ README.md · CONTRIBUTING.md
│
├─ registries/            ⭐ Machine-readable source of truth (AI queries these first)
│   ├─ components.json · patterns.json · templates.json · tokens.json
│
├─ docs/                  Prose docs (Diátaxis-structured)
│   ├─ architecture/decisions/   ADRs — the Decision Log
│   ├─ architecture/diagrams/
│   ├─ design-system/            foundations, patterns, a11y, content (later)
│   ├─ product/                  IGA domain model, personas, flows
│   ├─ governance/               workflow, Definition of Done
│   └─ guides/                   how-to & tutorials
│
├─ packages/
│   ├─ design-system/    🎨 the Design System library (later)
│   ├─ design-tokens/    single-source token pipeline (later)
│   ├─ core/             data-access contracts + mock adapters + utils (later)
│   ├─ eslint-config/    shared lint incl. DS guardrails (later)
│   └─ tsconfig/         shared TS config (later)
│
└─ apps/
    └─ prototype/        🛡️ Next.js app: (workspace) · (design-system) · (iga) (later)
```

*(Directories marked "later" are intentionally not implemented yet — this is the foundation
step.)*

---

## 🔒 The one rule that governs everything

**Reuse before you build. Anything genuinely new is born in the Design System first —
documented, recorded as an ADR (if significant), and given a changelog entry — before the IGA
product is allowed to use it.**

The dependency arrow points one way and is enforced by tooling, not trust:

```
IGA Product ──uses──▶ Design System ──derives from──▶ tokens (single source)
        (the Design System never imports the IGA product)
```

Full details, workflow, and coding standards: [`AI_CONSTITUTION.md`](./AI_CONSTITUTION.md).

---

## 🧱 Technology (planned)

React · Next.js · TypeScript (strict) · Tailwind CSS · MUI (free) · MUI Icons · React Flow
(when appropriate) · Typography **DM Sans**. No backend — mock business logic with local
persistence behind a data-access contract. Light theme first; dark theme derived.
