# PDR-0003: App Accounts and Entitlements sit after Reconciliation

- **Status:** Accepted
- **Date:** 2026-09-10
- **Deciders:** Product
- **Affected:** Application detail
- **Tags:** directory, reconciliation, information-architecture
- **Supersedes:** PDR-0002

## Context
PDR-0002 clubbed accounts, entitlements, sync, and history onto Reconciliation. The lists need to be reachable as their own tabs again, without putting them back before Reconciliation — sync is how that inventory arrived, so it leads.

## Decision
The product will keep Reconciliation as the sync page (last-sync cards and history). App Accounts and Entitlements are separate tabs, immediately to the right of Reconciliation.

## Reason
Reconciliation answers "what did the connector do?" The lists answer "what does this application hold?" Those are different jobs. Leading with Reconciliation keeps the pull story first.

## Alternatives considered
- Keep inventory inside Reconciliation — rejected: the lists need their own tabs.
- Put App Accounts and Entitlements before Reconciliation — rejected: that hid how the inventory arrived.

## Impact
Application detail strip order. Overview tiles and list cells link to the matching tab.
