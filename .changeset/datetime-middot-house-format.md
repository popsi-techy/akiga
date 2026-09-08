---
"@akiga/design-system-app": patch
---

One date-time format, everywhere: `Mar 4, 2026 · 10:15 AM`.

A middot rather than a comma, following the email templates. `Aug 9, 2026, 2:25 AM` has two commas
doing different jobs and leaves the reader to work out which one splits the date from the clock.

Getting there meant converging six formatters producing **five** different formats:

| | Was | Now |
|---|---|---|
| `lib/datetime` | `Apr 20, 2026, 2:32 PM` | `Apr 20, 2026 · 2:32 PM` |
| `sod/labels` | its own copy of the same shape | re-exports `lib/datetime` |
| `formatUntil` | `Nov 4, 2026, 9:30 AM` | middot; keeps its wall-clock parse |
| `formatGovDateTime` | `26 Aug 2026, 13:35` **(local)** | delegates |
| `formatRequestDateTime` | `4 Mar 2026, 10:15` **(local)** | delegates |
| `formatReviewDateTime` | `Mar 04, 2026 2:32 PM` | delegates |

**Two of them were reading local time**, which is the bug `lib/datetime` was written to prevent:
`getHours()` returns the host's zone on the server and the reader's in the browser, so the same
instant rendered as two different strings either side of hydration. Request Governance and Access
Requests timestamps therefore *move* with this change as well as reformatting — an 08:05Z stage now
reads `Aug 26, 2026 · 8:05 AM` where an IST server had been printing `26 Aug 2026, 13:35`. That is
the correction, not a side effect.

**The middot now binds a date to its time, so it can no longer join a labelled list.** The request
lifecycle's stage line had been building `Started <t> · Finished <t> · <actor>`, which came out as
five middots at two levels with no way to see which belonged to a timestamp. Those clauses take an
en dash now, as does the Origin/Submitted line on the request summary. Flat unlabelled lists
(`target · date · time`) still read fine and are left alone.

`DATE_TIME_SEP` and `MONTH_ABBR` are exported from `lib/datetime` so the separator has one home, and
`request-governance.ts` drops the month table it no longer uses.
