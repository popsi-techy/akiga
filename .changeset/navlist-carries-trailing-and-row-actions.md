---
"@akiga/design-system-app": minor
---

`NavList` items take a `trailing` node and a per-row `action`, and the connection-event rail
stops being its own component.

`ConnectionEventDrawer` had a local `RailItem` — the last hand-rolled `role="tablist"` in
the product, beside twelve surfaces already on `NavList`. It existed because the rail needed
two things the component did not offer: a `StatusChip` on the trailing edge, where `NavList`
had only `count?: number`, and a kebab of row actions, where it had no slot at all. So it
was forked rather than extended, and a fork has no spec to check against: its selected
state, its hover, its hairline and its fill each drifted into a separate judgement call,
and every request to adjust the rail was answered by taste instead of by the system. Three
rounds of that arrived, independently, back at `NavList`'s own rule — brand outline on
white, no second fill.

Two slots close the gap:

- `trailing` — anything on the trailing edge that is not a count. Replaces the count pill;
  a row has one trailing slot, because two things fighting for the same edge is how a
  switcher stops being scannable.
- `action` — a control that acts on the row rather than selecting it. It renders as a
  **sibling** of the tab button, never a child: a button inside a button is invalid HTML
  and React refuses to hydrate it (the same defect the approval flow canvas hit). Selecting
  a row and acting on it stay two targets with two names.

A truncated label now carries its own full reading in `title`. A switcher whose rows are
long names cuts exactly the part that tells them apart — the connection rail holds one event
kind, so its defaults are "Account Entitlement Revocation" and the same label with a
numeral, differing in the last character — and no width short of the longest name fixes
that. Hover gives it back. Labels that are nodes rather than strings are left alone; their
own markup owns their title.

The row padding moved from the wrapper onto the button while doing this, so the whole of an
item is a click target rather than a label with a dead 10px margin around it. Existing
adopters render identically — measured at 37.6px row height with `8px 10px` button padding,
before and after.
