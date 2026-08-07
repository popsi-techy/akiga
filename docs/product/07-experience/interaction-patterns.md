# Interaction Patterns (product-level)

*When and why* to use each recurring surface. The Design System later owns the *how* (the actual
components); this defines the product's expectations so every screen composes the same way.

## Navigation
Grouped left sidebar + top bar (search, notifications, persona switcher, Back to Workspace) +
breadcrumbs. Depth ≤ 3 (`module → list → detail`); detail uses tabs. See `03-information-architecture/`.

## Dashboards
- **Personalized and action-first**: top row = "needs my action" (pending approvals, due reviews,
  open violations for my scope). Then KPI tiles (from `metrics.json`), then risk highlights.
- Every tile links to the filtered list behind it. No metric without a definition.

## Tables / lists (the workhorse)
- Backbone columns: primary label · status chip · owner · risk (see `04-domain/data-dictionary.md`).
- Always support: search, column filters, sort, pagination, row selection, row actions, and a
  designed empty state. Row actions = legal state transitions for the persona.
- Density toggle (comfortable/compact) is expected for data-heavy screens.

## Task inboxes (Approvals, Reviews)
A specialized list: filter to "needs my action", per-row context (risk, requester, item),
inline approve/reject or certify/revoke, and **bulk actions** with a confirmation summarizing
counts. Approvals and Certifications **share this pattern** — don't diverge.

## Search
Global search (top bar) across identities, apps, entitlements, roles, requests. In-context search
scoped to the current list. Results show type + status + owner for disambiguation.

## Filters
Consistent filter bar above lists: quick chips for common states ("Needs my action", "High risk",
"Overdue") + an advanced filter panel. Filters are reflected in the URL for shareable views.

## Drawers vs. dialogs vs. pages
- **Drawer** (side panel): quick view/edit of one item without losing list context (e.g. request
  detail from the inbox). Preferred for peek-and-act.
- **Dialog**: focused confirmations and short forms (revoke, grant exception). Never for complex
  multi-step work.
- **Full page**: rich detail (identity, application), builders (role, workflow), and wizards.

## Wizards / multi-step forms
For access request, role definition, campaign creation, workflow building. Show step progress,
validate per step, allow back/save-draft, and summarize before submit. Never a single giant form
for these.

## Workflow / graph builder
Approval/provisioning workflows use a node-graph canvas (React Flow when appropriate) with a
palette of step types. Read-only graph view on approval/request detail to show the path.

## Detail pages
Header (name, status chip, risk, owner, key actions) + tabbed related entities + activity/history
tab. The header action set is state- and permission-aware.

> Reuse beats novelty: if a screen needs one of these surfaces, use the established pattern. A new
> pattern goes through the Design System first (per `AI_CONSTITUTION.md` §7/§9).
