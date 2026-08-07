# Reporting Catalog

The standard reports the product provides. Reports are **evidence** — for auditors, admins, and
owners. Each draws on defined metrics (`metrics.json`) and entities.

| Report | Purpose | Audience | Key contents |
|--------|---------|----------|--------------|
| **Access Overview** | Who has what, org-wide | admin, auditor | Identities × entitlements/roles, filter by app/dept/risk |
| **Entitlement Holders** | Who holds a given entitlement/role | owners, auditor | Holders, since when, provenance, last used |
| **Certification Summary** | Campaign outcomes & evidence | auditor, admin | Completion %, certified/revoked counts, reviewers, timestamps |
| **SoD Violations** | Conflict exposure & aging | admin, auditor | Open/resolved, severity, mean age, exceptions |
| **Access Requests** | Request throughput & SLA | admin | Volume, time-to-access, approval turnaround, rejection rate |
| **Risk Exposure** | High-risk access concentration | admin, auditor | High/critical grants, top risky identities/entitlements |
| **Dormant & Orphan** | Cleanup targets | admin | Dormant entitlements, orphan accounts, disabled-not-deleted |
| **Lifecycle (JML)** | Lifecycle automation health | admin | Events by type, automation rate, exceptions |
| **Emergency Access** | Break-glass usage & review | admin, auditor | Grants, durations, reviewed vs. unreviewed |

## Conventions
- **Every report is filterable and exportable** (CSV/PDF export is simulated but behaves real).
- Reports **reuse the table pattern** and the same status/risk components as the rest of the
  product — a report is a saved, exportable, filtered view, not a bespoke screen.
- Reports are **read-only** and available to personas per the permission matrix (auditors: all).

> New report → confirm it's built from existing metrics/entities and reuses the table pattern
> before adding a bespoke visualization.
