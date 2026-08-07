# Sample / Seed Data Strategy

The canonical, deterministic mock dataset every prototype screen shares — so the product always
depicts one coherent, believable organization. Defines the *shape and principles*; the actual
fixtures live with the implementation (`packages/core`) and conform to `entities.json`.

## The fictional organization ("Northwind-style" default)
A mid-to-large enterprise, sized to exercise real UX:
- **~500 identities** across ~8 departments (Engineering, Finance, Sales, HR, IT, Legal,
  Operations, Support), a realistic manager hierarchy, a mix of **employees, contractors, and
  service accounts**, and a handful of **leavers/movers** in-flight.
- **~15 applications** of varying criticality, each with a **connector** and realistic sync state
  (incl. one in `error`).
- **Entitlements, groups, roles**: hundreds of entitlements, ~30 roles (business/technical/
  birthright), with intentional **risk spread** and a few **privileged** ones.
- **Live governance data**: open access requests across all states, pending approvals, an active
  and an overdue **certification campaign**, several **SoD violations** (open/mitigated), an active
  **emergency grant** with a countdown, and recent **JML events**.

## Principles
1. **Deterministic** — the same data every load (no `Math.random()` at runtime; seed-based). This
   is required (see `AI_CONSTITUTION.md` §13.2) and makes screenshots/tests stable.
2. **Coherent** — relationships resolve (every ownerId, managerId, applicationId points to a real
   record). No dangling refs except *intentional* orphans.
3. **Edge-cases on purpose** — include the cases screens must handle: an orphan account, an
   ownerless entitlement, a high-risk request with an SoD conflict, an overdue approval, an empty
   reviewer inbox for one persona, long names, and unicode.
4. **Volume for realism** — enough rows to force pagination, filtering, search, and virtualization
   to matter.
5. **Persona-ready** — data supports logging in as each persona and seeing a meaningful, correctly
   scoped view (a manager with reports and approvals; an auditor with org-wide read; an end user
   with a few requests).

## What it powers
Realistic dashboards, populated tables, believable detail pages, and every state in
`state-experience.md` (including the empty/loading/error states) — without a backend.

> No real people, companies, emails, or PII. Fictional but plausible. When adding a screen, extend
> the seed to cover its states rather than faking data inline.
