---
"@akiga/design-system-app": minor
---

The access-certification wizard's Users step stays one row whatever is chosen.

This step grew a card listing every chosen person with a remove button each, which broke the
property the slot exists for: the step changed shape and height the moment anything was picked,
and a forty-person review scrolled past its own footer. Removal moved into the drawer, which
already edits the set — a searchable table beside a running selection panel, which is where you
want to be when the set is large, and the inline list was only ever better while it was short.
`PickedRow` and three imports went with it.
