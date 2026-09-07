---
"@akiga/design-system-app": patch
---

The Governance Teams half of an entity's Owners tab stops being a dead end.

Its empty state says team ownership is assigned on the team, and then left the reader to find the
team. It now offers **Browse Governance Teams**, going to the list.

There is still no Add button, and that is the data model rather than an omission: a team's charter
lists the entities it governs (`listGoverningTeams` filters teams by whether their charter includes
this entity), so this half of ownership is a projection of team records. There is nothing on the
application to write to, and an Add here would be one entity's screen editing another entity's
record. Secondary rather than primary, because the action leaves the entity rather than acting on it.
