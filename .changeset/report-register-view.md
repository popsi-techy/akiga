---
"@akiga/design-system-app": minor
---

Operational registers open a view instead of a 404, and only the two that exist are
clickable.

Every register card carried an `href` to `/iga/reports/view/[id]`, and that route did not
exist — twelve cards, twelve 404s. A card that opens a 404 is worse than a card that says it
is not ready, so a register earns its link when it has a view behind it and not before. Ten
of the twelve now render with a **Coming soon** tag and no link, which is the same rule the
Audit Logs landing page already follows: the set of registers this product will answer is
itself information, and an administrator deciding whether IGA can answer a question is
better served by an honest "not yet" than by a card that breaks.

**`RegisterView`** serves the two that are built — the Access Assignment Register and the
Access Certification Campaign Report — with a reporting-period switcher, a search across
every column, Download CSV, and the register's own table.

**Rows are derived, never seeded.** A register is not a dataset of its own; it is a question
asked of the identities, accounts and campaigns the platform already holds. Seeding rows
would have produced a catalogue that agrees with nothing else on the product — an assignment
register listing grants no account has, beside a Directory that never heard of them. The
assignment register walks accounts and their entitlements; the campaign report reads the
certifications store. Both are therefore always true, and both change when the underlying
data does.

**The evidence header is opt-in, and collapsed.** It is the block that makes a table
quotable — definition version, window, that these are *current records* rather than a
reconstruction as at the requested date, and that the screen is an unsealed render rather
than a filed artefact. An assessor reads it once before trusting anything below it; an
administrator answering "who holds this entitlement" reads it never, and eleven rows of
provenance above the answer is eleven rows they scroll past every visit. So it is a flag on
the register (`provenance`) rather than fixed chrome — the campaign report does not carry one
— and where it does apply it collapses to a single line carrying the two facts that change
how the table is read, so a reader who never opens it is not misled by what they did not see.

**Both new pages use `DetailShell`,** the frame an application, a policy and a request
already use — avatar tile, title, chips, description, one action slot, and a tab strip on
its own rule. They had hand-rolled headers with their own back arrow, their own title size
and their own action row, which is how a product ends up with five headers that are nearly
but not quite the same.

**And clause rows only link to a register that exists.** The clause matrix pointed at the
register that evidences each requirement, and most of those are still Coming soon — so five
of ten rows opened the same 404 the hub's cards used to, and on that page a dead link reads
as "the evidence is missing" rather than "the screen is not built". A bound register with no
view renders as plain text instead.

**The reporting period moved into the filter row.** It had a labelled band of its own — an
eyebrow reading REPORTING PERIOD, the control, and the timezone — which gave one of two
controls on the page its own section heading and pushed the table 58px down every visit. The
label was redundant beside the options: "Last quarter" reads as a period without being told
it is one. On the register the timezone went with it, since the evidence header already
states it on the two rows where it changes what a date means; on the framework the resolved
window stays beside the control, because "Last quarter" is a rule and an assessor needs the
two dates it resolves to.

Search leads the row and the period follows it: search is the control a reader reaches for
without thinking, the period the one they set once and leave, so the row runs in the order it
is actually operated.
