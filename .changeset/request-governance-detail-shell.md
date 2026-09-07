---
"@akiga/design-system-app": minor
---

The Request Governance detail page gets the standard identity band and three tabs.

It was a bare `h1` in a centred column with a back link above it, and everything below stacked into one
long scroll — the summary you came for sitting on top of two trails you mostly did not. It now uses
`DetailShell`, the same frame every other detail screen in the product uses: resource mark, reference,
what the request is for, its SLA state, and the actions — then **Overview**, **Lifecycle** and **Audit
Trail**.

Three questions, one click each: what is this and how risky, where has it got to, who touched it. The
header stays put while you move between them.

**The back link is gone.** The app frame's breadcrumb sits directly above the header and already names
the list, so a second way back was the same navigation stated twice, four pixels apart — the rule
`DetailShell` has always stated and every other detail page follows. Checked the rest of the app for
the same mistake: the certification wizard's "Back" means *previous step*, and the workflow and
approval-policy builders' arrow returns you to where you came *from* (templates or details), which a
breadcrumb cannot express. Both stay.

`RequestSummary` is split out of `RequestDetailBody`, which keeps all three parts stacked for the
drawer — a peek is one scrolling column, and tabs inside a drawer would be navigation inside
navigation. `ResourceTypeAvatar` is split out of `ResourceTypeMark` so the header mark and the body's
resource row cannot drift.

**Lifecycle is drawn as a timeline, in the same language as the SoD review timeline**: a tinted node
carrying an icon for the stage's state, dashed connectors that stop either side of it, and each stage
as a card holding its own times, actor, note and approval hops. The old version numbered the nodes,
which said only where a stage sat in a list the order already conveys — an icon says what happened to
it — and left the stage's details as loose lines belonging to whichever heading was nearest above.

Both timelines now share **`TimelineItem`**: the rail was drawn twice, in two files, with two sets of
hand-written class names, and they would have drifted the first time either was touched. The shared
part stops at the node and the line, because the bodies genuinely differ — a decision card on one
side, a stage with its approval hops on the other. The SoD timeline renders unchanged on it.

Approval hops flip from grey to white, since the stage card has taken the grey they used to sit
against.

`SlaTimer` gains `showStatus`. With the SLA chip now in the identity band on every tab, the body would
have said "Breached" twice on one screen; the Overview keeps the countdown, the band keeps the state.
The list column and the drawer are unchanged.
