# ADR-0008: Directory entities, first-class role split, and a canonical Risk Score scale

- **Status:** Accepted
- **Date:** 2026-07-20
- **Deciders:** Product owner, Design System / Frontend
- **Tags:** architecture, domain-model, registries, data-layer, tokens

## Context

Features (Access Requests, SoD Resolution, Emergency Access, Automation) were built before the core
IGA entities and their relationships were pinned down. This caused drift: the person concept is
modeled three ways (`SeedIdentity`, `SeedEAOwner`/`DirUser`, SoD `Person`), risk scoring is
duplicated with inconsistent colors across `RiskChip`, `SeverityChip`, and the emergency-access
mapping, there is no App Account entity, and no Governance Group. The domain registries
(`registries/product/entities.json` + `relationships.json` + `lifecycle-states.json`) already exist
and are the normative source of truth (ADR-0006), and `navigation.json` already declares a
`directory` group — but no Directory screens exist. See PDR for the product-behavior side.

## Decision

We will make the seven **Directory entities** first-class and browsable, and standardize risk display:

1. **Split `role` into two entities** — `technical-role` and `business-role` — in `entities.json`,
   `relationships.json`, `lifecycle-states.json`, and `glossary.json`. This matches existing code
   that already separates them (`AccessType` in `sod-types.ts`, automation `EntitySelection` groups).
   The generic `group` entity is unchanged.
2. **Add `governance-group`** as a new entity (governance/ownership construct, distinct from `group`).
3. **Rename for clarity**: `identity` → display "User Identity" (the canonical person; "user" ⇒ User
   Identity), `account` → "App Account". IDs are unchanged, so existing references keep working.
4. **Routes nested under `/iga/directory/*`** by adding `'directory'` to `NESTED_GROUPS` in
   `src/lib/iga-navigation.ts`; nav item ids equal route segments.
5. **Canonical Risk Score scale**: a dedicated `--ds-color-risk-*` token scale (Critical 75–100 Red,
   High 50–74 Orange, Medium 25–49 Yellow, Low 0–24 Blue), a single `riskTier(score)` util
   (`src/lib/risk.ts`), and one `RiskScoreChip` component. These tiers/colors do **not** map to the
   existing status intents (`warning`=yellow, `info`=blue, `success`=green), so a distinct scale is required.
6. **Data**: a canonical `userIdentities` seed (superset), an `appAccounts` seed, relationship link
   arrays on apps/entitlements/roles/governance-groups, read-only derived-view services per entity
   (mirroring `catalog.ts`/`directory.ts`), and one localStorage owner-assignment store
   (`entity-owners.ts`, mirroring `sod.ts`) keyed by `(entityType, entityId)`. `ownerDirectory` becomes
   a projection of `userIdentities` so Emergency Access keeps working.

## Consequences

- Future features consume these entities/relationships consistently; "Assigned Owners" everywhere are
  User Identities.
- `RiskScoreChip` + `riskTier()` become the single risk display; `RiskChip`/`SeverityChip` remain until
  call sites migrate (follow-up).
- New risk color tokens must pass the WCAG contrast guardrail (ADR-0005; `npm run check:contrast`).
- SoD's separate seed people are not reconciled in this pass (future work).
- Registry JSON schemas (`_schemas/`) and a doc↔registry parity check remain pre-existing gaps.

## Alternatives considered

- **Keep one `role` entity with a `type` attribute** — rejected: the spec requires separate nav, list,
  and detail pages with different relationships, and code already treats them separately.
- **Reuse status intents for risk** — rejected: they can't express the requested Red/Orange/Yellow/Blue
  4-step scale (no orange; blue/yellow are taken by info/warning).
- **Full reconciliation of all three person models now** — rejected as too large/risky; superset +
  projection keeps this an evolution without breaking existing modules.
- **Flat `/iga/{id}` routes** — rejected: nested `/iga/directory/*` matches the group and mirrors `automation`.
