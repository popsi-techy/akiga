---
"@akiga/design-system-app": minor
---

The application Overview tab is rebuilt around what the reader came for: is this application
healthy and governed, and if not, what next.

It was four framed cards of eighteen label/value rows, every row the same size in the same weight.
Nothing led, so the whole thing had to be read to learn anything — and the rows that were actually
*problems* were formatted identically to the rows that were merely facts. On Google Workspace, the
unassigned access review owner sat fourth in the fourth card: the most actionable statement on the
page was the least visible thing on it.

**Three levels now, in this order.**

*What it holds*, as figures — 24px numerals on the page's own ground, hairline separated, no tiles
and no icons. A count is read by its magnitude, and boxing four of them spends the colour budget on
decoration. Each links to the tab that lists the population, per `StatTile`'s rule that a number
whose members can be listed should say where. IAM and PAM connections get a fourth figure,
Applications discovered.

*What needs attention* — the protagonist, and the only framed region on the page, because it is the
only region that can prompt an action. Each item names one unresolved thing and links to the tab that
closes it. With nothing wrong it collapses to a single quiet line; no green panel, because the reward
for a well-set-up application is quiet.

*Reference detail*, two unframed columns under overline labels, hairline rows. Material you consult,
not material you scan — boxed, it competed with the part that needs you.

**Only gaps the reader can actually close are listed.** "No access review owner" is a real hole and
is reported as a `danger` chip on its own reference row, but it is not an attention item: nothing in
the product assigns one per application — `reviewed-by` comes from the governance graph, and review
ownership is configured per certification campaign. A list item whose link cannot finish the job is
worse than no item, because after the second dead end the block stops being read. The rule for adding
one is written next to the code: name the tab that closes it, and check something on that tab writes
the value the gap reads. Connector gaps are likewise suppressed when provisioning is off, where
Configure does not exist and "not authorized" is not a defect.

**Two things are deliberately gone.** Risk, because the identity band directly above already carries
the `RiskScoreChip`. And what the last sync *moved*, which read "No change accounts +1 −0
entitlements" — the busiest row on the page, answering a question nobody asks of an overview, in a
tab that has three cards for it.

Built per the visual language's review pass: two directions were mocked and screenshotted before
building, and the mock caught what the description could not — a risk chip that looked weightless
beside 24px numerals, an inverted plural ("1 event need setup"), and a crowded delta row. Measured
after: at 768px the figures reflow 2×2 and the columns stack with nothing truncated and no horizontal
overflow. The `sm`/`md` breakpoints were wrong and are now `lg` — what has to fit is the content
region, and the sidebar takes ~200px off the viewport before this element sees any of it; picked
against the viewport, the four-across row clipped its last label to "Appli".

Squint test: greys and white, no orange in the body, colour only on chips and two 6px dots.

Note for whoever picks this up: `applicationGovernance` has no entry for any of the ten
directory-list applications, so `reviewOwnerIds` and `governanceRoleIds` are empty for all of them —
every one reports "Ungoverned" and an unassigned review owner, and the all-clear state is currently
unreachable. The gap items read live stores and clear correctly; these two read the static seed.
