---
"@akiga/design-system-app": minor
---

An unavailable button is visible on the surface it is sitting on.

`surface.disabled` was `neutral[100]` #F8F8FA: **1.06:1 against white and 1.01:1 against
`background.subtle`**. The fill had never been doing any work anywhere — a `subtle` panel just took
the last hundredth and made it obvious, and the Submit button in the request wizard's justification
dock had no visible shape at all.

Two changes, because one would not have been enough:

- **The fill is `neutral[1000]` #C4C9D2** — 1.59:1 on `subtle`, a grey slab you can see, still
  receding from anything enabled beside it.
- **And it carries a hairline.** A component cannot know what it has been dropped on — `surface`,
  `subtle`, a tinted panel — so a fill can only ever be tuned against one ground while an edge reads
  on all of them. `inset` box-shadow rather than a border, since a contained button has none and a
  real one would shift the label a pixel between states. Outlined already draws its own border and
  drops the ring rather than wearing both; text stays transparent, since a box around a disabled
  text button would be a new object rather than a receded one.

**The label steps from `text.tertiary` to `text.secondary`** — 3.24:1 on the darker fill, 4.60:1. It
has to clear AA: these buttons are `aria-disabled` and stay focusable so the tooltip explaining *why*
is reachable, and a focusable control is not "inactive" under 1.4.3. The check-contrast pairing
follows, and the fill now has a reported (unenforced) pairing of its own against `subtle`, so a
future change to either token has to look at the number rather than discover it on a screen.

**A duplicate is deleted.** The gated look lived twice: once in `muiTheme`'s `MuiButton` overrides,
which every variant reads, and once as `unavailableSx` in `Button.tsx`, which only `secondary` and
`tertiary` spread on top. They had drifted, and the first attempt at this fix edited the copy — which
changed nothing for the contained primary, because the primary never read it. The theme is now the
only definition, and it already branched on `.MuiButton-outlined` and `.MuiButton-text` correctly.

Verified all three variants gated: primary #C4C9D2 with the inset hairline and no border, secondary
with its real border and no ring, tertiary transparent with no ring — all with `cursor: not-allowed`
and the `text.secondary` label.
