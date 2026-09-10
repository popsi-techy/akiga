---
"@akiga/design-system-app": minor
---

`PeekPanel` gains an optional `eyebrow` — an overline above the title, for a panel whose title alone
does not identify it. A peek opened from a list needs no such line, because the list is still on
screen saying what was picked; a panel opened from a diagram whose node names repeat across parents
does ("Approval" is the title of a stage on every request), so the eyebrow names the parent and the
position: `PROD_DEPLOY · STAGE 2 OF 4`. It truncates before the title does.

Also gains a **docked** variant: `PeekSlot.flush` drops the gutter and `PeekPanel.docked` trades the
card's radius and full border for one hairline on the leading edge. The default is right on a page of
cards, where the panel is another card; inside a region already divided by hairlines it made the
panel read as a different kind of thing from the columns around it.
