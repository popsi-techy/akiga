---
"@akiga/design-system-app": minor
---

An IAM or PAM connection reconciles a third collection: the **applications** it fronts.

A direct application is a leaf — it has accounts and entitlements and nothing underneath. An IAM
federates applications and a vault holds credentials for them, so "App discovery" is a capability on
every IAM type in the catalog and there was nowhere in the product to see its result. Reconciliation
now carries it end to end: an Applications card, an Applications column in the sync history, and the
same drill-through to the names behind the numbers.

For an IAM the app inventory is the reason the connection was made, so the card **leads** rather than
trails. Four cards also stay two up at every width — a 2×2 block reads as one group where
three-and-one reads as a card left over.

**One switch, not a flag per surface.** `summary.applications` is present exactly when
`reconcilesApplications` is true, so the card, the column and the drawer appear or stay away together
and no caller can get them out of step. A direct application's Reconciliation tab is byte-for-byte
what it was: three cards, six columns, and — because the third collection's deltas are drawn from the
random stream only when they apply — the identical run history it had before this existed.

**The inventory is generated, and the module says so.** Accounts and entitlements totals come from
the Directory because the Directory holds them. It has no parent/child relation between applications
— an app discovered through Entra is not recorded as belonging to Entra — so there is nothing to
count, and the list is generated from the connection's id: stable per application, plainly synthetic,
same on server and client. The pool reads as federated SaaS because IAM is the only category that can
be onboarded today; a PAM type shipping should bring its own, since a vault's downstream systems are
infrastructure rather than SaaS.

**A connection that has never run has discovered nothing.** The card reads its total off the newest
run rather than off the inventory. Reading the inventory directly claimed "10 applications
discovered" beside "Never synced" on a freshly onboarded IAM. The walk starts from the full inventory
anyway, so once a run exists the newest one states exactly the same number — which also means the
card and the top row of the history cannot disagree.

`hasSyncHistory` now counts discovered applications as something to reconcile against, so an IAM with
no accounts imported still has a history. Discovering seven applications and importing no accounts is
a real state for a newly connected IAM, and the honest reading of one whose account import has not
been set up. An IAM the connector has never signed in to still reports never-synced — that guard is
unchanged.

Also: `Application Discovery` joins the sync-event pool for IAM and PAM connections only, since a
direct application reporting it would be claiming to have found systems inside itself. And
`applicationDiscoverySource` is extracted in `directory.ts`, so "what kind of connection is this" has
one answer rather than the category ternary being retyped per caller.

Verified: `app-entra` shows 6 discovered with the delta chain reconciling exactly (oldest total plus
every delta lands on 6), the drawer naming Notion added / Trello removed / 5 untouched; a freshly
onboarded IAM shows 0 and never-synced; and `app-google-workspace` is unchanged at three cards and
six columns.
