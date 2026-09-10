# PDR-0002: Application inventory lives on Reconciliation

- **Status:** Superseded by PDR-0003
- **Date:** 2026-09-10
- **Deciders:** Product
- **Affected:** Application detail, Applications list, Overview tiles
- **Tags:** directory, reconciliation, information-architecture

## Context
Application detail had three peer tabs that told one story: App Accounts, Entitlements, and Reconciliation. Accounts and entitlements *are* the inventory a sync produces; keeping them as siblings hid that relationship and lengthened the strip.

## Decision
The product will treat Reconciliation as the application's inventory. That page is where a reader views accounts, views entitlements, runs a sync, and reads sync history. App Accounts and Entitlements are not top-level application tabs. The Directory still has its own App Accounts and Entitlements lists.

Deep links `?tab=accounts` and `?tab=entitlements` open Reconciliation on that collection. `?tab=reconciliation&view=history` opens the run list.

## Reason
One protagonist per screen. The inventory is what IGA pulled; sync and history are how it arrived. A reader who wants "the accounts on Google Workspace" should not have to choose between a catalog tab and a sync tab.

## Alternatives considered
- Keep three top-level tabs — rejected: same data, longer chrome.
- Stack accounts, entitlements, and history on one scrolling page — rejected: three tables shout equally.
- A 240px NavList rail like Configure and Owners — rejected: those rails switch *jobs* with different chrome. These three panes are the same job (a table) with different columns.

## Impact
Application detail strip. Overview stat tiles and the Applications list Active Accounts / Last Synced cells. Data dictionary tab list. No new Design System component.
