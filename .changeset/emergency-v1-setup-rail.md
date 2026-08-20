---
"@akiga/design-system-app": minor
---

Emergency Access V1 loses its Setup page: the checklist now docks beside the work.

A draft V1 profile used to open on a **Setup** tab holding the whole checklist. That put the list
and the work on separate screens, which is the one thing a checklist is for — read what is missing,
leave for the tab that fixes it, come back to see what is left, once per step. The tab is gone. In
its place `EmergencySetupRail` sits to the left of whichever tab is open, so a step can be ticked
and the next one become current without navigating back to a summary.

**It is chrome, not a card.** The rail runs full height, from the header's rule to the bottom of the
viewport, with a single border on its right and no rounding, no shadow, no gap. The page body goes
full-bleed (`-mx-8 -mb-6` cancels the layout's padding, which comes back inside the content column)
so the rail actually reaches the edges — a docked column that stopped short of either would read as a
widget sitting on the page rather than part of its frame. The header draws its own rule only when the
rail is there, because that rule is the horizontal half of the boundary the rail's border completes;
the two meet and read as one continuous line.

**V1 has no tab strip at all — the rail is the navigation, in both states.** The strip and the rail
were the same list: on a draft, once Overview and Sessions drop out, the tabs were Assignments,
Eligibility criteria, Owners and Advanced configuration — exactly the rail's routable rows, in the
same order, stacked directly above them. Two controls for one set of destinations only makes the
reader work out whether they differ.

The rail is the one that survives because a vertical list has room a strip does not: per-row
completion, a grouping that separates what gates activation from what does not, counts that do not
compete with the label for horizontal space, and a row for Basic details, which was never a tab. It is
a `nav` rather than an `aside` now, since it is the region's navigation and not something alongside
it. The header's rule stays either way, so the frame does not change. V2 and V3 still navigate in
tabs, unchanged.

So `EmergencySetupRail` becomes **`EmergencyDetailRail`** — and there is one list, not one per state.
A live profile shows the same grouped, ticked rows a draft does and simply gains the sections that are
not setup steps (Overview, Sessions) above them. Activating a profile therefore does not restyle its
navigation, it appends two rows.

Keeping the ticks live is the point rather than a side effect: "this active break-glass profile still
has no owners" is exactly the governance gap an admin should see without opening anything, and it is
invisible in a flat list of section names.

Nothing in the rail is a hand-kept list. Steps come from the step definition, non-step sections from
the same `tabsFor` list the strip would have rendered, so the rail cannot offer a section the page
does not have or miss one it does. Each side brings its own label, which is why the wording does not
shift from "Eligibility criteria" to "Eligibility Criteria" when a profile is switched on.

Counts now show in both states. The strip used to carry them and the draft rail had quietly dropped
them; a draft filling in assignments wants the running total as much as a live profile does. The tick
says whether a step is done, the number says how much is behind it.

**No title above the list, in either state.** "Set up this access / Finish the required steps, then
activate." restated what the page header, the Draft chip and the Activate button already said between
them, and spent 60px of column height doing it. The group headings name what the rows are, and
`aria-label` carries the rail's identity for anyone who cannot see the grouping.

Counts render as a plain trailing number rather than `(8)` appended to the label or a pill. The
parenthesised form is `Tabs`' formatting to own, and the pill is `NavList`'s — that component switches
panes *inside* a section, so borrowing its badge would give page-level and pane-level navigation the
same weight.

**Fixed on the way through:** the `basic` setup step declared `tab: 'overview'`, a value a real section
uses, even though the step opens a drawer and every caller special-cases it by id. A rail listing both
therefore showed the Overview section under the name "Basic details" and lit it as current. It is now
`tab: 'basic'`, which matches nothing — the actual requirement the field had.

With the strip gone, the current row is the page's only location indicator, so it carries
`brand.subtle` — the tint the product sidebar uses for its active item, the same idiom for the same
job. A neutral tint was enough while an orange tab indicator sat above it; alone, it has to hold that
weight. Hover stays neutral so it reads as "reachable", not as "here".

The fill is white and the right border is the only thing separating the rail from the content — a
deliberately quiet frame, since the dock is where the reader looks *between* steps, not the thing
they are working on, and a tinted column would give a navigation aid more weight than the table
beside it. The rail's header carries no rule either: that border already says where the dock ends,
and a second line 60px in would divide a column holding only a title and the list it titles.

Which makes the current step the tinted one, in `background.subtle` — on a white rail it has to be,
since a white highlight on white is none at all. Not brand orange: the page has already spent orange
on the Activate button and the tab indicator, and the strip is where "which section am I in" gets
answered loudly (visual language §5.1). Hover lands on the same tint, so the gesture previews its own
result.

At 1280 and up the five tabs fit beside the dock. Below roughly 1230 the strip starts scrolling with
MUI's arrows — the DS `Tabs` behaviour on any narrow window, not new here, just reached sooner now
that 264px went to the rail.

**A V1 draft now has no Overview tab at all.** Dropping it is the point — with setup docked, there
is no summary page left to return to, and leaving an empty tab would advertise one. The tab comes
back the moment the profile is live, where Overview is a real summary (sessions, limits, timeline)
and has nothing to do with setting up.

**No draft has a Sessions tab either**, on any version. A session exists only because someone
requested this access, and nobody can request a profile that has never been switched on — so the tab
could only ever hold an explanation of why it is empty. Naming the state in the strip and then
charging a click to read an apology is worse than not offering it; the tab appears, with real rows
behind it, when the profile goes live. `DraftSessionsEmptyState` is deleted with it. A V1 draft's
strip is now exactly the rail's four routable steps, which is the alignment the two should have had
from the start.

Which tabs exist therefore depends on state, and a value can stop being offered underneath the
reader: deactivating removes Sessions, and on V1 Overview as well, while both are legitimately
current beforehand. Rather than keep naming the vanishing tabs — the list has changed twice already —
the page asks the strip whether it still lists the current value and falls back to the first
unfinished step when it does not. Verified against the case the old `overview`-only guard missed:
sitting on Sessions of a live profile and deactivating it now lands on the first unfinished step
instead of a blank pane.

**Status and navigation only — no second Activate.** The page header owns activation; the rail ticks
rows and routes to them. An Activate in its footer would have put two of the same button a step apart.

**And the header's button goes back to being a button.** It used to carry a progress ring and a
"N required steps to activate" label, from when the header was the only place a reader could learn how
far the setup had got. The rail reports that now, step by step, so the ring was the same state said
twice — and the half that got crowded out was the button's actual job, which is the one action. It is
now a plain `Activate`, simply disabled until nothing blocks; the tooltip still names what is missing.
`ProgressRing` and `EA_REQUIRED_STEPS` drop out of the file with it.

Steps are grouped under **Required to activate** and **Recommended** instead of carrying a danger
asterisk each. That says required-ness once rather than three times, and answers the question the
asterisk only hints at — required *for what*. `sr-only` text carries the same distinction where the
grouping is visual. `Basic details` opens the same drawer the header's button does; every other row
is a tab.

The "Default applied" qualifier sits under its step label rather than beside it: at 260px a chip on
the same line spends 90px of a 200px run and truncates *Advanced configuration* to an ellipsis. The
qualifier is worth less than the name of the step.

`EmergencySetupCard` is deleted. Every version now guides setup somewhere else — V1 in the rail, V2
in its wizard, V3 in the floating bar — so no draft could reach it any more, and `OverviewTab`'s
`isDraft` branches were guarding a state that can no longer occur. V2 and V3 are unchanged.
