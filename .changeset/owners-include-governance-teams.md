---
"@akiga/design-system-app": minor
---

"Who owns this" gives one answer everywhere: named individuals **and** the Governance Teams
accountable for the entity.

Every surface asked only for individuals, so an entity a team had just taken on still read as
unowned. The applications list showed **+ Add owner** next to an application the Compliance Team
answers for; the application Overview's own "Needs attention" block said **Nobody owns this
application** about it; and searching the list by a team's name found nothing.

`entityAccountable(entityType, entityId, seedOwnerIds)` returns both halves, each tagged `person` or
`team`, and is now the single source for all of them. Individuals come first — a named person is the
more specific accountability, and that is the order a truncated cell keeps.

**The list cell shows both, and the shape says which.** A person is a round mark, a Governance Team a
square one, per the avatar rule. That is the reason both belong in one cell rather than two columns:
"who answers for this" is one question, and whether the answer is a human or a body is worth seeing
at a glance. Search matches team names too. **+ Add owner** now appears only when neither half has
anyone in it — which is also when the Overview's ownership warning fires, since a team answering for
an application is real accountability.

**Three more pages had the same defect, plus a second one.** The Owners count on the entitlement,
technical-role and business-role detail pages read `ownerIds.length` straight off the seed, so it
ignored the Governance Teams *and* every individual added or removed since — the Overview said 1 while
the Owners tab beside it listed 3. All three now read `entityAccountable` after mount, so the count is
the number the Owners tab breaks down. Verified on `ent-gw-admin`: Overview reports 2, the rail shows
1 individual and 1 team.

Fixing one instance of this would have left three surfaces disagreeing with the two that were fixed,
which is how the original drift happened.
