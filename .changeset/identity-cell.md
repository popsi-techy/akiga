---
"@akiga/design-system-app": minor
---

Tables of people and accounts now share one composition: **IdentityCell** — a 28px (`s`) avatar, the name,
and the email on the line under it.

A dedicated Email column was a second scan target for the same fact, and the first thing a drawer
or Peek had to hide. External Identities already stacked the address under the name; every picker
and directory list now does the same, so a future table does not grow a column just for email.
