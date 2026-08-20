---
"@akiga/design-system-app": minor
---

`SegmentedControl` is restyled and segments can carry a count; the emergency-access pane switchers
become segmented controls.

**The track is outlined, not filled, and the selected segment is inverse.** `background.subtle` behind
the whole control made it a grey slab on the page whatever was selected; a hairline `border.default`
states the same grouping and leaves the page's ground alone. Selection then had nothing to contrast
against — a white segment on white — so it moves to `surface.inverse` (ink 800) with `text.inverse`,
the strongest pairing in the palette, and drops the shadow it needed to lift off grey. Every segment
carries one weight (500, via the complete `text-*-medium` classes rather than a size plus a weight
utility): the fill marks the selection, and changing the weight too would reflow the track each time
the choice moves.

The track's radius drops from `lg` (12px) to `md` (8px), which is the segment's `sm` (6px) plus the
2px gutter — the value that keeps the outer curve parallel to the inner one instead of bowing away
from it. The segment's radius was an arbitrary `rounded-[6px]`; it is now the `sm` token that already
held 6px, so the two move together if the scale ever does.

`text.inverse on surface.inverse` is now an enforced pairing in `check:contrast` rather than an
assumption — 53 pairings pass. The active segment's count uses `opacity-70` rather than a `/70` colour
alpha, because these colours are CSS variables holding hex and Tailwind's alpha modifier cannot
resolve them: it emits an invalid colour and the number vanishes.

This changes every `SegmentedControl` in the product — today the workflow builder's palette switcher
and the docs examples.

**In the Design System**, `SegmentedOption` gains an optional `count`. It renders as a plain trailing
number, deliberately not `NavList`'s filled pill: a badge inside a segment competes with the
selected-segment fill for the same "this one" signal, and the two components sit at different levels
— `NavList` looks like navigation, a segmented control looks like a control. Zero shows rather than
hides, for the same reason it does on a tab: on a switcher, "Technical Roles 0" answers the question
the reader is asking, where an absent count makes them click to find out it was empty.

**In the product**, the Assignments and Owners tabs of an emergency-access profile switched from a
`NavList` in a card down the left to a segmented control above the content. Both were a choice between
exactly two things, and both spent a 264px column and the full height of the page saying so, next to a
table that wanted the width — the entitlements table went from 410px to 774px at 1280.

It also fixes a hierarchy problem the new left rail exposed. With navigation docked on the left, a
`NavList` sitting immediately beside it gave the page two navigation-looking lists whose styling said
nothing about the difference between them: one moves between sections of the profile, the other only
switches which table is on screen. A segmented control does not read as navigation, so the levels are
legible again.

Both tabs keep their counts through `count`, and the "Add …" button still follows the selected segment.
