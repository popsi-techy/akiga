# Product Scope

The product is a **workforce access governance platform**. Its scope, in capability terms
(screens and components come later from the Design System):

## Capability areas
1. **Visibility** — a warehouse of identities, accounts, applications, and the access model
   (entitlements, groups, roles), all searchable and related.
2. **Access request** — self-service catalog with cart, justification, and multi-step approval.
3. **Approvals** — a unified task inbox with context, risk, and bulk actions.
4. **Certifications** — periodic access reviews with reviewer inboxes and bulk decisions.
5. **Policy** — SoD, approval, and provisioning policies with violation detection.
6. **Risk** — scoring surfaced wherever access decisions are made.
7. **Lifecycle (JML)** — automated access on joiner/mover/leaver events.
8. **Emergency access** — time-bound break-glass with mandatory review.
9. **Workflow** — visual orchestration of approval/provisioning steps.
10. **Reporting & audit** — dashboards, standard reports, exports, and an immutable trail.

## Boundaries
- Governs **workforce** identities (employees, contractors, service accounts) — not customers.
- **Simulates** provisioning and source systems; does not connect to real infrastructure.
- Is a **frontend prototype** that behaves like production software (see
  `00-foundation/scope-and-assumptions.md`).

See the full module decomposition in `modules.md` (mirrored in `product-modules.json`).
