---
"@akiga/design-system-app": minor
---

Governance Analytics — evidence-backed report generation. Renames the Governance Explorer placeholder
and builds the Department template end to end.

**Reports are derived, not mocked.** Every KPI, plot series and table row is computed from the
product's own domain data — the same identities, app accounts, entitlements, policies, governance teams
and findings the Directory, Policies and SoD screens read. A reporting feature with private numbers is
a screenshot: it eventually tells a reader that Finance has 182 SAP users while the Applications page
says nine, and the first auditor to notice ends its usefulness. The cost is a join layer and numbers
only as large as the seed really is; the benefit is that a report cross-checks against the screens it
describes. Risk tiers come from `@/lib/risk`, never re-thresholded, so "High" means the same thing here
as everywhere else.

**Scope is not a filter.** `scope` answers "what am I analysing?"; `filters` answer "which subset?".
Separate fields, and every plot prints both at its foot — a governance chart read against the wrong
population is worse than no chart.

**Save is generate.** One action validates, stamps `updatedAt` / `lastGeneratedAt` / `dataAsOf`
separately (three fields because an auditor asks three different questions), and re-derives. There is no
Generate button, because a report that could be saved ungenerated would put a row on the list whose
numbers nobody has produced.

**The configuration panel docks left**, 400px, and the report reflows into the remaining width rather
than being covered — you are editing the thing you are looking at. Row detail opens on the *right*, so
the two surfaces are told apart by which edge they come from rather than by reading them. Add plot and
add section are second-level views inside the same panel, not overlays. The panel edits a deep clone:
Cancel discards, only Save commits.

Assembly is Governance Summary → a synthesized "Governance insights" plot band → remaining sections in
order; numbers are computed after assembly, never stored, so disabling a section does not leave a gap
where the reader expects one. No plots enabled omits the band entirely rather than rendering an empty
chart area.

New DS component: **`BarChart`** — horizontal ranked comparison, the sibling of `DonutChart` and not
interchangeable with it. Built from divs rather than SVG so labels and values stay real text.
Registered with a docs page.

Three bugs caught while building it, each from the same root cause — inventing a value to satisfy a
renderer:

- Governance findings state a severity *tier*; they were being converted to plausible scores (high → 75)
  to reuse the risk column, and `riskTier()` puts 75 in the **critical** band, so every High finding
  displayed as Critical. Severity is now its own column type rendered through the existing
  `SeverityChip`.
- The template seeded every plot's `chartType` as `'donut'`, overriding each plot's natural shape and
  turning Application Usage — a ranked list of application names — into five near-identical wedges.
  `chartType` is now the reader's *override*, null meaning "the plot's own shape".
- Usage bars were coloured off the status ramp, which made SAP red and Snowflake grey. In a governance
  report that reads as "SAP is the dangerous one" when the chart is only counting accounts. One colour
  for a single series.

Also fixes a latent deploy failure: the new workspace route reads `useSearchParams` and needed the
Suspense boundary the other two such pages already carry. Without it the production build fails at
*export* rather than compile, which is how it reaches a deploy.
