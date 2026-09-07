---
"@akiga/design-system-app": minor
---

An application in setup says what its sections need, instead of hiding them or offering actions it
cannot take.

**Reconciliation no longer follows the provisioning toggle.** It used to be hidden alongside Configure,
which conflated two directions: provisioning is IGA *pushing* access out, reconciliation is IGA
*pulling* the inventory in. Reading a system IGA governs but does not administer is the normal case,
and hiding the inventory left no way to see what the application holds.

**But there is no Sync Now without a connector.** The totals, the last-sync state and the history are
honest reads — "nothing here, never synced" is a real answer. A Sync Now with nothing to sync over is
not: it promises an action IGA cannot take and returns a toast claiming it queued one. `ReconciliationTab`
takes `canSync`, and the toolbar row goes with the button rather than sitting empty above the cards.

**Sections that need the connector say so.** With provisioning on but not yet authorized, Reconciliation,
Baseline Access and Approval Policy show **Configure this application first**, the reason, and a button
to Configure — rather than their own machinery over data that cannot exist yet. Each reason is a real
dependency: reconciliation has nothing to pull, a baseline is chosen from what reconciliation brings in,
and an approval policy governs granting access that cannot be provisioned. Owners is deliberately not
gated — naming who answers for an application needs no connector, and it is the one piece of governance
worth having first.

The gate is conditional on the application *having* a Configure step at all. With provisioning off there
is none, so gating on it would lock those sections behind a condition nothing on the page could satisfy.

Verified across all three states: provisioning off (inventory, no Sync Now), provisioning on and
unconfigured (the gate), and configured (content with Sync Now and history).
