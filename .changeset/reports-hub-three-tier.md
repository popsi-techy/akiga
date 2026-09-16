---
"@akiga/design-system-app": minor
---

Reports becomes a three-tier hub, and Governance Analytics V2 moves inside it.

`/iga/reports` was in the navigation registry with no page behind it. It now holds the whole
reporting surface: the operational registers an administrator runs, the compliance packages
an assessor asks for, the custom reports for questions nobody pre-built, and the schedules
that produce packages unattended.

**No KPI strip.** It had one — next scheduled run, and clauses evidenced — and both facts
were true while neither belonged there. A summary at the top of a hub earns its height only
if it is about the hub, and those two were about one tab each: a reader on Operational spent
a sixth of the page on a compliance number they had not asked for, and a reader who wanted
that number had it in the one place it could not be acted on. Each moved to the tab that
owns it — the next firing sits above the schedule table it comes from, and readiness sits on
the framework card, where it is the reason to click rather than a figure with nowhere to go.
The landing page now opens on the registers themselves.

**Four peers, flat.** Registers, packages, custom analytics and schedules are the
same question at four altitudes, not a hierarchy. Treating them as a hierarchy is what
produced the old sidebar, where Governance Analytics and Governance Analytics V2 sat beside
Reports as though they were separate products. The active tab lives in the URL, so a link to
Schedules is a link to Schedules and Back behaves.

**Each tab owns its toolbar, and two of them turn out not to need one.** A shared filter bar
would be greyed out three quarters of the time — the schedule table and the register grid
have nothing to filter in common. But the register grid has no toolbar either: twelve cards
fit on one screen and each carries its category as a tag, so filtering narrows twelve things
to four and searching finds what is already in front of you. A control row that saves nobody
a scroll is chrome charging rent on the first thing the reader sees. It earns its place again
when the list is long enough that the answer is below the fold.

The Compliance tab lost its lead-in sentence for the same reason. "Choose a framework to see
what a sealed evidence package would contain" described three named cards sitting directly
beneath it, each with an arrow — the only line on the tab that told the reader nothing they
could not already see.

**Governance Analytics V2 is folded in rather than copied.** The Custom Analytics tab is the
saved-reports list and one Create report button; the create flow itself is untouched, so
choosing a template or starting blank still happens on the step that already has the
gallery, the search and the preview. A second, flatter copy of that gallery on the tab would
have given one choice two shapes, and whichever you used the other would be the stale one.

The sidebar entry is removed from the navigation registry, and every page under
`/iga/governance-analytics-v2/*` now roots its breadcrumbs at **Reports › Custom Analytics**
through one exported constant rather than four hand-written copies. A reader who arrives from
Reports was being told they were in "Governance Analytics V2" — a module that no longer
appears in the navigation at all, so the trail led somewhere they could not get back to.

It is positioned operations-first (JML drift, licence reclamation, orphan sweeps) with the
audit use — *Map to compliance package* — riding on the report row rather than leading the
page, because mapping is a claim about one report answering one clause and has to start from
a row that names one.

**Compliance framework detail** (`/iga/reports/compliance/[id]`) gets three things the
screenshots did not have:

- a **pre-audit gap banner** above the clause table, naming how many gaps there are and what
  the package would seal as, opening a drawer that groups them by *what is wrong* — nothing
  attached versus attached-but-incomplete need different fixes, and a list sorted by clause
  number interleaves them;
- **inline evidence mapping** — an empty "Evidenced by" cell carries an Attach evidence
  button rather than a dash, because that empty cell is the problem the page exists to
  solve. The picker is multi-select: a clause like "periodically user access rights should be
  reviewed" is answered by two registers together, which is why the old matrix listed the
  same clause twice under E05 and E06;
- **Seal package** as the page's one primary, in the header on both tabs. It replaces a whole
  *Generate package* tab that held one button and a list the coverage matrix already shows in
  more detail. The modal states the window, what the seal will say, and that gaps do not
  block it — a package that cannot be produced until every clause is green is a package
  nobody can produce.

Two smaller decisions worth recording. The coverage numbers are **filter chips, not KPI
tiles**: four tiles whose only use is to narrow the table below them should be the narrowing
control, and the row they occupied goes to the clause list. And the requirement column
**wraps rather than truncates**, against the house default — the text is quoted verbatim
from the published framework and an assessor reads it against their own copy, where half a
requirement is not a shorter requirement but a different one.

**One status vocabulary.** `REPORT_STATE` maps every state in the module to a chip intent in
one table, and `ReportStateChip` is the only thing that reads it. The screenshots had
"Launched" blue in one table, "Partial" yellow in another and "Skipped" grey in a third, each
decided at its own call site. Partial is `warning`, not a literal orange: the visual language
reserves brand orange for selection and the current step, so a status may not spend it.
Anything catalogued but not built — ISO 27001, PCI DSS v4.0, JML Drift Analysis, the Admin
Audit Report — renders with a Coming soon tag and keeps its place, because the set of things
this product will answer is itself information.
