---
"@akiga/design-system-app": minor
---

The Applications list splits Reconciliation into **Active Accounts** and **Last Synced**, each
answering one question.

One cell holding two counts and a timestamp needed a tooltip to say what its icons meant and could
not be sorted on any of the three. Split, each column is named by its header, sorts on its own
value, and links to the tab that holds what it counts — accounts to App Accounts, the timestamp to
Reconciliation.

`Reconciliation` is renamed to `Last Synced`, because a column headed for a process while containing
only a date leaves the reader to guess which part of the process the date belongs to.

The entitlement count leaves the list; it is still on each application's Entitlements tab. The
account count sheds its icon too: a mark that repeats its own column header is decoration the eye
steps over on every row to reach the number it came for. The icons earned their place when two
counts shared one cell and neither had a header to name it, and stopped earning it the moment each
got a column.

`Never synced` is stated rather than dashed — for a freshly onboarded application it is the whole
story rather than a missing value — and set in tertiary, so an absence does not read as loudly as a
date. Formatted with the same `formatDateTime` the Reconciliation tab uses, so the same fact reads
identically in the list and on the page the cell links to (verified: `app-google-workspace` shows
"Aug 9, 2026, 2:25 AM" in both).

**Every application used to report the same last sync.** `listSyncRuns` started its walk at the
module's fixed `NOW` and stepped backwards, so the newest run of every application landed on
2026-08-12T00:34Z to the minute. Invisible while the value only appeared one application at a time;
put ten of them in a column and it reads as a broken cell rather than as ten systems on ten timers.
Each application now starts up to three days back from that clock, offset by its own seed — from a
separately seeded stream, so the timestamps moved without disturbing the counts and outcomes the
walk had already produced.

`hasSyncHistory` and `lastSyncAt` are extracted so the list can ask when an application last synced
without generating ten runs to find out, and — the reason that matters — so the list and the history
table can never disagree about whether an application has ever synced.

Last Synced sorts ascending with never-synced first: the question this column gets sorted for is
"what has IGA not looked at lately", and never is the extreme of that rather than a value to shuffle
in among the recent ones.

Note for whoever picks this up next: `Active Accounts` reads 0 for all ten directory applications,
because every seeded `appAccounts` row belongs to the older `app-okta` / `app-aws` / `app-github` /
`app-salesforce` catalog that `application-directory-list.ts` deliberately excludes. The column is
correct; the fixture has no accounts for these apps to count. The same 0 already shows on each
application's App Accounts tab and in its Reconciliation totals.
