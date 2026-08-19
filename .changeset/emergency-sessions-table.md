---
"@akiga/design-system-app": minor
---

The Sessions tab is a real table of who has used the access.

It was the generic "not built yet" placeholder, and the one tab where that cost something: break-glass is
judged after the fact — the whole point of a profile is that someone can grant themselves something
dangerous — so the record of who did is the control, not a nice-to-have.

Three columns and no more: **Requester** (avatar, name, role and app), **Status**, **When**. Verified with no
horizontal overflow on `layout="fixed"` with a width declared per column, and `fillHeight` so the body
scrolls under a sticky header with pinned pagination — the list archetype, same as every other table here.

**No computed duration.** The seed carries `when` as a rendered string ("Ongoing · Ends in 4 hrs"), not an
instant, so there is nothing to subtract. Deriving an hours figure from display text is how a number nobody
can defend ends up in an audit view.

**An ongoing session is `success`, not `warning`.** Someone holding break-glass right now is the system
working as designed; tinting it as a problem would teach a reviewer to read every live session as an
incident.

**Rows open the person, not the session.** A session is an event with nothing behind it; the identity is
where a reviewer goes next, and a row that cannot be opened is the dead end this page's own rule forbids.
`EASessionView` gained `identityId` for that — it was already in the seed and simply not carried through.

Drafts keep their own empty state, which explains that nobody can request the access until it is switched on.
