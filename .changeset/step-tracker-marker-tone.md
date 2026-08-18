---
"@akiga/design-system-app": patch
---

`StepTracker` — a lighter done marker and a stronger halo.

**Done takes `success.fill` (#12855A) instead of `success.solid` (#00695C).** Solid is a near-black teal,
and a column of completed steps sat heavier on the rail than the orange marker for the step actually being
worked on — the finished work was the loudest thing in a rail whose job is to show where you are. `fill`
is the role meant for graphical blocks.

**The halo took its own colour role and kept its 4px spread.** It was drawn in `subtle`, which is tint
strength — very nearly the card behind it — so it read as a hairline someone had forgotten to remove.
Widening the spread to 6px was the wrong lever and came back out: at a colour that carries weight, 6px
reads as a band around the step rather than a glow behind it. `brand.halo` (#FFCCB5) and
`status.success.halo` (#BEDECE) are two rungs up their ramps, which is what makes the marker sit in
something. Both are existing palette steps (`orange[200]`, `green[200]`) named as roles rather than
reached for raw — no design-system component imports the palette directly, and this one should not be
the first.

`check:contrast` gained a pairing for this. It enforced `onSolid on solid` but nothing on `fill`, so
moving the marker to `fill` would have taken its 12px white numeral outside the gate entirely. White on
`success.fill` measures **4.64:1**, clear of the 4.5:1 AA floor — enforced now rather than asserted, at 51
pairings, and the check is scoped to success because it is the only fill currently carrying text.

The connector stays grey in every state, which landed just before this.
