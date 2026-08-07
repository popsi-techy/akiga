# Data Dictionary

Attribute-level reference used to build forms, tables, filters, and detail pages. **The complete,
authoritative attribute list per entity is `registries/product/entities.json`** — this page
highlights the display/UX-relevant conventions so screens are consistent.

## Attribute types → UI mapping
| Type | Meaning | Default UI (Design System decides final form) |
|------|---------|-----------------------------------------------|
| `id` | Immutable identifier | Not shown as an editable field; used in links |
| `string` | Free text | Text input / text cell |
| `email` | Email address | Email input, validated |
| `enum` | Fixed value set | Select / status chip (see intents) |
| `boolean` | Yes/no | Toggle / checkbox / boolean badge |
| `number` | Numeric (incl. scores) | Number input / right-aligned cell |
| `date` / `datetime` | Point in time | Date picker; relative or absolute per copy rules |
| `ref:<entity>` | Link to one record | Autocomplete select; link cell |
| `ref:<entity>[]` | Link to many | Multi-select / chips; count + drill-down |
| `json` | Structured config | Specialized editor (e.g. workflow graph) |

## Cross-entity display conventions
- **Every list** shows: a primary label, a **status chip** (from lifecycle intents), an **owner**,
  and a **risk badge** where the entity has risk. These four are the backbone of IGA tables.
- **Risk Score** (`riskScore`, 0–100) renders through **one** canonical component (`RiskScoreChip`)
  with a fixed tier→color scale — **Critical 75–100 = Red · High 50–74 = Orange · Medium 25–49 =
  Yellow · Low 0–24 = Blue**. `riskTier(score)` (`src/lib/risk.ts`) is the single source of the
  tier; colors are dedicated `--ds-color-risk-*` tokens (distinct from status intents).
- **Owner** always resolves to a User Identity with avatar + name; never show a raw ownerId.
- **Dates**: `createdAt`, `lastLogin`, `dueDate`, `expiresAt` drive "age"/"overdue"/"expiring"
  affordances — surface these as relative time with an absolute tooltip.
- **Required fields** (per entity JSON) map directly to form validation; optional fields are
  progressive disclosure.

## Shared display rules (apply product-wide)
- Whenever an **Application** is displayed, include its **description** where appropriate.
- Whenever an **Entitlement**, **Technical Role**, or **Business Role** is displayed, include its
  **description** and **Risk Score** where appropriate.
- Whenever an **App Account** or **User Identity** is displayed, include the **email** where appropriate.
- References to "users" mean **User Identities** unless explicitly stated otherwise.

## Default detail-page tabs (Directory entities)
Every Directory entity has a list page + a tabbed detail page under `/iga/directory/*`. Tab order is
canonical; relationship tabs list related entities and each row cross-navigates to that entity's detail.

| Entity | Tabs |
|--------|------|
| Application | Overview · Assigned Owners · App Accounts · Entitlements |
| Entitlement | Overview · Assigned Owners · App Accounts · Technical Roles · Business Roles |
| Technical Role | Overview · Assigned Owners · User Identities · Entitlements |
| Business Role | Overview · Assigned Owners · User Identities · Technical Roles · Entitlements |
| App Account | Overview · Entitlements |
| User Identity | Overview · App Accounts · Technical Roles · Business Roles |
| Governance Group | Overview · Reviewers · Owned Applications · Owned Entitlements · Owned Technical Roles · Owned Business Roles |

## High-frequency columns (design tables around these)
| Entity | Typical table columns |
|--------|-----------------------|
| User Identity | User Name · Email · (Department · Status · Risk) |
| App Account | Account Name · Email · Application |
| Application | Application Name · Description · (Owner · Status) |
| Entitlement | Entitlement Name · Description · Application · Risk Score |
| Technical Role | Name · Description · Risk Score |
| Business Role | Name · Description · Risk Score |
| Governance Group | Name · Description |
| Access Request | Beneficiary · Items · Requested · Status · Risk · SoD? |
| Approval Task | Request · Requester · Risk · Due · (actions) |
| Certification Item | Identity · Access · Risk · Last reviewed · (decision) |
| SoD Violation | Identity · Policy · Severity · Detected · Status |

> Keep column sets stable across the product. A "Status" column always uses the same status-chip
> component and the same intent→color mapping; "Risk Score" always uses `RiskScoreChip`.
