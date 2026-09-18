---
"@akiga/design-system-app": patch
---

**DirectoryListPage can select rows and run bulk actions.**

The Access Certification review already had checkboxes and a bar (count, Select all, Approve / Reject-style actions). Catalog lists that need the same job were either rebuilding that chrome or offering only per-row icons.

`DirectoryListPage` now forwards `selectable` / `selectedIds` / `onSelectionChange` to DataTable. While any *visible* row is selected it wraps the table in the same strong-border card and selection bar Certification uses, and renders `selectionActions` beside the count. Parent still owns the ids.

Sponsored Users **Pending** uses it: bulk Approve, and Reject behind a confirm dialog. **Action taken** stays unselectable.
