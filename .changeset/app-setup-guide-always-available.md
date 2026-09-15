---
"@akiga/design-system-app": minor
---

Every application gets the setup guide, not just the ones onboarded through the drawer.

The guide was gated on an application having an onboarding record, which made it a property
of *how the application arrived* rather than of the work it needs. A catalogued application
still has owners to name, a baseline to set and an approval policy to choose — it simply had
nowhere to see that. On Google Workspace the page's own "Needs attention" panel said "No
policy governs access to this application" while the checklist that exists to track exactly
that was absent from the header.

Finished setup is worth showing too. The checklist is the page that answers "is this
application actually governed", and a finished one answers yes — hiding it at the moment it
can say so is hiding the answer. The dock already handled the case ("Required steps are
complete."); nothing ever reached it.

The change is mostly a type. `isAppSetupStepDone` and its neighbours were typed against the
whole `OnboardedApplication` while reading exactly two fields from it — the id, and whether
IGA pushes access into the system. Everything else (authorizations, inventory, owners,
baseline, approval policy) comes from its own store, keyed by id. They now take an
`AppSetupSubject` of those two fields, which `OnboardedApplication` satisfies structurally,
so no existing caller changes. A catalogued application supplies the same pair from its seed
profile, which the page was already computing for the Configure tab.

The progress donut still belongs to a draft being assembled — it counts down blocking work.
On anything else the book stands alone: the guide is there to open, it just has no countdown
to show.
