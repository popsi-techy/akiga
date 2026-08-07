# Scope, Assumptions & Non-Goals

## In scope (what we build)
Workforce access governance across connected applications:

- **Identity lifecycle** — Joiner / Mover / Leaver automation.
- **Access request & approval** — self-service catalog, cart, multi-step approvals.
- **Access model** — entitlements, groups, roles (incl. role-based access).
- **Certifications** — periodic access reviews / attestation campaigns.
- **Policies** — Separation of Duties (SoD), approval policies, provisioning policies.
- **Risk** — scoring for entitlements, roles, identities, and requests.
- **Emergency access** — break-glass, time-bound elevated access.
- **Workflows** — visual orchestration of approval/provisioning steps.
- **Reporting & analytics** — dashboards, standard reports, exports.
- **Audit** — immutable activity trail and evidence.

## Out of scope (explicit non-goals)
The product *models* these concepts but does **not** implement them for real:

- Real provisioning/deprovisioning to live systems (connectors are **simulated**).
- Authentication, SSO, MFA, or session management at runtime.
- Consumer/customer identity (CIAM).
- Privileged session recording / vaulting (full PAM).
- Real backend, database, or cloud infrastructure.
- Real HR/directory integration (source systems are **mocked**).

## Assumptions (enterprise defaults, changeable via PDR)
- **Audience:** medium-to-large enterprise; hundreds–thousands of identities in sample data.
- **Persona-driven, permission-aware UI:** every action respects the capability matrix.
- **Frontend-only prototype:** all behavior is mocked with deterministic local data; business
  logic is simulated to feel production-real (latency, validation, state transitions).
- **English-first**, i18n-ready (no hardcoded copy patterns that block translation).
- **Desktop-first, responsive** — primary use is a knowledge worker at a desk; layouts must not
  break on smaller viewports.
- **Light theme first**, dark theme derived later.

## What this means for anyone generating UI
- Build against the **mocked data-access layer**, never real APIs.
- Treat connectors, provisioning, and source systems as **realistic simulations** with states
  and delays — not as no-ops.
- Never introduce real auth, secrets, or PII.

> Anything genuinely ambiguous goes to `12-decisions/open-questions.md`, not into a silent
> assumption.
