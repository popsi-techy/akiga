# Modules

The top-level decomposition of the product. Each module is a navigation destination and owns a
set of screens. Canonical source: `registries/product/product-modules.json`.

| Module | ID | Owns | Key screens (later) |
|--------|----|------|---------------------|
| Dashboard | `dashboard` | Landing overview: KPIs, my pending actions, risk highlights | Home dashboard |
| Identities | `identities` | Identity warehouse & lifecycle | List, detail (accounts/access/history) |
| Applications | `applications` | Governed application registry | List, detail (entitlements/owners/accounts) |
| Access Catalog | `access-catalog` | Requestable entitlements & groups | Catalog browse, item detail |
| Roles | `roles` | Role definition & membership | Role list, role detail/builder, assignment |
| Access Requests | `access-requests` | Self-service requests | Catalog→cart→submit, my requests, request detail |
| Approvals | `approvals` | Approval task inbox | My approvals, approval detail, bulk actions |
| Certifications | `certifications` | Access reviews / attestation | Campaign list, campaign detail, reviewer inbox |
| Policies | `policies` | SoD, approval & provisioning policies | Policy list, policy editor, violations |
| Risk | `risk` | Risk scoring & exposure | Risk overview, risk detail |
| Emergency Access | `emergency-access` | Break-glass access | Request, active grants, history |
| Workflows | `workflows` | Visual orchestration | Workflow list, workflow builder (React Flow) |
| Reports | `reports` | Standard reports & exports | Report catalog, report viewer |
| Audit | `audit` | Immutable activity trail | Audit log, event detail, evidence export |
| Administration | `administration` | Connectors, org settings, delegation | Connectors, settings, delegation |

## Notes
- **Approvals** and **Certifications** are both *task inboxes* — they should share an inbox
  pattern (see `07-experience/interaction-patterns.md`) rather than diverge.
- **Access Catalog** and **Roles** together form the "access model"; keep their browse/detail
  patterns consistent.
- **Administration** gates most config behind the `administrator` persona (permission-aware UI).

> Not every module ships at once — see `00-foundation/roadmap-and-phasing.md` for order.
