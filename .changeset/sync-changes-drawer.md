---
"@akiga/design-system-app": patch
---

Make the reconciliation delta chip open the names behind its numbers. Clicking the accounts or entitlements chip — in a Sync History row or in the "Modifications in last sync" card — opens a drawer with the run's event, time, and trigger in the subtitle and three tabs: Added, Removed, and Untouched, each a table of what moved. Tabs rather than three stacked lists because the groups are read one at a time and are wildly uneven — two new accounts under ninety untouched ones is two rows nobody scrolls to — and the counts ride on the tabs, so the shape of the run is legible before any of them is opened. The drawer opens on the first tab with anything in it. A failed run says so above the tabs, which explains why two of the three are empty.

The sync history data now carries the named change lists, walked backwards from the application's current holdings so the totals still reconcile; the things a run removed come from a small pool of retired accounts and roles, since by definition they are no longer in the Directory.

`DataTable` gains `paginated`, so a table short by construction can drop a footer that would otherwise offer a page size it cannot use and a range reading "1–2 of 2".
