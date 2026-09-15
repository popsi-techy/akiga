---
"@akiga/design-system": patch
---

Removes six product files that existed only to re-export a design-system component.

`ClickToEditText`, `DirectoryListPage`, `PeekPanel`, `RowActions`, `SetupChecklistDock` and
`SetupProgress` each left a four-line file behind in `components/product/` when they were
promoted into the design system. Every one of them read `export { X } from '@ds/components'`
— so each component had two addresses, and which one a new call site picked was down to
whichever import the author happened to copy. `DirectoryListPage`'s had no consumers at all.

All twenty-three call sites now import from `@ds/components` directly, and the
`components/product/directory` barrel stops re-exporting two design-system components as
though they were product ones.

No behaviour changes: every shim resolved to the same module the imports now name.
