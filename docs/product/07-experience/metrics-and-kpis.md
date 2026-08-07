# Metrics & KPIs

Every number shown on a dashboard or report is defined here. Source of truth:
`registries/product/metrics.json`. A metric without a definition is decoration — don't render it.

## Dashboard-critical metrics (persona-scoped)
| Metric | Format | Good | Who sees it |
|--------|--------|:----:|-------------|
| Time to Access | duration | ↓ | admin, manager |
| Approval Turnaround | duration | ↓ | admin, manager |
| Pending Approvals | count | ↓ | approvers |
| Overdue Approvals | count | ↓ | approvers, admin |
| Certification Completion | percent | ↑ | admin, reviewer, auditor |
| Open SoD Violations | count | ↓ | admin, auditor |
| Orphan Accounts | count | ↓ | admin, auditor |
| High-Risk Access | count | ↓ | admin, auditor |

## Report/analytics metrics
On-Time Certification Rate, Mean SoD Violation Age, Dormant Access, Time-Bound Access Share, JML
Automation Rate. (Full list + definitions in `metrics.json`.)

## Display rules
- **Format drives the component**: `count` → stat tile; `percent` → tile + progress; `duration` →
  humanized ("2d 4h"). One tile component, consistent across the product.
- **Trend coloring uses `goodDirection`**, not raw up/down — a falling "time to access" is *good*
  (positive color), a falling "certification completion" is *bad*.
- **Every metric is a link** to the filtered list it summarizes (drill-down is mandatory).
- **Scope to the persona**: an approver's "Pending Approvals" is *theirs*, not the org's.

> Charts/colors are Design System concerns — but the **metric semantics and good-direction** are
> product truth defined here, so dashboards stay meaningful.
