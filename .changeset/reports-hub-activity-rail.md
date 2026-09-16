---
"@akiga/design-system-app": minor
---

**Reports hub: an activity band and a rail, in place of four tabs.**

The hub opened with a title and four tabs, and the tab row was wrong in two ways.

It read as four peers when only three of them were. Operational registers, compliance
packages and custom reports are things a reader *gets*; Schedules is the machine that
produces the second of them. A mechanism filed among its own output is what made the row
feel like a filing cabinet rather than a product.

And the page had no sense of time. `SAMA_Quarterly_Package` is enabled and its last run
**skipped** — a live subscription quietly producing nothing, which is the most important
sentence on this screen — and it took three clicks to find.

What changed:

- **Activity band** (`ReportsActivityBand`, three `StatTile`s): *Next download* — the next
  firing with its subscription and cadence; *Needs attention* — a count of findings whose
  hint names the worst one and whose link goes to it; *Last delivered* — the most recently
  sealed package, its reference and its seal, linking to the framework that holds it. This
  is not the KPI strip that was removed earlier: those tiles counted catalogued things and
  each belonged to one tab, while every one of these is an event with a destination that
  cannot be read off the catalogue below.
- **A rail instead of tabs** (`NavList`): Operational, Compliance, Custom reports, each
  carrying its size. It grows downward, so a fifth kind of report is a new line rather than
  a tab row that overflows, and it stays put while the content scrolls. Every report is
  still one click from the hub — the alternative considered, a Reports → Operational →
  register hop, bought nothing and charged a click on every visit.
- **One search over all three sections.** The field sits above the split, the rail counts
  become match counts, and results stay in their own section and their own shape. When a
  term matches nothing in the open section but matches next door, the empty state says so
  by name and count instead of implying the product has no such report.
- **Category chips on the register grid** (`QuickFilter`, counts, clearable): twelve
  registers narrow to three or four without leaving the grid.
- **Schedules moved to `/iga/reports/schedules`** (`SchedulesScreen`, was `SchedulesTab`),
  reached from the Next download tile and from any framework card. Its own `h1` and
  breadcrumbs; the next-run banner stays, above the table that produces it.
- **Live framework cards say how they are produced** — "Quarterly — next Oct 1, 2026", or
  "Not scheduled — sealed by hand". Readiness without a cadence is a screen; readiness with
  one is an artefact that will be mailed on a date.

Data (`data/reports.ts`): adds `latestSealedPackage`, `schedulesForFramework` and
`reportsAttention` (findings ordered by severity — a failed run, then a skipped run, then
clauses without evidence — each carrying the route that shows it).

Custom reports are now read once by the hub and passed down, so the rail's count and the
table under it cannot disagree.

No new Design System components: the band, the rail, the chips and the search field are
`StatTile`, `NavList`, `QuickFilter` and `Input` as they already exist.
