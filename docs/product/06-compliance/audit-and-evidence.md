# Audit & Evidence

Auditability is a core product function, not a log file. It shapes nearly every mutation.

## What must produce an audit event
Every governance action: request submit/decide, provision/deprovision, certify/revoke, SoD
detect/remediate/except, emergency activate/expire/review, policy/role/entitlement change,
ownership change, and lifecycle events. Captured as `audit-event` (actor, action, target,
timestamp, outcome).

## Properties the UI must convey
- **Immutable & append-only**: audit records are never edited or deleted; the UI presents them as
  read-only history. No "edit"/"delete" affordances anywhere on audit data.
- **Attributable**: every event names *who* (actor) and *when*, resolved to an identity.
- **Complete & traceable**: from any object you can reach its history; from any audit event you can
  reach the object.
- **Exportable**: auditors can filter and export evidence (simulated CSV/PDF).

## Where evidence surfaces
- **Object history tab** (identity, request, campaign, violation…) — the local, human view.
- **Audit module** — the global, filterable trail.
- **Certification evidence** — a completed campaign is itself evidence (who reviewed what, when,
  with what decision and comment).
- **Reports** — aggregated evidence for a period/scope.

## UX implications
- Treat "history/activity" as a **standard tab** on every major detail page, using one timeline
  pattern.
- Revoke/deprovision/exception actions **require a reason** — the reason becomes evidence.
- Never expose a way to alter the past; correcting a mistake is a *new* action that is itself
  logged.

> This is why the data model has an `audit-event` entity and why `06-compliance/controls-mapping`
> ties CTRL-AUDIT to every regulation.
