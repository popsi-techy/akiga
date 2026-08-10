# ADR-0010: Model governance as one entity/relationship graph, rendered by two views

- **Status:** Accepted
- **Date:** 2026-08-09
- **Deciders:** Product owner + Design System / Frontend
- **Tags:** architecture, domain-model, design-system, governance, canvas

## Context

The product could already answer questions about individual objects — this application's
entitlements, this policy's rules, this role's members. It could not answer the questions an
administrator actually arrives with, which are all *relational*:

> Who governs this application? Which Birthright policies apply? Who approves requests for it,
> and what happens when they don't? Where are the governance gaps?

Answering those requires the connections between objects to be first-class data, not something
each screen re-derives from a handful of id arrays. Two forces shaped the decision:

1. **Density.** An application is connected to departments, locations, business and technical
   roles, entitlements, birthright policies, approval policies, workflows, SoD policies, owners,
   review owners, approval hierarchies, delegations and escalation rules. Rendered flat, that is
   several hundred relationships — the classic unreadable graph.
2. **Two legitimate reading modes.** "How is this connected?" is a shape question and wants a
   canvas. "What exactly governs this, and who owns each responsibility?" is a structured
   question and wants tables and lists. Neither subsumes the other.

ADR-0008 established the canonical Directory entities. This ADR extends the model *upward* into
governance, and decides how it is rendered.

## Decision

**We will model governance as one uniform entity/relationship graph, and render it through two
views over the same query.**

1. **One entity shape.** Every governable thing — department, location, business role, technical
   role, application, entitlement, birthright policy, approval policy, approval workflow, SoD
   policy, delegation, escalation rule, governance role, person — is a `GovEntity` with the same
   fields (`src/data/governance-types.ts`). Ownership is modelled as **three distinct
   responsibilities** (`ownerIds`, `reviewOwnerIds`, `approvalOwnerIds`), never one, because
   conflating them hides the self-review conflict the surface exists to expose.

2. **Relationships are typed and named.** A closed set of `GovRelationType` values, each with a
   verb (`governed by`, `owned by`, `reviewed by`, `protected by`, `escalates to`, …) and a
   definition. A line on the canvas always says *why* the two things are connected. Adding a new
   kind of connection means adding a reviewed type, never an untyped edge at a call site.

3. **Relationships are authored to flow toward responsibility.** Source and target are chosen so
   edges run organization → roles → access → controls → chain → responsibility. That ordering is
   what makes the map a readable layered graph rather than a hairball, and what makes
   `traceGovernance()` an ordered chain rather than an undirected walk.

4. **Findings are derived, never authored.** Missing owners, broken approval chains, unmanaged
   delegations, orphaned policies, uncontrolled applications and conflicting ownership are
   computed from the model (`src/data/governance.ts`). A gap exists because the data says so, so
   the findings cannot drift from what the screens show. Every finding carries what is wrong, why
   it matters, what is affected, who is accountable, and the recommended action — a finding is
   never a bare label.

5. **The map draws a rooted neighbourhood, never the whole model.** `buildGraph(rootId, expanded,
   filters)` returns the root's relationships plus one auto-revealed ring, capped per relation
   type, with the remainder surfaced as a count on the node. Roughly twenty nodes, always.

6. **Both views are renderings of one query.** The page owns selection, scope, filters and risk
   context; neither view owns state. Switching between Map and Explorer is therefore lossless by
   construction rather than by synchronisation.

7. **The canvas is a new Design System component, `RelationshipCanvas`.** Custom and
   zero-dependency, for the same reason as `FlowCanvas` (ADR-0007): layout is *derived* from the
   model, never user-positioned, so a general graph library would be weight without leverage. It
   owns column layout, barycenter crossing reduction, edge routing and labelling, zoom/pan/fit,
   selection and dimming. The consumer owns the node card and every decision about which nodes
   and edges exist.

8. **Legibility beats completeness.** When the whole graph will not fit above a readable scale,
   the canvas holds that scale and frames `frameNodeId` rather than shrinking everything to fit.
   Fit-to-view and fullscreen remain one click away. A graph scaled to 35% technically shows
   everything and communicates nothing.

9. **Risk and focus de-emphasise; they never recolour.** Both lenses dim what is not relevant.
   A map that turns red when you ask about risk stops being readable exactly when it matters.
   Risk is rendered only through `RiskScoreChip` / `RiskDot` (ADR-0008), never re-mapped locally.

## Consequences

**Easier.** A new governance question is usually a new query over an existing model rather than a
new screen. Adding an entity kind means one `KIND_LABEL` entry, one `LAYER_OF` entry and a
builder — the canvas, the explorer, the details panel, search, filters and findings all pick it
up. Swapping the seed for an API replaces two imports in `governance.ts` and nothing else.

**Newly required.**
- Any new relationship kind needs a `GovRelationType` with a verb and a definition, and must be
  authored in the direction that flows toward responsibility.
- Any new governance gap is a *derivation* in the findings engine plus a `GovFindingKind`. Gaps
  must not be hand-listed in seed data.
- The Governance Model is a **read** surface. Every fix it recommends links to the module that
  owns the object (`routes.ts`); ownership is never edited in two places.
- `registries/product/entities.json`, `relationships.json`, `glossary.json` and
  `feature-catalog.json` now carry the governance entities and must stay in sync with the code.

**Harder / accepted costs.**
- The seed grew: the Directory gained six applications, five technical roles and five business
  roles, with deliberate gaps (SAP has no owner, Jira and Snowflake have no review owner) that
  drive the findings. Those gaps are marked `GAP:` in `governance-seed.ts` and must not be
  "fixed".
- A six-column graph is wider than a console pane, so panning is inherent at 1440px. Mitigated by
  root-anchored framing, a collapsible scope rail, and fullscreen (where the whole graph fits at
  ~91%).
- `buildGraph` caps fan-out. A capped neighbour is reported as a count on its source node, never
  silently dropped.

## Alternatives considered

- **A force-directed graph (d3-force, React Flow + a layout engine).** Rejected: non-deterministic
  layouts reshuffle between renders, and a graph that moves cannot be read or compared. The layered
  column layout also encodes the governance hierarchy in position, which a force layout throws away.
  Same reasoning as ADR-0007, and it would add the dependency that ADR rejected.
- **One view only — canvas.** Rejected: the brief's own framing is right. Filtering, comparison and
  operational administration are structured tasks; forcing them through a graph makes them worse.
- **One view only — tables.** Rejected: dependency discovery and "why does this person have this
  access" are shape questions. A table can list a policy's applications but cannot show that two
  policies reach the same application by different routes.
- **Deriving governance per screen from the existing Directory ids.** Rejected: it is what the
  product already did, and it is why no screen could answer a cross-cutting question. Each screen
  would re-implement its own traversal, and they would disagree.
- **Hand-authored findings in the seed.** Rejected: a finding list that is authored separately from
  the data it describes goes stale on the first seed edit, and a governance surface that reports a
  gap the data does not have is worse than one that reports nothing.
- **Extending `FlowCanvas` to render networks.** Rejected: it renders a *sequence* (recursive
  seq/branch, top-down, with insertion affordances). A network has no sequence, no insertion, and
  needs column assignment and crossing reduction. Two components with clear jobs beat one with a
  mode switch — and both stay simple enough to keep zero dependencies.

---

Related: [ADR-0007](./0007-automation-canvas-approach.md) (custom canvas precedent),
[ADR-0008](./0008-directory-entities-and-risk-scale.md) (canonical entities and the risk scale),
[`docs/product/04-domain/governance-model.md`](../../product/04-domain/governance-model.md).
