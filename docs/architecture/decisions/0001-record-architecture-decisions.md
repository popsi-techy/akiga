# ADR-0001: Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-07-19
- **Deciders:** Repository maintainer
- **Tags:** governance, process

## Context

This repository is intended to be built and maintained by many AI assistants over time, without
the maintainer re-explaining prior decisions. Decisions made only in chat or in someone's head
are invisible to the next assistant and get silently reversed. We need a durable, discoverable
record of *why* the architecture is the way it is.

## Decision

We will record every non-trivial architectural or cross-cutting decision as an **Architecture
Decision Record (ADR)** in `docs/architecture/decisions/`, using the MADR-style template in
`0000-adr-template.md`. ADRs are numbered sequentially, contain one decision each, and are
immutable once accepted — a change of mind is a *new* ADR that supersedes the old one.

An ADR is required when a choice: affects module boundaries or architecture; establishes a
cross-cutting convention; adds or removes a dependency; changes the token/theme pipeline; or
would be expensive to reverse. Amending `AI_CONSTITUTION.md` also requires an ADR.

## Consequences

- The Decision Log becomes the authoritative source of *why*, complementing the code (source of
  truth for *what*) and the registries (source of truth for *what exists*).
- Every AI assistant must consult ADRs during the "review documentation" step of the §7
  workflow.
- A small, consistent process overhead is added to significant changes — accepted as the cost
  of long-term continuity.

## Alternatives considered

- **No formal record (rely on chat/commit messages):** rejected — invisible to future
  assistants and not queryable.
- **A single running DECISIONS.md file:** rejected — grows unstructured, hard to supersede
  cleanly, and merges poorly.
- **A heavier RFC process:** rejected as overkill for a prototype-focused repo; MADR is the
  right weight.
