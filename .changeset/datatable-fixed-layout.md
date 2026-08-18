---
"@akiga/design-system-app": minor
---

`DataTable` gains a `layout` prop and a per-column `wrap` escape hatch, fixing three defects the
Governance Analytics reports list exposed.

**`Column.width` was applied to the `<th>` only**, never the `<td>` — so the width hint was weaker than
it looked, and a body cell could take a share its header had not asked for. It now binds on both, and on
the loading skeleton too, so columns do not jump when the data lands.

**Body cells wrapped while headers did not.** That is what produced 75px rows under a 46px header band
on a list whose tallest real content is two lines. A list is scanned vertically, and ragged row heights
are what make a long one hard to read.

**Auto layout cannot be fixed by truncation, which is why `layout="fixed"` exists.** Under auto layout a
cell's minimum width is its longest word, so one long value widens the table past its container and the
trailing columns scroll off — the failure the old registry note *documented* rather than prevented
("Give text cells an explicit width, or…"). Adding `nowrap` makes it worse, not better, because the
minimum becomes the whole string. Measured on the reports list: **82px of overflow before, 302px with
nowrap alone, 0 with fixed layout**, and rows went 75px → 55px at the same time.

`auto` stays the default. Flipping it would require declaring widths across twenty-five existing tables
first — switching it globally squeezed Applications' name column to an equal share and clipped
"Salesforce" to "Sale…", which is a worse table than the one we started with. So the correct behaviour
is available and documented as the recommendation, and the sweep is a separate piece of work.

`Column.wrap` opts one cell out of the truncation, for two-line renders and for anything that paints
outside its own box — a chip's border, an avatar's ring — which `overflow: hidden` would otherwise
shave. Same trade and the same name as `InfoRow.valueWrap`, which solved this once already.

The reports list opts into `fixed` with a declared share per column, and drops three pieces of redundant
cell content:

- Type reads "Department", not "Department Governance Overview"; Scope reads "Engineering", not
  "Department = Engineering". A column is read under its own header, so restating it spends half the
  width on the one word carrying no information — and that half is exactly what survives truncation,
  which is how both columns came to read "Departmen…".
- The report name is **plain text, not a blue link**. The row already opens the report on click, so the
  link was a second control for the same action, and it put the link colour on the one thing in the row
  the reader came to *read*. A value is not a control (visual-language §5.1a) — the same mistake the
  audit drawer's entity name had.
- The second line under the name ("6 sections · 4 plots · Identity Status = Active") is gone. Those
  facts are on the report's own header where there is room, and here they doubled the row height to
  restate what the Type and Scope columns already say.

**Created by now shows an avatar** beside the name, so a person reads as a person and the column gets a
fixed left edge to scan down instead of ragged text.
