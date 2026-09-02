---
"@akiga/design-system-app": patch
---

`SelectionDock`'s header pill can now be dragged anywhere on the page area it can be seen, not just inside the table it is positioned against. It starts over the table header, which is where the rows you are about to act on are, so being unable to move it off the table defeated the handle. The limit is now the nearest ancestor that clips — the page's scroll container — measured off live rects, so the pill still cannot be dragged over the sidebar, under the topbar, or out of view.
