---
"@akiga/design-system-app": minor
---

Add Governance Analytics V2 at `/iga/governance-analytics-v2` — a second take on how a report is
configured, beside V1 rather than replacing it.

V1 defined a report as scope + filters + plots + sections, three of which were global: a reader who
added "risk above 75" could not tell whether it narrowed the permissions table, the charts, or the
whole document, so the answer was "everything", and a filter that belonged to one table silently
rewrote the rest. V2 moves configuration **into the section**. A report is four global answers —
name, description, what part of the organisation, what period — and then a list of sections, each of
which brings its own columns, its own filters and its own charts. Every section prints what it was
narrowed to under its own title.

Four screens: a reports list; a template gallery with the same shape as the workflow and email ones —
banner with search, a "start from scratch" link, a category rail, and a card grid, with one built
template (Access Posture, which opens the sample report through a preview modal) and one holding its
place as coming soon; a single
configuration screen (not a wizard — the whole definition fits on one page, and a summary rail shows
the sentence the report is about to become); and the report itself, where Edit opens a right dock
whose changes land in the document as they are made. In edit mode each section grows a grab handle
and a pair of move buttons — both, because a drag handle alone puts section order out of reach of
anyone without a mouse — and sections can be added and removed. Only the handle is `draggable`, so a
document people are reading keeps its text selection.

The section catalogue is data (`SECTION_CATALOGUE`), not components: a third section is an entry in
that array, and the create screen, the edit dock and the renderer all pick it up. Rows and charts are
derived from the product's own domain data — the same entitlements, accounts and SoD rules the
Directory and SoD screens read — so a report never contradicts the screen a reader checks it against.
`Rule breaks` joins the directory catalogue to the SoD one on name + application, because the two
seeds describe the same permissions without sharing keys, and counts distinct rule codes rather than
instances.

Adds `ORGANIZATION_NOUN` alongside `ORGANIZATION_LABEL` — a label written for a picker ("By
department") reads wrong in a column, so the two strings are two records.
