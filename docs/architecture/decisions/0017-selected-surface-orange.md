# ADR-0017: Selected surfaces use orange 50

- **Status:** Accepted
- **Date:** 2026-09-01
- **Deciders:** Product / Design System
- **Tags:** design-system, tokens, theme

## Context

Selected table rows must use the lightest brand orange. That value is
`orange[50]` `#FFF4EE`. MUI’s default selected mix (`primary.main` at
`selectedOpacity` ≈ 0.08) washes the row toward beige and does not consume the
token.

## Decision

We will map **`surface.selected` to `orange[50]` `#FFF4EE`** and
**`surface.selectedHover` to `orange[100]` `#FFE5D8`**.

The MUI theme applies these on `MuiTableRow`, `MuiListItemButton`, and
`MuiMenuItem` at full opacity. DataTable still opts out with
`highlightSelectedRows={false}` (Access Certification V2). Tailwind exposes
`bg-surface-selected` and `bg-surface-selected-hover`.

## Consequences

- Every selected table / list row that does not opt out gets `#FFF4EE`.
- `brand.subtle` is the same primitive (avatars, icon tiles).
- Text-on-selected pairings are enforced by `check:contrast`.

## Alternatives considered

- **Use `orange[100]` so the row reads louder.** Rejected: the lightest orange
  is 50 / `#FFF4EE`.
- **Hardcode a hex on DataTable.** Rejected: constitution — tokens, then theme.
