---
"@akiga/design-system-app": patch
---

Access Duration in the review queue is a pill, and no longer a control.

It was a blue text button that navigated to the request — which the row click already does, so the
only thing the link added was colouring the value the reader came to read. That is the case
"**a value is not a control**" exists for: an underlined blue date promises somewhere else to go,
and here it went where the row was going anyway.

Tinted through `StatusChip intent="info" dot={false}` — the taxonomy-tag form — so it inherits the
chip's shape, type step and verified contrast rather than becoming a local pill. No dot: a dot reads
as state, and how long access lasts is a property of the request rather than a stage it is in. The
column also gains `sortable` with a `value`, which it could not have while its cell was a button.

One thing to weigh: the Type column in the same table already tints `info` blue for Entitlement and
Application, so blue now appears in two columns meaning two different things. Each column is
headed and separated, which is why this reads cleanly, but if the two ever sit closer together the
duration pill is the one to take to `neutral` — it answers "how long", which is neither a state nor
a kind, and greyscale is the default for that.
