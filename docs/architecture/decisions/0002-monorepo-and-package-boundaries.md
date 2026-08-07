# ADR-0002: Monorepo with enforced package boundaries

- **Status:** Accepted
- **Date:** 2026-07-19
- **Deciders:** Repository maintainer
- **Tags:** architecture, design-system, tooling

## Context

Two products live in this repository: the Design System (a living product) and the IGA Product
(which consumes it). The core governance rule is that the IGA product must **consume** the
Design System and **never bypass or contaminate** it. Stating this rule in prose is not enough —
under pressure, a hardcoded color or a one-off component *will* appear unless the boundary is
mechanically enforced.

We also need the app to always start at a **Workspace** screen with two cards and a persistent
"Back to Workspace" action, sharing one theme provider and one deploy.

## Decision

We will structure the repository as a **monorepo** (pnpm workspaces + Turborepo) with:

- `packages/design-system` — the Design System as a **real, importable library** (tokens,
  themes, components, patterns, templates). This package MUST NOT depend on any `apps/*`.
- `packages/design-tokens`, `packages/core` (data-access contracts + mock adapters + utils),
  `packages/eslint-config`, `packages/tsconfig` — shared foundations.
- `apps/prototype` — a **single Next.js app** containing three route groups: `(workspace)`
  (entry), `(design-system)` (the DS explorer), and `(iga)` (the IGA product). All consume
  `packages/design-system`.
- `registries/*.json` — machine-readable source of truth for what components/patterns/templates/
  tokens exist.

The one-way dependency (`app → design-system`, never the reverse) and the "no hardcoded visual
values" rule are **enforced by ESLint import-boundary rules and CI**, not by convention.

## Consequences

- The consume-don't-bypass rule becomes compiler/CI-enforced rather than aspirational.
- A single app gives one shell, one theme provider, one "Back to Workspace," and one deploy —
  matching the product spec — while the DS remains a truly separate, versionable package.
- Slightly more initial tooling setup (workspaces, Turborepo, shared configs) is required.

## Alternatives considered

- **Two fully separate apps** (`apps/design-system` + `apps/iga`): rejected for now — duplicates
  the shell/theme wiring and complicates the shared "Back to Workspace" experience. Can be
  revisited if the products need independent deployment; the DS-as-package design makes that
  split cheap later.
- **Single app, no separate DS package** (just folders): rejected — the boundary would be
  convention-only and would erode. The whole point is a mechanically real boundary.
- **Plain npm workspaces without Turborepo:** acceptable, but Turborepo's task caching/pipeline
  pays off as the repo grows; chosen for scalability.
