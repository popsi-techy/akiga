# Product Knowledge Registries — machine-readable source of truth

These JSON files are the **normative** representation of the Product Knowledge Base. An AI
queries these *first* to answer "what exists?", "what are its attributes?", and "how does it
relate to everything else?" The Markdown docs in `docs/product/` explain and justify what these
files enumerate.

> **Not populated yet — by design.** This step defines the **contract** (purpose + proposed
> shape) for each registry. Entries are added as the PKB content is authored, via the workflow
> in [`AI_CONSTITUTION.md`](../../AI_CONSTITUTION.md).

> **Note on layout:** product-knowledge registries live here (`registries/product/`). The
> Design-System registries (`components`, `patterns`, `templates`, `tokens`) will move to
> `registries/design-system/` for symmetry. See `registries/README.md`.

## The registries

| File | Answers | Explained by |
|------|---------|--------------|
| `product-modules.json` | Which product modules exist and what each owns? | `docs/product/01-overview/` |
| `entities.json` | Which business entities exist, their attributes, states, and owners? | `docs/product/04-domain/entities/` |
| `relationships.json` | How does every entity relate to every other entity (edges of the ERD)? | `docs/product/04-domain/relationships.md` |
| `lifecycle-states.json` | The states and legal transitions for each stateful entity (request, certification, account, JML). | `docs/product/04-domain/lifecycle-state-machines.md` |
| `personas.json` | Who the users are: responsibilities, goals, pain points, permissions, primary workflows. | `docs/product/02-users/personas/` |
| `permissions.json` | The capability matrix: which persona/role can perform which action on which entity. | `docs/product/02-users/permission-matrix.md` |
| `journeys.json` | End-to-end, cross-persona journeys (e.g. Joiner→provision, request→certify). | `docs/product/02-users/user-journeys.md` |
| `business-rules.json` | Every product rule with a stable ID, inputs, logic, and the PDR that justifies it. | `docs/product/05-business-rules/` |
| `navigation.json` | The navigation tree / IA hierarchy. | `docs/product/03-information-architecture/` |
| `compliance-controls.json` | Regulations, controls, and the features/rules that satisfy them. | `docs/product/06-compliance/` |
| `metrics.json` | KPI/metric definitions surfaced on dashboards and reports. | `docs/product/07-experience/metrics-and-kpis.md` |
| `notifications.json` | Notification types: trigger, audience, channel, urgency. | `docs/product/07-experience/notifications-catalog.md` |
| `integrations.json` | Conceptual source systems / connectors (HR, directory, apps). | `docs/product/04-domain/` |
| `competitors.json` | Competitor analysis: strengths, weaknesses, UX, patterns, features, opportunities. | `docs/product/09-competitors/` |
| `glossary.json` | Canonical IGA vocabulary: term, definition, synonyms, related terms. | `docs/product/08-content/glossary.md` |
| `feature-catalog.json` | Master index of every capability, linked to its module, entities, rules, personas, journeys. | spans the whole PKB |

## Design principles for these registries

- **Stable IDs.** Every entry has an immutable `id` (e.g. entity `identity`, rule `BR-APPROVAL-001`,
  persona `reviewer`). Cross-references use IDs, never display names.
- **Cross-linked, not duplicated.** Relationships live in `relationships.json`; other registries
  reference entity IDs rather than restating relationships.
- **Schema-validated.** Each registry gets a JSON Schema (in `registries/product/_schemas/`) so
  CI can validate structure and reject broken cross-references. Schemas are authored when the
  first entries are added.
- **Doc ↔ registry parity.** A CI check flags entities/rules/etc. that appear in one form but
  not the other.

## Illustrative shapes (finalized when first populated)

`entities.json`:

```jsonc
{
  "id": "entitlement",
  "name": "Entitlement",
  "definition": "A grantable unit of access within an application.",
  "owner": "entitlement-owner",         // persona id
  "attributes": ["id", "name", "applicationId", "riskLevel", "type", "status"],
  "states": ["active", "deprecated", "retired"],   // ids from lifecycle-states.json
  "docs": "docs/product/04-domain/entities/entitlement.md"
}
```

`business-rules.json`:

```jsonc
{
  "id": "BR-EMERGENCY-001",
  "title": "Emergency access auto-expiry",
  "module": "emergency-access",
  "appliesTo": ["access-request", "account"],   // entity ids
  "logic": "Emergency access grants expire automatically after the configured window.",
  "inputs": ["grantTime", "expiryWindow"],
  "pdr": "docs/product/12-decisions/00XX-emergency-access-expiry.md",
  "compliance": ["SOX-ITGC"]                     // compliance-controls ids
}
```

`personas.json`:

```jsonc
{
  "id": "reviewer",
  "name": "Reviewer",
  "responsibilities": [], "goals": [], "painPoints": [],
  "permissions": [],                    // action ids from permissions.json
  "primaryJourneys": [],                // journey ids
  "docs": "docs/product/02-users/personas/reviewer.md"
}
```
