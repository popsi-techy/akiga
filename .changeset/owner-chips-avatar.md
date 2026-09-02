---
"@akiga/design-system-app": patch
---

The Owners column in Applications names people with the round person avatar and the plain name instead of a tinted chip — the shape is how the rest of the product says "person", and a pill around a name reads as one value among a set. It goes through `OverflowChips`' `renderItem`, which drops the group pill too, so the cell is a face, a name, and the `+n` after it. The overflow tooltip names the rest the same way.

Documents the treatment as a People example on the Overflow Chips page, since owners, reviewers and approvers are all the same cell.
