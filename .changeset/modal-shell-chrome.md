---
"@akiga/design-system-app": minor
---

`Modal` gains the two slots its siblings already have, and closes its header when it is a shell.

A modal with `height` set is not one block of content — it is a header, a body that may be split into
regions, and a footer. Its footer already closed with a rule and its header did not, so the panel had
a seam at the bottom and none at the top, and any divider inside the body had nothing to meet up
there. A filled panel's header now carries a bottom rule; a content-sized modal is still one block
and gets none.

`leading` renders a mark **without** the brand-tint tile — the tile grounds a generic MUI glyph,
which needs one, and washes a logo orange, which does not. Same slot and same reasoning as
`Drawer.leading` and `PeekPanel.leading`. `disablePadding` drops the body gutter so a split's divider
can run from the header rule to the footer rule instead of stopping 16px short of both; the body then
owns its own insets. Same prop, same job, as `Drawer`'s.

Applied to the application-type preview on the onboarding catalogue: the logo moved out of the meta
rail and into the header beside the title it was repeating, and the rail's divider now meets both
rules.
