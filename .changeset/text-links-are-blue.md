---
"@akiga/design-system-app": patch
---

Text-only controls are blue, never brand orange. A control with no button chrome — "View details",
"Clear all", "Make default", "Read more" — is read as a link, so it takes `text.link`. Orange is the
colour of the one action the reader is meant to take next, and spending it on every secondary link is
how a screen ends up with four oranges and no primary. Nine controls across the audit drawer,
directory tabs, reviewer screens and `SelectionPanel` were brand-tinted; `FilterDrawer` and the
app-account page had it right already, so the convention existed and was simply applied unevenly.

Four of the nine were also accessibility defects: they used `text-brand` `#EB5424`, which is 3.60:1
on white — below AA for normal text, and exactly what the token file warns against.

`text.link` moved one step darker, `#1976D2` → `#1565C0` (new `blue.850`). The old value is 4.60:1 on
white but only **4.40:1 on `subtle`**, and a text-only control lands in tinted panels as often as on a
card, so the link colour has to clear AA on all three grounds; `blue.900` passes at 8.6:1 but is a
near-black navy that stops reading as a link at 14px. `blue.800` stays where it was for `info` fills,
which carry white text. The contrast gate now checks link text on canvas, surface **and** subtle
rather than white alone — the gap that let this ship.

Recorded as §5.1a of the visual language, with the corollary that a value is not a control: colouring
the thing the reader came to read in order to make it clickable promises navigation, and an entity
name that only expands a panel breaks that promise.
