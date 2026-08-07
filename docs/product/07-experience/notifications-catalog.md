# Notifications Catalog

Every notification the product emits. Source of truth: `registries/product/notifications.json`.
IGA is notification-driven — governance moves because people are told there's something to do.

## Principles
- **In-app is always present**; email is *simulated* (no real send) and marked as such.
- **Urgency drives emphasis**: `normal` (standard), `high` (highlighted, e.g. overdue), `critical`
  (e.g. emergency access active — most prominent).
- **Every notification deep-links** to the object needing attention (`linksTo`).
- **Actionable notifications reconcile with the task inbox** — clearing the task clears the nudge;
  don't create a parallel, inconsistent to-do list.

## Catalog (summary)
| Notification | Trigger | Audience | Urgency |
|--------------|---------|----------|:-------:|
| Approval pending | Task assigned to you | Approvers | normal |
| Approval overdue | Task past SLA | Approvers, admin | high |
| Request approved/rejected | Your request decided | End user | normal |
| Access provisioned | Requested access active | End user | normal |
| Review assigned | Certification items to review | Reviewers | normal |
| Review due soon | Campaign nearing due date | Reviewers | high |
| Access expiring | Time-bound access ends soon | End user | normal |
| SoD violation detected | New violation | Admin | high |
| Emergency access active | Break-glass activated | Admin | critical |
| Emergency review due | Expired grant needs review | Admin | high |
| Lifecycle exception | JML event needs attention | Admin, manager | high |

## UI surfaces
- **Notification center** (top-bar bell) with unread count, grouped by recency, mark-read/dismiss.
- **Inline nudges** on the dashboard for high/critical items.
- Notifications respect the **permission matrix** — you're only notified about what you can act on.

> New notification type → add to `notifications.json` (with audience, channel, urgency, link)
> before emitting it anywhere.
