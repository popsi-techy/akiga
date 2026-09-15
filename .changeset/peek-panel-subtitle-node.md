---
"@akiga/design-system": patch
---

`PeekPanel.subtitle` takes a node, not just a string.

A panel's condition is usually a status object, and the string-only slot forced callers to
set it as grey prose: an approval level that read "Approved" in a green chip on the card
behind it read "Approved" in `text-text-secondary` inside the panel that card opened. That
is the same fact changing species between two surfaces a click apart, and §5.2 puts status
colour on the status object rather than on the sentence describing it.

The slot is now an inline row, so a chip and a few words of context sit on one baseline. A
plain string still renders exactly as it did — every existing caller passes one.
