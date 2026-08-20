---
"@akiga/design-system-app": patch
---

`DataTable` no longer paints a scrollbar across the bottom of the card.

MUI's `TableContainer` scrolls on both axes and draws the bar itself, so a table squeezed
narrower than its columns grew a grey rail under the last row. Constitution §7.2 is the rule it
broke: scroll freely, never paint a scrollbar. The container now carries `ds-scroll`, so the
overflow still scrolls — by wheel, trackpad, keyboard and touch — without the chrome.

Found when a docked checklist took a column away from the Owners tab and the table dropped to
266px. It was latent in every table before that: any narrow container, any long column set, any
zoomed-in browser would have shown it. Fixing it in the component rather than at that one call site
means the 25-odd tables in the product all stop doing it at once.

Vertical overflow loses its bar too, which is the intent — a row clipped mid-height at the edge of
the scroll area already reads as "there is more", and the pagination footer says how much.
