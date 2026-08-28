---
"@akiga/design-system-app": minor
---

Promote `PickerSlot` into the Design System.

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
