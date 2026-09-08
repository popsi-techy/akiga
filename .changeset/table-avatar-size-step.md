---
"@akiga/design-system-app": patch
---

Table marks are 28px again — seven cells had reached for the form size.

`Avatar` has an `s` step at 28px documented as "the table mark", one letter away from `sm` at 32px,
which is the form/card size. Seven table-cell renders passed `sm`, so a person's initial sat 4px
larger than the same mark in every `IdentityCell` beside it.

Two of them — the Review Requests queue's **Requested For** and **Requested By** columns — were a
hand-rolled copy of `IdentityCell`: an avatar, a gap, a truncated name. That is the whole reason they
could be the wrong size. They use `IdentityCell` now, which pins `s` and takes size off the table for
good ("Size is not a caller prop. Tables always use `s`."), with no `email` since the queue shows
names only.

The other five are entity marks with their own second line, where `IdentityCell`'s email slot does
not fit, so they just take the right step: Birthright, Certifications, the Governance Teams column in
`EntityOwnersTab`, and both Emergency Access surfaces.

Left alone deliberately: the selectable app card in `EntityCatalogDrawer` and the `SelectionPanel`
icon in `EmergencyAccessDetail`. Neither is a table row, and 32px is correct for a card.

Verified: every avatar in the Review Requests table now computes 28px / 14px.
