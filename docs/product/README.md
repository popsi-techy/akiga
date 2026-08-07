# Product Knowledge Base (PKB)

> **The foundation both the Design System and the IGA Product build on.**
> This is everything a future AI model — or a newly-joined Senior Product Designer or Frontend
> Engineer — must understand about the product *before* generating any UX, UI, component, or
> code. It is deliberately **independent of implementation**: no React, no components, no design
> tokens. Just product truth.

- **Version:** 1.0.0 · **Status:** **core content populated** with enterprise IGA defaults.
  Registries are the source of truth; markdown explains. Refine as the product sharpens (via PDRs).
- **Governed by:** [`AI_CONSTITUTION.md`](../../AI_CONSTITUTION.md). Read it first.

---

## The three areas of this repository

```
Product Knowledge (this)  ──feeds──▶  Design System  ──consumed by──▶  IGA Product
        the "why & what"                the "how it looks/behaves"        the "what ships"
```

The PKB answers **what the product is and why it behaves as it does**. The Design System
answers **how it looks and behaves consistently**. The IGA Product is **what ships**. UX/UI
decisions must trace back to the PKB; the PKB never depends on UI.

---

## How truth is stored (read this)

Every area of the PKB exists in **two synchronized forms**:

1. **Markdown docs** (in `docs/product/…`) — explain, teach, and give rationale. For humans and
   for AI reasoning.
2. **Machine-readable registries** (in `registries/product/*.json`) — the **normative source of
   truth** an AI queries first to answer *"what exists?"* and *"how do these relate?"*

**If a registry and a doc disagree, the registry is correct and the doc must be fixed.** Docs
explain; registries enumerate. See [`registries/product/README.md`](../../registries/product/README.md).

---

## Reading order (onboarding path)

New contributor or AI, read in this order:

1. `00-foundation/` — vision, scope, what we are and are not building.
2. `01-overview/` — what IGA is, the modules, core capabilities.
3. `08-content/glossary.md` — learn the vocabulary before the domain.
4. `04-domain/` — the entities, their attributes, relationships, and lifecycles.
5. `06-compliance/` — *why* IGA behaves the way it does (regulatory drivers).
6. `02-users/` — personas, permissions, and end-to-end journeys.
7. `05-business-rules/` — the precise behavior rules.
8. `03-information-architecture/` — how it's all navigated.
9. `07-experience/` — product-level UX principles, metrics, notifications.
10. `09-competitors/`, `10-quality/`, `11-data/`, `12-decisions/` — as needed.

---

## Section index & the purpose of every area

Each folder has its own `README.md` that lists the purpose of **every document** inside it.

| # | Area | Purpose | Primary registry it feeds |
|---|------|---------|---------------------------|
| `00-foundation` | **Vision, Scope, Roadmap** | Mission, long-term vision, goals, success metrics; what's in/out of scope; build phasing. The "north star" and the guardrails against scope creep. | — |
| `01-overview` | **Product Overview** | What IGA is, product scope, core capabilities, supported modules. | `product-modules.json` |
| `02-users` | **Users, Permissions & Journeys** | Personas, the product's own permission/capability matrix, and cross-persona end-to-end journeys. | `personas.json`, `permissions.json`, `journeys.json` |
| `03-information-architecture` | **Information Architecture** | Navigation, module map, hierarchy, and how areas relate. | `navigation.json` |
| `04-domain` | **Business Domain** | Every entity (definition, attributes, states, relationships), the data dictionary, relationships/ERD, lifecycle state machines, and the integration/connector concept. | `entities.json`, `relationships.json`, `lifecycle-states.json`, `integrations.json` |
| `05-business-rules` | **Business Rules** | The precise, testable rules governing behavior: approval, risk, ownership, certification, access duration, emergency access, SoD, lifecycle (JML). The source of truth for *behavior*. | `business-rules.json` |
| `06-compliance` | **Compliance & Regulatory** | Regulatory context (SOX, GDPR, HIPAA, SOC 2, ISO 27001, NIST), audit & evidence model, and feature→control mapping. Explains *why* the product enforces what it does. | `compliance-controls.json` |
| `07-experience` | **Product Experience** | Product-level UX principles, interaction philosophies (nav, dashboards, forms, tables, search, filters, drawers, wizards), state experience (empty/loading/error/success), notifications catalog, KPI catalog, reporting catalog. *Principles, not visual design.* | `metrics.json`, `notifications.json` |
| `08-content` | **Content & Language** | Copywriting guidelines (tone, labels, dialogs, errors), canonical terminology, and the glossary — the product's vocabulary. | `glossary.json` |
| `09-competitors` | **Competitor Research** | Structured analysis of each competitor: strengths, weaknesses, UX, navigation, patterns, screens, features, opportunities. | `competitors.json` |
| `10-quality` | **Non-Functional Qualities** | Product-level expectations: security, performance, scalability, accessibility, internationalization, reliability. | — |
| `11-data` | **Sample / Seed Data** | The canonical, deterministic mock dataset strategy (org, identities, apps, requests) used across every prototype screen. | (feeds fixtures, not a knowledge registry) |
| `12-decisions` | **Product Decisions & Open Questions** | The Product Decision Record (PDR) system and the living open-questions log. | — |
| `_templates` | **Templates** | Reusable authoring templates for personas, entities, business rules, competitors, and PDRs — so every entry is consistent. | — |

The **`feature-catalog.json`** registry spans the whole PKB: it is the master index of every
product capability, linking each feature to its module, entities, rules, personas, and journeys.

---

## Relationship to Decision Records

- **PDR** (Product Decision Record) → `12-decisions/` — *what & why* about the product
  ("emergency access expires after N hours"). Owns product behavior rationale.
- **ADR** (Architecture Decision Record) → `docs/architecture/decisions/` — *how* it's built
  ("we use a single-source token pipeline"). Owns technical rationale.

A single change may need both. When in doubt: if it affects **product behavior**, it's a PDR;
if it affects **implementation**, it's an ADR.

---

## Rules for maintaining the PKB

1. **Registries are normative.** Any doc that adds/changes an entity, persona, rule, module,
   journey, metric, or term MUST update the matching registry in the same change.
2. **Implementation-free.** No component names, no token values, no framework specifics. If a
   statement only makes sense given a UI choice, it doesn't belong here.
3. **Every claim is sourced.** Business rules, risk formulas, and compliance mappings cite the
   PDR or regulation that justifies them.
4. **Templates are mandatory.** New personas/entities/rules/competitors/decisions use the
   `_templates/` scaffolds so entries stay uniform and queryable.
5. **Vocabulary is canonical.** Use glossary terms exactly. New terms are added to the glossary
   (and `glossary.json`) before use.
