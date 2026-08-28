# ADR-0015: Promote object-setup compositions into the Design System

- **Status:** Accepted
- **Date:** 2026-08-28
- **Deciders:** Product / Design System
- **Tags:** design-system, patterns, emergency-access

## Context

Emergency Access shipped several compositions that other modules already copy:
RowActions, PeekSlot/PeekPanel, TableSelectDrawer, ClickToEditText,
SetupChecklistDock, SetupProgress, and DirectoryListPage. They lived under
`components/product` and were not in `registries/components.json`, so the next
screen could not find them and would invent a parallel. SetupBar remains in the
Design System with no product caller after V2/V3 were removed. TableSelectDrawer
imported `RiskScoreChip` from product, which the Design System must not do.

## Decision

We will:

1. Own these compositions in the Design System, with docs, registry entries, and
   product-path re-exports so existing imports keep working.
2. Treat them as four patterns: catalog-list, two-pane-collection,
   table-select-drawer, and object-detail-setup.
3. Keep risk painting out of TableSelectDrawer (`renderRisk`). The product
   wrapper injects `RiskScoreChip`.
4. Keep domain facts off SetupChecklistDock. Existence-only steps pass
   `seedDone`; factory defaults pass `doneLabel`.
5. Park SetupBar. Do not restyle it into the dock. The live setup pattern is
   SetupChecklistDock.

## Consequences

- New catalog lists MUST use DirectoryListPage. New peek-and-remove rows MUST
  use RowActions + PeekPanel. New catalog picks MUST use TableSelectDrawer.
  New draft objects whose editors live on the page MUST use SetupChecklistDock,
  not SetupBar and not a second wizard.
- The Design System still MUST NOT import product code.
- EntityCatalogDrawer and DetailShell stay in product until a second caller
  forces the same promotion.
- `EmergencyAssignmentsPicker` is deleted. It only served the removed V2 wizard.

## Alternatives considered

- **Leave them in product** — rejected; Applications already copies the dock,
  and Settings catalogs already copy DirectoryListPage. Ownership has to match
  reuse.
- **Delete SetupBar** — rejected this pass; parking it is cheaper than a
  breaking removal, and the primitive may still earn a linear-strip job.
- **Promote EntityCatalogDrawer with TableSelectDrawer** — rejected; get the
  two-pane select clean first.
