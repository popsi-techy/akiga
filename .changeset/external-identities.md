---
"@akiga/design-system-app": minor
---

External Identities — a sub-nav entry under Identities, and a new kind of pill to mark the distinction.

**`StatusChip` gains `icon`**, which puts a small icon where the dot goes. The reason is semantic, not
decorative: a dot is a *state light* — it says "this is currently true" and its colour carries the
meaning — so a dot in front of a classification implies a liveness it does not have. Nobody's
internal/external status flickers. The icon states the category outright and, at chip size, is read
before the word beside it, which is what matters in a column where every row carries one. It supersedes
the dot rather than joining it: two leading marks make the gap before the label stop being predictable
down a column.

`IdentityKindChip` is the one way that classification renders. External is `caution`, not `danger` — a
contractor is a population that needs different handling (a sponsor, an end date, no birthright access),
not a fault, and a column of red on a list that is *supposed* to contain externals teaches the reader to
ignore red. Internal is `neutral`, because spending a colour on the default case leaves nothing to
notice the exception with.

**Identities now carry `kind`**, and the seed gains six external people across four organizations.
`listUserIdentities()` deliberately still returns everyone: it is the canonical directory that owners,
reviewers, approvers and reports all resolve against, so narrowing it to internals would silently change
every count in the product. External Identities is a *view* of those rows, which is why both lists carry
the pill — the same row is reachable from either, and a reader landing mid-scroll should not have to
infer which list they are on.

The new page earns its nav entry by asking what the full list cannot. An external has three fields an
employee does not — originating organization, internal sponsor, access end date — which would be empty
for fourteen rows out of twenty on the main list. The last is the point: **nothing in an HR feed
announces a contractor leaving**, so an external past its end date while still enabled is the most
common way standing access outlives its reason, and it is invisible on a list showing only status,
because the status is still Active. The page states that count above the table and marks the row
"Expired 31 Jul 2026" in the Access ends column.

`DirectoryListPage` now forwards `layout` to `DataTable`; the new page declares a width per column and
opts into `fixed`, so seven columns fit with no horizontal scroll and rows stay one height.

Follow-up: the kind chip carries a person for Internal and a badge for External — an employee is simply
a person in the directory, where an external is someone who had to be *issued* something to be here: a
pass, a contract, an end date. Internal moved from neutral grey to `info` blue; External keeps
`caution`, since that population carries a sponsor and an end date and is worth finding in a column
without reading. Neither is ever `danger` — the red on these screens belongs to the expired-access row,
which is a genuine fault. The All Identities tiles use the same two marks.

Nav icons realigned with the chip: the Identities group takes `people`, freeing `person` for User
Identities and `badge` for External Identities. A child wearing its parent's icon reads as a duplicate
rather than a category, which is why the parent had to move first — and `people` rather than `groups`
because `groups` already belongs to Governance Teams, where it means a team rather than a population.

Renamed: **User Identities is now Workforce**, in the nav, the page, and the chip — "Workforce" and
"External" name the two populations directly, where "Internal" only said what someone was *not*. The
glossary's preferred term moved with it, keeping "user identity" as a synonym. The route
(`/iga/directory/user-identities`) and the stored `kind: 'internal' | 'external'` are unchanged; the
label is what a reader sees, and moving either would touch every link and record that resolves against
them.

The Workforce list also declares a width per column and opts into `layout="fixed"` — the longer chip
label had pushed the Risk column off the end under auto layout.
