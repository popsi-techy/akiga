# ADR-0007: Build the Automation builder canvas as a custom, zero-dependency renderer

- **Status:** Accepted — **Implemented** (measured SVG edge overlay shipped in Design System `FlowCanvas`)
- **Date:** 2026-07-19
- **Deciders:** Product owner + Design System / Frontend
- **Tags:** architecture, design-system, automation, tooling, dependency

## Context

The Automation module (ADR pending) needs two three-pane visual builders (Approval Policies,
then Workflows). Their center pane is a **derived-layout graph**: users never draw edges or drag
nodes; the tree (`Start → nodes → End`, with branching nodes that fan out into lanes and merge)
is rendered entirely from a recursive sequence/branch data model. Requirements that constrain the
canvas:

- Nodes are **not** draggable; edges are **not** hand-drawn — both are derived from data.
- Branch lanes **fan out and merge**, support **arbitrary nesting**, and must use **adaptive
  width with no sibling overlap**.
- Bespoke affordances: connector **drop targets + quick-insert "+"**, per-node **completeness
  badges**, **select-to-configure**, **Outline/Detailed** density, zoom/fit/pan.
- Must be **token-styled** (DS tokens, contrast-gated) and match the rest of the product.

Per the constitution (§8–§10), adding a runtime dependency requires an ADR. We spiked the same
stress tree (a 3-lane conditional whose left lane contains a further 2-lane conditional, plus one
incomplete node) **two ways** and measured both.

### Measured evidence (spike)

| Signal | Custom (no dep) | React Flow + dagre |
| --- | --- | --- |
| Route JS (built) | **4.24 kB** | **82.7 kB** |
| First-load JS (route) | **126 kB** | **204 kB** |
| New runtime deps | 0 | `@xyflow/react`, `dagre` (+ `@types/dagre`) |
| Full tree renders (9 nodes) | ✅ | ✅ (11 incl. Start/End) |
| Fan-out / merge / nesting | ✅ | ✅ |
| No sibling-lane overlap | ✅ (verified, 0 overlaps) | ✅ |
| Adaptive lane width | ✅ | ✅ |
| Branch centering with asymmetric nesting | centers over subtree extent (Δ≈82px vs immediate-children centroid) | centers over subtree extent (Δ≈72px) — **same behavior** |
| Zoom / fit / pan | worked immediately (transform + scroll) | `fitView` did **not** auto-apply (viewport stuck at scale 1 — known measure-timing issue needing `onInit`/manual `fitView`) |
| Edge labels (IF/ELSE) | trivial (DOM) | did not render out of the box; needs edge-label wiring |
| Honors "non-draggable / no manual edges" | by construction | only after disabling `nodesDraggable`, `nodesConnectable`, `edgesFocusable`, hiding handles |

The npm advisories present after install are pre-existing (Next.js + its bundled postcss), **not**
introduced by the spike libraries.

## Decision

**We will build the Automation canvas as a custom, dependency-free React renderer** that derives
its layout from the sequence/branch model, and we will **remove `@xyflow/react` and `dagre`**.

The real `FlowCanvas` DS component will render node cards in HTML/MUI (token-styled) and draw
connectors with a **measured SVG overlay** (ResizeObserver → orthogonal connectors between
measured node anchors), rather than the spike's pure-CSS bus borders. This keeps zero dependencies
while giving pixel-accurate connectors and, if we want it, true children-centroid centering.

**Implemented (2026-08):** `FlowCanvas` measures `data-flow-*` anchors on the stage and draws
fan-out / merge / sequence paths in an SVG layer (`flowEdges.ts`). Product builders must not
paint decorative CSS stems — use `FlowStem` or `renderBetweenTiers` so one stroke owner keeps
joins continuous under zoom and asymmetric nesting.

## Consequences

- **Easier:** exact token/theme fidelity (stays inside the contrast gate); bespoke affordances
  (drop targets, quick-insert, completeness, density) are ordinary React; smallest bundle; no
  fighting a graph-editing library's drag/connect defaults; no third-party CSS layer.
- **Harder / newly required:** we own layout, zoom/fit/pan, and connector routing. We must build
  the SVG-overlay connector layer and a small layout pass; these become reusable `FlowCanvas`
  internals documented in the Design System.
- **New rules:** the canvas is a DS component with its own doc page; both builders consume it.
  Node/branch metadata comes from the registries (source of truth), not the canvas.
- **Follow-up:** delete the `src/app/iga/automation/spike/` folder and uninstall the spike deps
  before M1.

## Alternatives considered

- **React Flow (@xyflow/react) + dagre — not chosen.** Proven capable, and its auto-layout centers
  subtrees for free, but it nearly doubles route JS (+78 kB route / +40 kB first-load), adds two
  runtime deps, and is architected around *interactive* draggable nodes and hand-connectable edges
  — the opposite of our derived, read-only-structure contract. Realizing our bespoke node/edge UI
  means writing custom node/edge components anyway, so the library's core value (edge routing,
  pan/zoom) is partly reimplemented while we spend effort *disabling* its defaults. `fitView` and
  edge labels also needed extra wiring in the spike.
- **Custom with pure-CSS connector buses (the spike itself) — not chosen as the final form.**
  Zero-dep and correct for overlap/adaptive width, but with deep asymmetric nesting the pure-CSS
  bus centers the trunk on the lane-*row* center rather than the children's connection points.
  The measured-SVG-overlay upgrade fixes this while staying dependency-free.
