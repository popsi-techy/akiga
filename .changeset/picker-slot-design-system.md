---
"@akiga/design-system-app": minor
---

Promote `PickerSlot` into the Design System and use it for the Emergency Access V2 stepper's
Assignments step.

The step used to embed the detail page's Assignments tab — a 264px rail beside a three-column table —
into the column left over by the progress rail. It scrolled sideways and clipped its own empty-state
copy, and none of that detail is what the step is asking: the step asks *what does this hand over*,
and a count with the first name in it answers that. It is now two picker slots, entitlements and
technical roles, opening the same `EntityCatalogDrawer` and `TableSelectDrawer` the tab opens and
writing the same store, so a wizard and its tab cannot drift apart.

The component was private to the access-certification wizard. Rather than copy it, it moves to the DS
with a docs page and a registry entry, and the certification wizard now consumes it from there. Its
invariant is written down where the next person will find it: **one row in both states** — the count
and the chips replace the "nothing chosen" copy in place, so the surface never changes shape under the
reader the moment they pick something.

The filled state's bare pencil moves in with it as `onEdit`, since it was about to be copied a second
time. `action` is now the empty-state control and `onEdit` the filled one, passed one or the other
rather than a single `ReactNode` the caller switches by hand — the API says which control belongs to
which state instead of leaving that to each call site.

While extracting, the Assignments tab and the new picker were factored onto one `useAssignments` hook
and one `AssignmentDrawers` pair, so the two surfaces read, write and pick through identical code. The
drawer's open state went from two booleans to one nullable kind, which removes the state where both
could claim to be open.
