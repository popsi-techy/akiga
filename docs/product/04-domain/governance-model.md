# Governance Model

**How organizational structure, access, policies, ownership and governance controls connect —
and the surface that lets an administrator read it.**

> Reference doc. The normative source is `registries/product/entities.json` +
> `relationships.json` and the code in `apps/design-system/src/data/governance*.ts`.
> The decision behind it is [ADR-0010](../../architecture/decisions/0010-governance-model-and-relationship-canvas.md).

The Directory ([`ADR-0008`](../../architecture/decisions/0008-directory-entities-and-risk-scale.md))
answers *what exists*. The Governance Model answers *who is responsible for it, under what rules,
and what breaks when nobody acts*.

---

## 1. The three questions

Everything in this model exists to answer three questions well. If a change to it does not make
one of them easier to answer, it does not belong.

| Question | Answered by |
|---|---|
| **What is connected?** | The Governance Map — a layered relationship graph |
| **Why is it connected?** | Typed relationships with a verb, and the relationship card |
| **Who is responsible?** | Ownership, governance roles, approval hierarchy, delegation, escalation |

---

## 2. Layers

Six layers, read left to right. They are the spine of the model and the columns of the map.

```
Organization  →  Roles           →  Access         →  Controls           →  Chain        →  Responsibility
Department       Business Role      Application       Birthright Policy     Delegation      Governance Role
Location         Technical Role     Entitlement       Approval Policy       Escalation      Person
                                                      Approval Workflow        Rule
                                                      SoD Policy
```

**Relationships are authored to flow left to right**, toward responsibility. An application is
`owned by` a person, never the reverse. That single rule is what keeps the map a readable layered
graph instead of a hairball, and what makes a governance trace an ordered chain instead of an
undirected walk. The two relationships that legitimately point back up the model
(`applies to`, from a policy down into a department) are drawn as a return sweep beneath the
columns, so direction reads from the shape alone.

---

## 3. Entities

Every governable thing has the same shape (`GovEntity`): a name, a description, a 0–100 risk
score, a status, compact metrics, its organizational scope, its three ownership fields, and audit
metadata. That uniformity is what lets one canvas, one explorer table, one details panel and one
findings engine cover fourteen kinds without fourteen special cases.

| Kind | What it is | Where the data comes from |
|---|---|---|
| **Department** | An organizational unit access is scoped by | `governance-seed.ts` |
| **Location** | A site or country, with its regulatory constraints | `governance-seed.ts` |
| **Business Role** | Access bundled for a job | `seed.ts` (Directory) |
| **Technical Role** | Access bundled for a system | `seed.ts` (Directory) |
| **Application** | A governed system | `seed.ts` + governance scope |
| **Entitlement** | A grantable unit of access | `seed.ts` (Directory) |
| **Birthright Policy** | Grants automatically on assignment — no request, no approval | `governance-seed.ts` |
| **Approval Policy** | Decides requests at request time | `seed.ts` + governance metadata |
| **Approval Workflow** | Carries the decision out at runtime | `governance-seed.ts` |
| **SoD Policy** | Constrains what may be held together | `sod-seed.ts` + governance scope |
| **Delegation** | Temporary transfer of approval authority | `governance-seed.ts` |
| **Escalation Rule** | What happens when nobody acts in time | `governance-seed.ts` |
| **Governance Role** | A named accountability, staffed by a Governance Group | `governance-seed.ts` |
| **Person** | A User Identity acting in a governance capacity | `seed.ts` (Directory) |

### Ownership is three things, not one

`ownerIds` · `reviewOwnerIds` · `approvalOwnerIds` are modelled separately **on purpose**.

- The **owner** is accountable for the object: its configuration, its access model, its risk.
- The **access review owner** certifies who should keep the access at review time.
- The **approval owner** decides requests before access is granted.

Conflating them hides the governance failure this surface exists to expose: certification is
meant to be an independent check on the owner's decisions, and when the same person holds both,
the review confirms the grants that person made. That is the `conflicting-ownership` finding.

---

## 4. Relationships

A closed set. Each type has a verb and a definition, and the verb is drawn on the edge — a line
that does not say *why* two things are connected is not worth drawing.

| Type | Reads as | Means |
|---|---|---|
| `operates-in` | operates in | The unit has people and access in this location |
| `assigned-through` | assigned through | Access reaches its holder by way of this role or path |
| `inherited-from` | inherited from | Permissions come from the target, not granted directly |
| `grants` | grants | The source confers this entitlement on whoever holds it |
| `governed-by` | governed by | Requests for this access are decided under the target policy |
| `protected-by` | protected by | An SoD control constrains what may be held alongside this |
| `applies-to` | applies to | The policy takes effect across this part of the organization |
| `enforced-by` | enforced by | The control is carried out by this workflow or governance role |
| `owned-by` | owned by | Accountable for the object itself |
| `reviewed-by` | reviewed by | Accountable for certifying who keeps this access |
| `approved-by` | approved by | Decides requests before access is provisioned |
| `delegated-to` | delegated to | Authority temporarily transferred to this person |
| `escalates-to` | escalates to | Where the decision moves when a level does not act |
| `held-by` | held by | The people who staff this governance role |

Adding a new kind of connection means adding a reviewed type here — never an untyped edge at a
call site.

---

## 5. Governance findings

Findings are **derived from the model, never authored**. A gap exists because the data says so,
so a finding can never contradict what the screens show.

| Finding | Detected when |
|---|---|
| `missing-owner` | An application or role has no accountable owner |
| `missing-review-owner` | An application is provisioned but nobody certifies its access |
| `missing-policy-owner` | A policy is in force with no owner |
| `broken-approval-chain` | An approval level resolves to an approver that does not exist |
| `unmanaged-delegation` | Delegated authority has no end date |
| `expired-delegation` | A lapsed delegation is still referenced by an active chain |
| `escalation-gap` | A chain has no escalation rule, or a rule has an unassigned level |
| `sod-conflict` | An SoD policy has unresolved violations |
| `orphaned-policy` | A policy grants nothing and applies to nothing |
| `uncontrolled-application` | An application has access but no birthright or approval policy |
| `conflicting-ownership` | The same person owns an application and certifies access to it |

**Every finding answers five questions** — what is wrong, why it matters, what is affected, who
is accountable, and what should be fixed. A finding is never a bare label. Where the fix has a
screen, the finding links to it; where it does not, the recommended action is stated as guidance
rather than rendered as a button that does nothing.

### Seeded gaps — do not "fix" these

The demo data carries deliberate gaps, marked `GAP:` in `governance-seed.ts` and `seed.ts`. They
are what make the surface demonstrable:

- **SAP S/4HANA Finance** has no owner and no access review owner.
- **Snowflake** and **Jira** have no access review owner.
- **Financial Controller** (business role) has no owner.
- **Contractor Baseline — India** (birthright policy) has no policy owner.
- **Finance Applications** approval chain has an unresolvable level 3 (SAP's missing owner).
- **Contractor Onboarding** has no escalation rule on any level.
- **Finance Escalation** has an unassigned level 2 and no terminal action.
- **Marcus Lee → Catherine Brown** delegation has no expiry; **Hana Kim → Bob Smith** has lapsed.
- **Executive Access Birthright** is attached to nothing.
- **ServiceNow** is governed by no policy, and its owner is also its review owner.

---

## 6. The surface

Route `/iga/governance-explorer` · nav **Analytics → Governance Explorer** · page title
**Governance Model**.

A **canvas archetype** page (visual-language §8): the frame's padding is cancelled, the page never
scrolls, only inner regions do.

```
+-- header band 64h -----------------------------------------------------------+
|  [icon] Governance Model + lead        [search] [Filters] [Map|Explorer] [⋮]  |
+-- health bar 67h ------------------------------------------------------------+
|  Coverage | High-risk | Ownership gaps | Policy conflicts | SoD | Approval    |
+-- scope chips (only when filtered) ------------------------------------------+
+------------------------------------------------------------------------------+
| [ domains rail ] [   Map  |  Explorer   ] [ details 340 ]                     |
+------------------------------------------------------------------------------+
```

### View A — Governance Map

A rooted neighbourhood, never the whole model. `buildGraph(rootId, expanded, filters)` draws the
root's relationships plus one auto-revealed ring, capped per relation type; the remainder is a
`+N` count on the node the user can expand. Roughly twenty nodes, always.

- **Focus mode** dims everything not one relationship from the selection.
- **Risk view** dims everything below High that has no finding.
- Both **de-emphasise, never recolour** — a map that turns red when you ask about risk stops
  being readable exactly when it matters.
- Clicking a **line** opens the relationship card: what it means, scope, effective status, risk
  implication, owner, last modified.

### View B — Governance Explorer

Five tabs, each one of the questions an administrator arrives with:

| Tab | Answers |
|---|---|
| **Relationships** | What governs each entity, and where the gaps are |
| **Ownership** | Who owns what, and coverage — gaps sorted first |
| **Approval hierarchy** | Whether a request can actually get from requester to provisioned |
| **Delegation & escalation** | Who is deciding on someone's behalf, and what happens if nobody does |
| **Findings** | Every gap, grouped by kind, with its drill-down |

### Shared state

Selection, scope, filters and risk context live on the **page**; neither view owns state.
Switching views is therefore lossless by construction rather than by synchronisation.

The details surface changes role with the view, because the protagonist does: a persistent
context rail beside the map (≥1280px), an overlay over the Explorer table — where the table is the
protagonist and the relationship matrix needs its full width.

### Trace governance

The differentiator. From any entity, `traceGovernance()` walks forward three hops and reports what
it reached in a fixed order — departments, locations, roles, applications, entitlements, policies,
workflows, SoD, delegations, escalations, governance roles, people. The order is fixed rather than
derived, because the value of a trace is that it always answers the same questions in the same
sequence: what grants this, what it reaches, what governs it, who decides, and who is accountable
when nobody does.

---

## Related

- [ADR-0010](../../architecture/decisions/0010-governance-model-and-relationship-canvas.md) — the decision
- [ADR-0008](../../architecture/decisions/0008-directory-entities-and-risk-scale.md) — canonical entities, risk scale
- [ADR-0007](../../architecture/decisions/0007-automation-canvas-approach.md) — the custom-canvas precedent
- [`relationships.md`](./relationships.md) — the full ERD
- Design System → Components → Relationship Canvas
