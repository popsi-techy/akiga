---
"@akiga/design-system-app": minor
---

Basic details are editable — from a drawer, reached from both places that offer it.

The header's **Basic Details** button was a `toast.info('Edit basic details')` stub: it looked like a
control and did nothing. The setup checklist's Basic details step routed to `overview`, which is the tab
the reader was already on, so it read as a dead click. Both now open the same drawer.

A drawer rather than a tab or an inline form: it is a short, self-contained edit reached from two
different places, and a tab would make the reader leave whatever they were reading to perform it. It also
keeps the pair together — name and description are read as one thing everywhere they appear, so they are
edited as one thing.

Both fields are required, matching `eaBlockingSteps`: saving an empty description would hand back a
profile that cannot go live with no hint as to why. Save is disabled until both are filled — verified
disabled on an empty name, enabled once valid.

Draft state is local and committed on save, re-seeded each time the drawer opens, so Cancel means
something and a cancelled edit is not the starting point of the next one. Saving calls `bump`, the same
reducer every other mutation on this page uses — verified end to end: the header title updated to the new
name as soon as the drawer closed.

`EmergencySetupCard` takes an `onEditBasics` callback, because that one step is the only one that is not a
tab; routing it through `onGoToTab` is what made it a no-op before.
