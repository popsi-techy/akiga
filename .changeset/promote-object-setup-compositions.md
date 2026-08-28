---
"@akiga/design-system-app": minor
---

Promote the compositions Emergency Access already shared — RowActions, PeekPanel,
TableSelectDrawer, ClickToEditText, SetupChecklistDock, SetupProgress, and
DirectoryListPage — into the Design System.

They now have docs, registry entries, and four patterns (catalog-list, two-pane
collection, table-select-drawer, object-detail-setup). Product files re-export
from `@ds/components` so existing imports do not move. TableSelectDrawer takes
`renderRisk` instead of importing a product chip. SetupChecklistDock takes
`seedDone` instead of hardcoding the Emergency Access `basic` step. SetupBar is
parked. The leftover V2 `EmergencyAssignmentsPicker` is deleted.
