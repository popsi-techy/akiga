---
"@akiga/design-system-app": minor
---

Rebuild the body of a Request Governance request as a flow board: the cart as a rail on the left, the
selected line's approval flow as a canvas on the right.

It replaced a table of cart lines, which answered "what is on this request" and nothing else. The
flow each line is moving through — which stage, who is holding it, how long it has been there — was
one cell of prose per row, and reading it meant opening a drawer per line and holding four drawers in
your head. Now the cart is the picker and the flow is the page: a rail card carries four facts (what
it is, its risk, how far along, how long is left) and the canvas carries the rest. The first line is
selected on arrival, and `?item=` is a deep link into the rail rather than a second surface, so the
detail page no longer opens a drawer over itself.

The two columns are a docked split, not a pair of cards on a page: one rule down the middle and both
sides bleeding to the page edges. Giving each column a border and a gutter as well spent about 60px
of the canvas on chrome that said nothing. Only the canvas closes its opening band with a rule — the
rail's separator is a search field, which narrows the rail and nothing else, so a line you are
reading stays on the canvas after you type it out of the list. It appears only on a cart of more
than one, where there is something to search.

The canvas draws **approval levels only**. Submission, the policy and SoD check and provisioning are
not decisions anybody makes, and putting them on the same ladder as "Elena Vasquez approved this"
made three quarters of the diagram machine steps a reader scrolls past to reach the one part with a
person in it. Each level carries its evidence: who, when, the justification they typed, and any files
they filed with the decision (`ApprovalHop` gains `attachments`). "Approved" on its own is a state;
the sentence and the sign-off are what make it an audit record.

It also draws **only as far as the chain has actually got**. A level nobody has reached is not shown,
because an approval chain branches on what the level before it decided — a rejection ends it, an SoD
conflict inserts a security review — so the rest of the ladder is a route nobody has taken and may
never take. The whole chain appears exactly when it becomes a fact: once every level has decided. The
board says why it stops rather than leaving an absence that reads as a page which failed to load, and
the header refuses to claim a total until there is one.

The chain is drawn on the shared `TimelineRail` — the same dashed column of dated nodes the SoD
review and the request lifecycle use, since an approval chain is that object and drawing a third set
of connectors by hand would be the same idea in three files. The cards keep their white surface; the
rail supplies the marker and the line. `TimelineItem` gains a `ground` prop, because its node halo
paints the page colour to hide the dash behind it and this canvas sits on the subtle ground rather
than on white. **Time lives where it is true.** An entry led with its own timestamp until a level had three
approvers deciding on three different days, and then the one instant at the top was a summary no
single moment could honestly give — and it was whichever answer happened to sit first in the array.
An approver's decision time now sits on their own card, and a level's opened-and-closed times are its
footer, because a level opens once and closes once however many people decided in between. A settled
level with one approver drops the footer entirely: it closed at exactly the moment its only approver
answered, so "Closed 1:05 PM" under "Approved 1:05 PM" was one instant printed twice.

A level can be decided by a **group**. `ApprovalHop` gains `approvers`, `completionRule` and
`requiredApprovals`, using the approval-policy builder's own vocabulary (`all` / `anyOne` /
`majority` / `threshold`) so a level configured as "Any one approver" there does not read as
"1 of 2 required" here. Every approver is listed with their own decision, justification and files —
a level satisfied by any one of two still owes the reader the second person and what they did not do
— and `hopApprovers` reads a single-approver level as a list of one so no renderer branches on which
field the record used.

The canvas runs **top to bottom**. A request's stages are a sequence in time, a column reads as one,
and a row puts the fourth stage off the right edge of any screen narrow enough to matter. And the stage in play wears
its condition on its own left edge so the one node that needs attention is findable without reading
every chip on the way down. The flow sits on the subtle ground the workflow builder's canvas uses, so the
two canvases in the product are one idea, and a node carries at most one signal on its 1px edge:
orange for the node you are reading (§5.1.3, selection) and yellow for the stage in play. Selection
wins when they land on the same node — the flow already says which stage is live in its chip, and
nothing else on the board says which node the open panel belongs to. Clicking a node docks a panel beside the flow and below the header, so the
header keeps saying which line is on the board while a stage is open.

Also fixes a contradiction the old table hid. `viewForItem` re-stated the request's stages for a cart
line at a different stage but kept everything recorded on them, so a line that had already cleared
policy printed "Cleared" over the request's note saying evaluation was still running, and a line that
had not reached approval showed decisions nobody had made for it. A re-stated stage now keeps its
identity and its new state and nothing else; the canvas says so plainly until the seed gives each
cart line its own stage records.

A level card is a **container with an overlay control**, not a control wrapping content. It holds an
attachment list whose row menu is itself a button, and a button inside a button is invalid HTML —
React refused to hydrate it on every load. The select affordance is now a transparent layer over the
whole card, with the content above it but transparent to the pointer, so clicking anywhere still
opens the panel and the file menu still opens.

Removes `RequestOverview`, the table the board replaces.
