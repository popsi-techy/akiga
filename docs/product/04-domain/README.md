# 04 · Business Domain

The heart of the PKB: the entities the product manages, their attributes, how they relate, and
how they change over time. An AI cannot correctly design a form, table, or workflow without this.

> **Populated.** · **Feeds:** `entities.json`, `relationships.json`, `lifecycle-states.json`, `integrations.json`

| Document | Purpose |
|----------|---------|
| `entities/README.md` | Explains the entity model and indexes the per-entity files. |
| `entities/<entity>.md` | One file per entity, authored from `_templates/entity.template.md`: definition, attributes, states, relationships, governing rules, compliance relevance. |
| `relationships.md` | **The relationship map (ERD narrative + diagram).** How every entity relates to every other — the canonical edges. Mirrored in `relationships.json`. |
| `data-dictionary.md` | **Attribute-level reference across all entities.** Aggregates each entity's fields (name, type, required, description) into one queryable dictionary — the basis for every form and table later. |
| `lifecycle-state-machines.md` | **States and legal transitions** for each stateful entity (access request, certification, account, JML). The backbone of status chips, filters, and workflows. Mirrored in `lifecycle-states.json`. |
| `integrations.md` | **The conceptual connector/source-system model** (HR system, directory, applications). Even though no real integrations are built, the domain assumes them. Mirrored in `integrations.json`. |

## Entities (current set)

**Directory backbone (first-class, with list + detail screens under `/iga/directory/*`):**
`identity` (User Identity) · `account` (App Account) · `application` · `entitlement` ·
`technical-role` · `business-role` · `governance-group`

**Process & governance:** `group` · `access-request` · `approval-policy` · `workflow` ·
`certification` · `sod-policy` · `risk` · `emergency-access` ·
`joiner-mover-leaver (lifecycle event)`

> Every entity here has an `entities.json` entry, and every relationship an edge in
> `relationships.json`. Attributes belong in the entity file **and** the data dictionary.
