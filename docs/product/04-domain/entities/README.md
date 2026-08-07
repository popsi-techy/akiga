# Entities

> **Populated.** The **rich, normative source of truth for all entities** (attributes, states,
> owners) is `registries/product/entities.json`. Relationship edges are in `relationships.json`;
> state machines in `lifecycle-states.json`; readable views in `../data-dictionary.md`,
> `../relationships.md`, and `../lifecycle-state-machines.md`.
>
> We deliberately do **not** keep a separate markdown file per entity — that would duplicate the
> registry and drift. Author a per-entity narrative file (from `_templates/entity.template.md`)
> **only** when an entity needs behavioral explanation the registry can't hold.

## Canonical entity set

The first seven entities form the **Directory backbone** — the identity/access model every other
module builds on. They each have a list + detail screen under `/iga/directory/*` (see
`../data-dictionary.md` for the default detail-page tabs and shared display rules).

| Entity | ID | Directory | One-line definition (full detail in `entities.json`) |
|--------|----|:--------:|--------------------------------------|
| User Identity | `identity` | ✓ | The primary representation of a person; owns App Accounts. "User" ⇒ User Identity. |
| App Account | `account` | ✓ | A User Identity's account within a specific application. |
| Application | `application` | ✓ | A system that holds accounts and access. |
| Entitlement | `entitlement` | ✓ | A grantable unit of access within an application. |
| Technical Role | `technical-role` | ✓ | A collection of entitlements bundled to simplify provisioning. |
| Business Role | `business-role` | ✓ | A business function bundling one or more Technical Roles. |
| Governance Group | `governance-group` | ✓ | A group of reviewers/owners that governs (owns) access. |
| Group | `group` | | A directory collection used to grant access collectively. |
| Access Request | `access-request` | | A request to grant/revoke access. |
| Approval Policy | `approval-policy` | | Rules for who must approve what. |
| Workflow | `workflow` | | An orchestrated sequence of steps/approvals. |
| Certification | `certification` | | A periodic review of who has what access. |
| SoD Policy | `sod-policy` | | A rule defining conflicting access combinations. |
| Risk | `risk` | | The risk score/level attached to access or identities. |
| Emergency Access | `emergency-access` | | Temporary elevated ("break-glass") access. |
| Lifecycle Event (JML) | `lifecycle-event` | | A Joiner / Mover / Leaver event driving access change. |

> These IDs are canonical. Cross-references everywhere use the ID, never the display name.
> **Ownership:** "Assigned Owners" on an entity are User Identities. Technical/Business Role are
> **distinct** first-class entities (not a `type` on one `role` entity).
