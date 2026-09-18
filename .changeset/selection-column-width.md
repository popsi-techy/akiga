---
"@akiga/design-system-app": patch
---

DataTable's selection column is 48px, so the checkbox is never clipped. MUI sizes a `padding="checkbox"` cell at 24px and then pads it 16px/12px, which leaves the 18px box four pixels short — and it writes that width under a two-class selector, so the previous `sx` width was silently losing.

External Identities and Sponsored Users also state their column widths as percentages that add up, with Name left flexible. A fixed table layout gives percentage columns exactly their share and settles the remainder on the pixel ones, so the mix of the two that those two tables carried squeezed the selection column further with every column added.
