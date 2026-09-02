---
"@akiga/design-system-app": patch
---

`Button` gains `iconOnly`, which squares it to the shared control height around a lone icon child. For a bordered icon action sitting beside a labelled one, so a card or toolbar footer reads as one row of buttons; a borderless icon action in a table row is still `RowActions`. Pass `aria-label`, and usually a `Tooltip` — an icon says *bin*, not *what it removes*.
