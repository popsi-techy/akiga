---
"@akiga/design-system-app": patch
---

`VersionsPanel` uses the house date format instead of its own.

`formatVersionAt` rendered `September 14, 2026, 08:15 AM` against the house
`Sep 14, 2026 · 2:20 PM`, so the builder's version rail disagreed with every other timestamp
in the product — including the header two inches above it.

More than a style drift: it read local time through `toLocaleString`, which is the one thing
`lib/datetime` exists to stop. That module's own note says the product had six copies of this
pair in five formats, "two of them reading local time, which is the hydration bug this module
was written to stop" — Next renders a client component on the server in the host's zone and
hydrates it in the reader's, so any local format produces a different string on each side.
This was a seventh copy, doing exactly that.

It delegates to `formatDateTime` now. Invalid input renders an em dash rather than echoing
the raw ISO string back at the reader.
