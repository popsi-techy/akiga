---
"@akiga/design-system-app": minor
---

Add Emergency Access V2 at `/iga/emergency-v2`, alongside the existing module now labelled
Emergency Access V1. The two differ only in creation: V1 opens a drawer for a name and leaves you
on a draft with a checklist; V2 walks a six-step `StepTracker` — basic details, assignments,
eligibility criteria, owners, limits and timing, preview — and ends on an Activate that lands you
on the live profile.

The list and the detail screen are shared, not copied: `EmergencyAccessListView` takes the base
path and what its create button does, and `EmergencyAccessDetail` takes the id and where "back"
goes. Each wizard step embeds the same editor its tab uses, so what you configure during creation
and what you maintain afterwards cannot drift apart. Restores `updateEmergencyAccessBasics` and the
`onChanged` callbacks on the eligibility, assignments and advanced-config editors, which V2 needs
to re-read readiness as you go.

**The preview step now reads like the SoD resolution preview.** Each section was a `Card` — an icon, a
tinted shell and a framed inner panel around two rows of text — and four of them stacked made the step
look like four objects rather than one thing being checked. They are now an `overline` taxonomy label over
a single bordered panel, the same shape `sod-resolution-v3` uses for "User access that will be revoked".

`overline` is exactly this job by the visual language's own definition: it names what kind of thing
follows and carries no meaning you would lose by deleting it, which is true of "What it is" and false of
a card title. The four card icons went with the cards — `check:icons` counts 43 now, down from 47 — and
the `PreviewSection` helper takes an optional count, so a section can carry `(n)` the way the SoD preview
does when there is something to count.
