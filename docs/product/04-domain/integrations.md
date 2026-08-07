# Integrations & Connectors (conceptual)

The product assumes source and target systems even though **all connectivity is simulated**.
Source of truth: `registries/product/integrations.json`.

## The mental model
```
HR System ──(identities, JML events)──▶  [ Governance Platform ]  ──(provision)──▶ SaaS / DB apps
Directory ──(accounts, groups)─────────▶                          ◀──(reconcile / sync)──
```
- **HR** is authoritative for **identities** and lifecycle events (joiner/mover/leaver).
- **Directory** is authoritative for **accounts** and **groups**.
- **Applications** are provisioning **targets**: approved access is written to them via a
  connector (simulated with `provisioning → fulfilled/failed` states).
- **Reconciliation/sync** periodically compares reality to the model, surfacing **orphan
  accounts** and out-of-band changes as governance findings.

## Why it matters for UI
- A **Connectors** admin screen shows each connector's type, linked application, `status`
  (connected/syncing/error), and `lastSync` — with realistic simulated sync activity.
- **Provisioning is a visible, stateful step**, not instant: request detail and approval outcomes
  should show provisioning progress and handle the `failed → retry` path.
- Governance findings (orphans, drift) trace back to a connector sync — link them.

> No real credentials, endpoints, or network calls — ever. Connectors are data + simulated state
> transitions in the mock layer.
