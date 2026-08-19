---
"@akiga/design-system-app": patch
---

Eligibility Criteria — the add action moves to the toolbar.

The grid led with a dashed "Add Eligibility Criteria Group" card that occupied a full cell in the first
position, so the reader's first group sat second and every row's alignment was set by a control rather than
by content. It is now the primary button opposite the search, where every other list in the product keeps its add
action — the one thing you come to this tab to do.

Worth recording the tension, since the visual language allows a screen exactly one primary: on the profile's
Eligibility Criteria tab this is the only filled orange button, which is correct. Inside the creation wizard
the same component renders alongside the footer's "Save and continue", so that step shows two. Owner's call,
made deliberately; if the wizard reads badly, the fix is for the tab to take a prop and step down to
`secondary` there rather than demoting it everywhere.

The card's explanatory copy went with it, along with the help sentence that used to sit right-aligned in
the toolbar — the button now occupies that slot, and "Users matching any group below can request this
emergency access" was restating what the tab is.

`EligibilityAddCard` is deleted rather than left unused, and `OUTER_RX` with it — that constant existed
only to keep the card's SVG dash outline in sync with its corner radius.

The empty state is untouched: with no groups at all the tab still renders its own centred prompt and a
primary "Create Eligibility Criteria Group".
