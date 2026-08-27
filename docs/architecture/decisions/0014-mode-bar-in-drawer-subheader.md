# ADR-0014: Mode switchers that replace a drawer body use ModeBar in subheader

- **Status:** Accepted
- **Date:** 2026-08-27
- **Deciders:** Product / Design System
- **Tags:** design-system, forms, patterns, overlays

## Context

Add authorization is two forms, not one form with a field at the top. Basic is
username and password. OAuth is a tabbed request/response with four FormSections.
The method radios lived in a FormSection inside the scrolling body (ADR-0013).
On OAuth, that switcher left the viewport as soon as the reader scrolled to
Endpoints — they could no longer see, or change, which form they were filling.

Sticky-positioning that FormSection would have been a patch: FormSection is a
field group, and sticky inside a padded scroller still fights padding, z-index,
and a missing opaque background.

## Decision

We will:

1. Own this as `ModeBar` in the Design System — equal icon+label tiles, no radio
   dots, no heading. Selection is a brand outline on a white (surface) fill.
   Disabled options stay in the row (muted, with a tooltip) so the set does
   not reflow when a method ships.
2. Pin it with `Drawer.subheader`, a slot between the header and the scrolling
   body. Header, subheader, and footer are chrome. Only the body scrolls.
3. Keep `FormSection` for grouping fields *inside* a chosen form (ADR-0013).
4. Keep `Tabs` for facets of one form (Request / Response). Do not use Tabs or
   SegmentedControl to pick which form the drawer is. When those facets sit
   above a long scrolling form, pin them in `Drawer.toolbar` — the same reason
   ModeBar is not in the body.

## Consequences

- A Drawer whose body replaces itself (Basic vs OAuth, and the next connector
  with the same split) MUST put a ModeBar in `subheader`. Do not put method
  radios in a FormSection in the body, and do not `position: sticky` a group.
- Add authorization is the reference.
- Coming-soon methods remain visible and disabled in the bar.
- Request / Response tabs MUST live in `Drawer.toolbar` when the form below
  them is long enough to scroll. Do not sticky Tabs inside the body.

## Alternatives considered

- **Sticky FormSection of radios** — rejected; a field group is the wrong object,
  and sticky inside a padded scroller is how a switcher still leaves a gap.
- **SegmentedControl** — rejected; no disabled/soon, no icons, and it reads as a
  density toggle, not a mode of the drawer.
- **Tabs for Basic / OAuth** — rejected; Tabs switch facets of one form. Request
  / Response already uses them inside OAuth.
- **RadioCardGroup in the body** — rejected; radio dots and descriptions belong
  among fields, and the control would still scroll away.
