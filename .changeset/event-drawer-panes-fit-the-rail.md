---
"@akiga/design-system-app": patch
---

Two panes in the connection-event drawer were built for a narrower rail and were being cut
off. Both now fit.

**Response.** The form column was `w-[420px] shrink-0` and the sample-payload preview
`w-[380px] shrink-0` — 800 exactly, which is what the detail pane measured when the rail was
240 wide. The rail is 288 now, so the pane is 752, and two columns that refuse to shrink in a
752 box run 48px past the drawer's edge, where the pane's `overflow-hidden` clips them: the
preview's own Sample/Live status chip was sliced in half against the right edge with no way
to scroll to it.

The form is now `flex-1 min-w-0` and the preview 360. One fixed column against one flexible
one holds whatever either side does next, instead of two fixed widths that happen to sum to
the pane of the day.

**Attribute mapping.** The table declared `min-w-[760px]` inside a 704px pane, so the
Transformation field was cut off at the right on every screen and reaching it meant scrolling
a table sideways inside a drawer that does not otherwise scroll. 700 is what the five columns
actually need — 170 + 170 + 36 for the selects and the remove button, 40 of gaps, and 142
each for the two text fields — so the table fits and the horizontal scroll is left for
genuinely narrow viewports.

Measured after: nothing in any of the four tabs extends past the drawer, the split is 752 of
752, and the mapping table is 704 of 704 with a 144px Transformation field.
