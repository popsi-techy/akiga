# Permission / Capability Matrix

The canonical answer to *"who can do what?"* — the basis for **permission-aware UI**. Source of
truth: `registries/product/permissions.json`. Scope legend: **own** (own records) · **team**
(direct reports) · **owned** (objects they own) · **assigned** (items assigned to them) · **all**
(org-wide) · blank = not allowed.

| Action | End User | Manager | Reviewer | App Owner | Role Owner | Ent. Owner | Auditor | Admin |
|--------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Request access | own | team | | | | | | all |
| View requests | own | team | assigned | | | | all | all |
| Approve/reject request | | team | | owned | owned | owned | | all |
| Certify/revoke items | | team | assigned | owned | owned | owned | | all |
| Launch certification | | | | | | | | all |
| Manage entitlements | | | | owned | | owned | | all |
| Manage roles | | | | | owned | | | all |
| Manage applications | | | | owned | | | | all |
| Manage SoD policies | | | | | | | | all |
| Remediate SoD violations | | | | | | | | all |
| Configure risk model | | | | | | | | all |
| Manage workflows/policies | | | | | | | | all |
| Request emergency access | own | own | | | | | | all |
| Review emergency access | | | | | | | | all |
| Manage connectors | | | | | | | | all |
| View audit trail | | team | | owned | | | all | all |
| Export reports | | | | | | | all | all |
| Manage settings/delegation | | | | | | | | all |

## How the UI must use this
1. **Hide vs. disable:** if a persona can *never* perform an action, **hide** it. If they could
   but not in this state/scope (e.g. not their record), **disable** with a tooltip explaining why.
2. **Scope filters data, not just buttons:** a manager's lists are pre-scoped to their team; an
   app owner's to their apps. Don't render org-wide data then hide rows.
3. **The active persona is a first-class prototype control:** the mock auth lets you switch
   persona; every screen re-derives visible actions and data from this matrix. This is how we
   demonstrate governance UX.
4. **Auditor is read-only by design** — no certify/approve/remediate, but full visibility and
   export. Treat "read-only persona" as a real, testable state.

> When adding a new action anywhere in the product, add it to `permissions.json` first and place
> it in this matrix. No action ships without a defined scope per persona.
