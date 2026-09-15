---
"@akiga/design-system-app": minor
---

App Accounts and Entitlements leave the application tab strip and open as a drawer from
Reconciliation.

The strip is the parts of an application you set up — Configure, Owners, Baseline, Approval
Policy. Accounts and entitlements are not steps; they are what reconciliation *pulled in*.
Having them on the strip put the same inventory in three places at once: a count on a tab,
the same totals on the Reconciliation cards, and the rows a click past either of them. The
strip drops from eight tabs to six.

They open from those cards now — `View accounts` and `View entitlements`, in the header of
the card that already counts them, as text-only controls in `text.link` blue per §5.1a.

A drawer rather than a section, because reading what an application holds is a side-read:
you are checking the rows against the totals you just saw, and the cards, the sync history
and the last-sync banner all stay behind it. As its own section it replaced the page you
opened it from, and the way back was a link you had to find — the tab strip appeared to be
on Reconciliation already, so clicking that tab did nothing.

760px rather than the 480 default: the entitlement table carries a name, an application and
a risk chip beside search and paging, and at 480 the name is the column that gives way.

`?view=accounts` and `?view=entitlements` still work — they land on Reconciliation and open
the drawer over it, so a saved link resolves to the same thing the cards do.

`ReconciliationTab` takes `onViewAccounts` and `onViewEntitlements`; without them the cards
render exactly as before, so the tab stays usable anywhere it does not own the navigation.
