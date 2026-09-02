---
"@akiga/design-system-app": patch
---

`Menu` now puts `aria-haspopup="menu"` and a live `aria-expanded` on its trigger, including a custom one passed via `trigger`. Without them a screen reader announced a plain button, giving no warning that activating it opens a list and no way to tell the list was already open.
