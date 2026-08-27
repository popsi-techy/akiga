# ADR-0013: Form grouping in drawers uses FormSection

- **Status:** Accepted
- **Date:** 2026-08-27
- **Deciders:** Product / Design System
- **Tags:** design-system, forms, patterns

## Context

Long create/edit drawers (Add authorization, and the next connector form) were stacking
every field in one `space-y-5` column. Ten fields with no groups read as a list, not as
jobs. The first instinct — grey wells or nested Cards — would copy Settings page chrome
into a 560px overlay, and ADR-0012 already forbids wrapping a well in a Card.

SettingsSection looks close (heading + hairline) but it is a tenant-admin page heading
with its own Save. A drawer saves once in the footer. Reusing it would teach the wrong
object: a section that saves itself, on a surface that does not.

## Decision

We will:

1. Own overlay form grouping in the Design System as `FormSection` — an outlined
   18px icon plus an `h5` heading, stacked fields, and a hairline on every section
   after the first. No caption under the title; field hints carry the why.
2. Require long Drawer/Modal forms that have more than one job to assemble from
   `FormSection`. Do not invent a local heading + `space-y-5` stack.
3. Keep `SettingsSection` for System Settings detail pages only (ADR-0012).
4. Never wrap a `FormSection` in a Card or a grey well. The heading and the hairline
   are the group (visual language §3.2).

## Consequences

- A Drawer with credentials, then URLs, then request shape MUST use one `FormSection`
  per job. Add authorization is the reference.
- A single-field drawer does not need `FormSection`.
- The drawer title stays the larger heading (`h4`, 18px). Group titles are `h5`
  (16px) with an outlined icon — two steps down, so they name the job without
  competing with the drawer.
- Product form logic (validation, secrets, persistence) stays in the IGA product.

## Alternatives considered

- **Reuse SettingsSection without Save** — rejected; the primitive’s job is a page
  section that saves itself. A drawer that imported it would look right and mean wrong.
- **Grey wells (SettingsRow subtle)** — rejected; four tinted blocks in a 560px drawer
  are boxes doing the work hierarchy should do, and they compete with the drawer paper.
- **Nested Cards per group** — rejected; visual language forbids nesting a card inside
  the drawer’s already-lifted surface.
- **Leave grouping in product classes** — rejected; the second long drawer would copy
  headings and the type/spacing would drift.
