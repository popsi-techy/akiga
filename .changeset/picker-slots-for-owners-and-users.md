---
"@akiga/design-system-app": minor
---

Finish the picker-slot pass over both wizards: the Emergency Access V2 stepper's Owners step and the
access-certification wizard's Users step now stay one row whatever is chosen.

**Owners (V2 stepper).** Same problem the Assignments step had — the detail page's tab is a 264px rail
beside a table, which needs a page's width and got a wizard column. It is now two slots, individual
owners and governance teams, and the copy says the thing the step could not: ownership is optional,
because `EA_REQUIRED_CHECKS` deliberately leaves it out — blocking break-glass access on a missing
owner would stop someone switching it on during an incident.

Both halves use `TableSelectDrawer`, which preselects and replaces. That matters more here than it
looks: the tab's own "Add Owners" drawer only *appends* and leans on its table's row menu for removal,
so a slot wired to it would have let a reader add the wrong person with no way to take them back out
until they reached the detail page. New `listOwnerCandidates()` returns the whole directory for that
editing case, alongside `getAvailableOwners()` which subtracts the current owners for the appending
one.

**Users (certification wizard).** This step grew a card listing every chosen person with a remove
button each, which broke the property the slot exists for: the step changed shape and height the
moment anything was picked, and a forty-person review scrolled past its own footer. Removal moved into
the drawer, which already edits the set — a searchable table beside a running selection panel, which
is where you want to be when the set is large, and the inline list was only ever better while it was
short. `PickedRow` and three imports went with it.
