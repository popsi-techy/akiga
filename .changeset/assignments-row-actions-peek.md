---
"@akiga/design-system-app": minor
---

Assignment, owner and governance-team rows get an info and a remove icon, and info opens an inline
peek panel. The panel narrows to 340px.

The kebab held exactly one item, so it charged a click to discover there was only ever one thing in
it — and it hid the row's most useful affordance, the details, because those were not an action at all
until now. Both are on the surface: **info** then **remove**, read-then-write, so the destructive one
sits furthest from where the eye lands.

Info opens the same `PeekSlot` + `PeekPanel` the directory's peeks use, rather than a new panel of its
own — the panel takes width from the table instead of covering it, so the row you opened stays visible
and picking another simply swaps the contents. It shows the description as prose, then Type,
Application and Risk Score as `InfoRow`s from the shared `infoIcon` vocabulary. Removing the row a
panel is open on closes the panel, instead of leaving details on screen for something that is gone.

**Application and Description stand down while the panel is open.** The panel takes 380px of a ~776px
region, which is not enough for five columns: they overflowed, and the first thing to scroll out of
reach was the Actions cell holding the button that had just been pressed. Both fields are in the panel,
so dropping them costs nothing — the table keeps what you scan by, the panel holds what you opened it
for. Verified no horizontal overflow in either state and the remove button inside the viewport with the
panel open.

**Owners does the same, for both halves.** A person's panel is the directory's own
`IdentityDetailsBody`, rendered `bare` — owner ids *are* identity ids, so the panel shows the same
record the directory does rather than this tab inventing a thinner version of it, and it ends on a
link to that record instead of dead-ending on a name and an address. A team's panel carries its
description, its reviewer count and a link to the team page. Email stands down from the owners table
while a panel is open; Reviewers and the name cell's description sub-line stand down from the teams
table, for the same reason as Assignments.

One piece of peek state covers both halves rather than one each, because the panel is one slot: two
would let a stale person sit behind a team. Switching halves closes it, since a panel describing a row
that is no longer listed is worse than no panel.

The three tables share a **`RowActions`** component instead of three copies of the same pair of icon
buttons. Neither icon is coloured at rest — a column of red bins reads as a warning about the data
rather than as something you may do to it; remove finds its danger colour on hover. Both carry a
tooltip and a row-naming `aria-label`, since eight identical "Remove" buttons are not navigable by
screen reader.

**The panel is 340px, down from 360.** The measured floor is 328 — the widest content in any peek is a
144px email against a 94px label column — so this keeps ~12px over it and hands the rest back to the
table. Verified against the directory's own account peek: no clipped text at 340.

The kebab's "Message" stub is gone with it. It called `toast.info` and did nothing; it can come back as
a panel footer action next to "Open identity page" if it becomes real.
