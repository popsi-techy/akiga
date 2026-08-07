# Core Capabilities

Conceptual definition of each headline capability. These map to modules (`modules.md`) and to the
`feature-catalog.json` registry.

| Capability | What it does | Key entities | Primary personas |
|-----------|--------------|--------------|------------------|
| **Identity warehouse** | Central view of every identity and its access footprint | identity, account, entitlement, role | administrator, auditor, manager |
| **Application registry** | Catalog of governed applications and their access | application, entitlement, account | application-owner, administrator |
| **Access catalog** | Browsable, requestable entitlements/groups/roles | entitlement, group, role | end-user, manager |
| **Access request** | Request access with justification; policy-checked | access-request, approval-task | end-user, manager |
| **Approvals** | Decide requests with risk/context; delegate; bulk | approval-task, workflow | manager, application-owner, role-owner |
| **Certifications** | Periodic review of who has what; certify/revoke | certification-campaign, certification-item | access-reviewer, manager, auditor |
| **SoD policy** | Define & detect conflicting access combinations | sod-policy, sod-violation | administrator, auditor |
| **Risk scoring** | Score access & requests to focus attention | risk-factor (+ scores on entities) | administrator, auditor |
| **Lifecycle (JML)** | Automate access on joiner/mover/leaver | lifecycle-event, identity | administrator, manager |
| **Emergency access** | Time-bound break-glass with review | emergency-access-request | administrator, end-user |
| **Workflow** | Visual approval/provisioning orchestration | workflow, approval-policy | administrator |
| **Reporting & analytics** | Dashboards, standard reports, exports | (aggregates all) | auditor, administrator |
| **Audit** | Immutable evidence of every action | audit-event | auditor, administrator |

> Each capability is a *reason to build a set of screens*, not a screen itself. The Design System
> supplies the building blocks; the IGA Product assembles them per capability.
