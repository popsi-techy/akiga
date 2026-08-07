# PDR-0001: Canonical IGA domain model and the Directory

- **Status:** Accepted
- **Date:** 2026-07-20
- **Deciders:** Product owner
- **Affected:** Directory module; entities `identity`, `account`, `application`, `entitlement`, `technical-role`, `business-role`, `governance-group`; navigation; all future features
- **Tags:** domain-model, directory, risk, information-architecture

## Context

The product had been designed feature-by-feature without an agreed set of core entities, so
assumptions and inconsistencies crept in (three "user" shapes, inconsistent risk display, no App
Account or Governance Group concept). We need a canonical domain model that every future feature
(Access Requests, SoD Resolution, Certifications, Emergency Access, Lifecycle Management) reuses.
This is an evolution of the foundation, not a redesign, and is intentionally kept simple and extensible.

## Decision

The product will treat these seven entities as the canonical **Directory** foundation, each with a
list page and a tabbed detail page:

- **User Identity** — the primary representation of a person. Whenever the product says "user" it
  means a User Identity unless explicitly stated otherwise. Detail tabs: Overview · App Accounts ·
  Technical Roles · Business Roles.
- **App Account** — a User Identity's account within one application; a User Identity may own many.
  Tabs: Overview · Entitlements.
- **Application** — a governed system. Tabs: Overview · Assigned Owners · App Accounts · Entitlements.
- **Entitlement** — a grantable unit of access within an application. Tabs: Overview · Assigned
  Owners · App Accounts · Technical Roles · Business Roles.
- **Technical Role** — a bundle of entitlements. Tabs: Overview · Assigned Owners · User Identities ·
  Entitlements.
- **Business Role** — a business function that contains one or more Technical Roles (and may add
  entitlements directly). Tabs: Overview · Assigned Owners · User Identities · Technical Roles · Entitlements.
- **Governance Group** — reviewers/owners that govern access. Tabs: Overview · Reviewers · Owned
  Applications · Owned Entitlements · Owned Technical Roles · Owned Business Roles.

**Assigned Owners** on any entity are User Identities. **Risk Score** (0–100) always displays with a
fixed tier scale: Critical 75–100 (Red), High 50–74 (Orange), Medium 25–49 (Yellow), Low 0–24 (Blue).

**Shared display rules:** Applications show their description; Entitlements/Technical Roles/Business
Roles show description + Risk Score; App Accounts/User Identities show email — wherever displayed.

## Reason

A single, explicit entity model removes the ambiguity that produced inconsistent screens, and makes
the identity/access backbone directly browsable. Splitting Technical vs Business Role and adding
Governance Group reflects how enterprises actually organize provisioning and governance ownership.

## Alternatives considered

- One generic `role` with a type flag — rejected: hides the distinct relationships and screens each needs.
- Deferring the Directory screens (docs only) — rejected: the product owner wants the entities
  browsable now as the foundation for later features.

## Impact

- Registries updated: `entities.json`, `relationships.json`, `lifecycle-states.json`,
  `navigation.json`, `glossary.json`. Prose synced in `04-domain/`.
- New `/iga/directory/*` list + detail screens; seed + services + owner-assignment store.
- Canonical `RiskScoreChip` + risk tokens (technical detail in ADR-0008).
- Future work: reconcile SoD seed people into User Identities; migrate legacy risk badges to `RiskScoreChip`.
