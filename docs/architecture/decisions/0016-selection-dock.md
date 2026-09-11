# ADR-0016: Selection Dock for bulk table actions

- **Status:** Accepted
- **Date:** 2026-08-31
- **Deciders:** Product / Design System
- **Tags:** design-system, patterns, access-certification

## Context

Bulk table work often puts “N selected / Select all / Clear” in DataTable’s
first-row `selectionToolbar`, with bulk verbs elsewhere on the page. That
banner steals a data row, disappears when the reader pages, and splits the
job across two places.

## Decision

We will own a **SelectionDock** in the Design System: a bottom-aligned floating
card on the work surface. It holds the count in a badge, select-all and the
bulk actions as tertiary (text) buttons separated by hairlines, and clear.

New bulk-selection surfaces that need a floating dock MUST use SelectionDock
and MUST NOT also pass `selectionToolbar`. Use `placement="header"` for a
Notion-style pill on the table header, or the default `bottom` dock.

Access Certification uses the **bulk-selection-bar** pattern instead (see
`registries/patterns.json`).

This is not SetupBar. SetupBar walks a draft’s remaining steps and is parked.

## Consequences

- SelectionDock supports `placement="header"` and `bottom`.
- The dock’s ancestor MUST be `relative` so it does not cover the sidebar.
- Icon-only bulk actions beside Filter are a defect on a dock screen.

## Alternatives considered

- **Keep the in-table banner.** It is already shipped; it hides a row and
  cannot hold named actions without growing taller than a row.
- **Full-bleed bottom bar.** Reads as a second footer and fights pagination.
- **Reuse SetupBar.** Wrong job; parked.
