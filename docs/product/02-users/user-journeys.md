# User Journeys

The end-to-end, cross-persona flows the product must support. Source of truth:
`registries/product/journeys.json`. These are the scenarios every set of screens must complete —
not isolated pages, but flows that hand off between personas and change entity state.

## The flagship journey: Request → Fulfillment
```
End User            System              Approver            System
  │ browse+cart       │                   │                  │
  │ submit ─────────▶ │ policy check      │                  │
  │                   │ (SoD, risk) ────▶ │ review w/ context│
  │                   │                   │ approve ───────▶ │ provision (sim)
  │ ◀───── notify ────┼───────────────────┼───────────────  │ fulfilled + audit
```
**Screens implicated:** catalog (search/filter), cart, request form (justification, duration),
SoD warning, approval inbox, approval detail, provisioning progress, notifications. This one
journey exercises most of the Design System's patterns — build it first (Phase 2).

## Journey catalog
| Journey | Personas | Why it matters | Signature UX |
|---------|----------|----------------|--------------|
| **Request → Fulfillment** | End User, Manager, App Owner | The core loop | Catalog, cart, approval inbox, provisioning |
| **Certification Campaign** | Admin, Reviewer, Auditor | Audit readiness | Campaign progress, reviewer inbox, bulk actions |
| **Joiner** | Admin, Manager | Lifecycle automation | Event timeline, birthright preview |
| **Mover** | Admin, Manager | Access hygiene on transfer | Before/after access diff |
| **Leaver** | Admin, Manager | Close attack surface | Deprovisioning checklist, orphan detection |
| **SoD Remediation** | Admin, Auditor | Risk control | Conflict detail, remediate vs. exception |
| **Emergency Access** | End User, Admin | Break-glass with control | Countdown, mandatory review |
| **Role Definition & Assignment** | Role Owner, Admin | Scalable access | Role builder, SoD/risk impact preview |

## Design implications
- **Journeys cross personas** — the same request object appears differently to requester,
  approver, and auditor. Design the *object's* views per persona, not one-size-fits-all.
- **State hand-offs need feedback on both sides** — the requester sees "pending", the approver
  sees a new task, both driven by the same transition.
- **"Needs my action" is the universal entry point** — every persona's dashboard leads with their
  slice of these journeys (pending approvals, due reviews, open violations).

> Full step-by-step (actor, entity, resulting state) for each journey: `journeys.json`.
