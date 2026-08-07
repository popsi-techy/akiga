# Roadmap & Phasing

Build order for the IGA Product, once the Design System exists. Prioritized so each phase is
demoable and later phases reuse earlier foundations. **MoSCoW** = Must / Should / Could / Won't
(now).

## Phase 0 — Shell & foundations (Must)
Workspace entry, app shell (navigation, top bar, Back-to-Workspace), theme provider, auth mock
(login/logout), the data-access layer + seed data, and the core Design System primitives in use.

## Phase 1 — Visibility (Must)
Read-first modules that prove the data model and navigation:
- **Dashboard** (KPIs, pending actions, risk highlights)
- **Identities** (list + detail, accounts/entitlements/roles tabs)
- **Applications** (list + detail)
- **Access catalog** (entitlements, groups, roles — browse/search/filter)

## Phase 2 — Access request & approval (Must)
The core loop:
- **Access Requests** (catalog → cart → submit, multi-step form)
- **Approvals** (task inbox, approve/reject with context, bulk actions)
- Basic **Workflows** consumed by approvals (visual view, not full builder yet)

## Phase 3 — Governance (Should)
- **Certifications** (campaigns, reviewer inbox, bulk certify/revoke)
- **Policies** (SoD definitions, **SoD violations** list & remediation)
- **Risk** (scores surfaced across identities/entitlements/requests)

## Phase 4 — Lifecycle & advanced (Should)
- **Lifecycle (JML)** events and automated access changes
- **Emergency access** (break-glass request → time-bound grant → auto-expiry)
- **Workflow builder** (React Flow) for approval/provisioning orchestration
- **Roles** management incl. role definition/assignment

## Phase 5 — Evidence & scale (Could)
- **Reports & Analytics** (standard reports, exports)
- **Audit** (full activity trail, evidence export)
- **Administration** (connectors/integrations config, org settings, delegation)

## Won't (now)
Real connectors, real auth, PAM sessions, CIAM, multi-tenant admin — see non-goals in
`scope-and-assumptions.md`.

> Guidance for AI: when asked to "build the next thing" without specifics, build the
> lowest-numbered incomplete **Must/Should** item, reusing existing Design System foundations.
