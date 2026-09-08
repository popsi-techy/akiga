---
"@akiga/design-system-app": minor
---

Governance Teams can be added as owners from the entity, the same way individuals are.

The team half of ownership was read-only, and the copy explaining why was wrong. It said "Team
ownership is assigned on the team" and offered a link to the Governance Teams list — but the team's
own **Owned Applications** tab is a read-only table whose empty state reads "This team owns no
applications yet" with no Add either. The sentence named a place where the job also could not be
done. A charter was a seed-only fact, so the relation was uneditable from both of its ends.

There was no reason for the asymmetry. A charter is a many-to-many relation and the entity is one of
its two legitimate ends: you add a team to an application for the same reason you add a person.

**Both ends read one answer.** `team-charter.ts` is a localStorage store keyed `${teamId}:${field}`,
overriding the seed wholesale — the same shape as `entity-owners.ts`. `listGoverningTeams` derives
the teams for an entity by asking every team's *effective* charter, and `getGovernanceTeamDetail`
resolves its owned lists through the same `teamCharterIds`, so an application cannot claim a team
owns it while the team's page disagrees. `addGoverningTeams` / `removeGoverningTeam` own the
entity-kind → charter-field mapping, so no call site knows about it and a new governable kind is one
line in `TEAM_OWNED_FIELD`.

**The Owners tab gains the missing half.** An Add button in the toolbar and in the empty state, a
`TableSelectDrawer` for the picker (search, pagination, running selection and footer are identical to
the people picker; only the rows differ), and `RowActions` on team rows so they carry the same
info/remove pair the person rows do — a team row that could only be inspected next to person rows
that could be removed is what made this half read as a report rather than a list you maintain.

Two consequences of the charter becoming store-backed: `listGoverningTeams` is now read after mount
in `EntityOwnersTab`, and the governance-team detail page re-reads itself after mount and after its
Reviewers tab writes.

**Fixed while verifying, and it was the exact bug this design was meant to prevent:** adding a team
to an *onboarded* application showed on the application but not on the team, whose count stayed at 2.
`getGovernanceTeamDetail` resolved charter ids through `appById` — the seeded catalog only — so
onboarded applications were silently filtered out. `applicationRowById` now resolves either half of
the Directory.

Verified end to end: added IT Administrators to an onboarded application, confirmed the team's own
page reported 3 owned applications including it, removed it again and watched the store fall back to
its two seeded entries and the empty state return.
