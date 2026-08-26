# ADR-0012: Tenant settings page anatomy

- **Status:** Accepted
- **Date:** 2026-08-26
- **Deciders:** Product / Design System
- **Tags:** design-system, settings, patterns

## Context

MFA Configuration established a tenant-admin layout: a 900px column, grey wells stacked
as one configuration (4px gap, radius only on the outer corners), a section that saves
itself (Reset icon + extra-small Save), and OverflowChips in a white capsule on a grey
well. Those pieces lived in product code. The next settings page would have forked them
or drifted.

## Decision

We will:

1. Own the layout in the Design System as `SettingsPage`, `SettingsSection`,
   `SettingsRow`, `SettingsStack`, and `SettingsInfoBanner`.
2. Require new tenant settings screens to assemble from those primitives — not from
   ad-hoc Cards around grey wells.
3. Keep `SettingsRow` `surface="plain"` for divided rows inside an existing Card
   when a list of fields already lives in a panel. Access Request uses grey wells
   and a NavList rail, not this.
4. Use `OverflowChips tone="onSubtle"` for a chosen set sitting on a grey well. Default
   OverflowChips chrome is a grey capsule and disappears on `bg-subtle`.
5. Open `SettingsNested` *inside* a grey well (`SettingsRow.nested`) — a white
   panel, not a second well and not a Card. One `SettingsNestedRow` when a
   parent control is on; several when the well is a heading and the fields live
   in the panel. The well itself MAY omit a control.

## Consequences

- A new System Settings detail page that is **one tenant configuration** MUST
  use `SettingsPage` (900px, shrinks) and `SettingsSection` (heading + optional
  Reset + xs Save). The page name is the breadcrumb, not a repeated h1.
- A destination that is a **catalog of records** (one row per schema or rule)
  MUST use the directory list frame and a create/edit Drawer — not
  `SettingsPage`. User Identity Correlation, Custom Attributes, and Entitlement
  Types are this shape. The table is the protagonist; the drawer is the editor.
- Sibling grey wells MUST use `SettingsStack`. A middle well is square by construction.
- A nested field MUST use `SettingsNested` + `SettingsNestedRow` inside the
  parent well. Do not add a second grey well, and do not wrap the follow-up in
  a Card. A well with no control still uses this panel for its fields.
- Do not wrap a `surface="subtle"` row in a `Card`.
- Product settings chrome (persona gate, breadcrumbs, persistence) stays in the IGA
  product. The Design System owns the visual anatomy only.

## Alternatives considered

- **Leave the layout in product** — rejected; the second settings page would copy classes
  and the stack radius would drift.
- **One mega `SettingsScreen` with a config array** — rejected; composition over a prop
  for every variation. Sections, grids of role wells, and banners do not share one shape.
- **Reuse Card for the grey wells** — rejected; a bordered white panel around a grey well
  is two answers to where the setting lives.
