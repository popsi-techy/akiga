---
status: accepted
date: 2026-08-16
deciders: Product Design, Frontend
---

# 11. SoD rules are one boolean expression, versioned once the policy is live

## Context

The admin side of SoD Policies needed a way to author what counts as a conflict.
`registries/product/feature-catalog.json` has carried `sod-policy-management` since phase 3, and
`/iga/sod-policies` was already in the navigation registry, but nothing was built behind it — the
nav item 404'd, and `sodPolicies` in `sod-seed.ts` was a four-field stub read only by the reviewer
console to label a violation.

Two modelling questions had to be answered before any UI:

1. **What shape is a rule?** The obvious model is two sides — set A conflicts with set B — which is
   how most IGA products state it. But real rules are not always two-sided ("any of these three
   initiating permissions together with either of these two approving ones"), and a two-sided model
   answers that by adding a third concept on top of the two.
2. **What happens when a live rule changes?** A conflict raised last month was raised by a specific
   rule. If that rule was overwritten, the violation record points at something that no longer says
   what it said.

## Decision

**A ruleset is a single boolean expression over access items** — entitlements and technical roles as
leaves, `AND`/`OR` groups as nodes, nesting capped at one level below the root. A user is in
violation when the expression is true of the access they hold. The two-sided conflict falls out of
this for free as `(A OR B) AND (C OR D)`, so the model carries it without naming it.

Business roles are deliberately not selectable. A business role is a job description, and a rule
written against one hides which permissions actually conflict — the one thing the reviewer needs
when it fires.

**A draft policy's ruleset is edited in place; a live policy's is superseded.** A draft has never
enforced anything, so there is no history worth protecting and a version counter that reached 9
before the policy was ever switched on is noise. Once the policy is active, every save writes a new
version, marks the previous one superseded and keeps it, with a "what changed" note captured at the
point of change.

Supporting decisions:

- **Status is `draft | active | inactive`, not a boolean.** "Never switched on" and "deliberately
  switched off" are different answers to the question an auditor actually asks.
- **Activation is gated on the ruleset only.** Owners make a policy better governed, not
  functional; blocking a detection control on a missing owner is the wrong trade. One definition
  (`sodPolicyNextSteps`) feeds both the Overview checklist and the Activate button, so a disabled
  button can never sit above a checklist claiming everything is done.
- **Owners reuse `EntityOwnersTab`** via a new `sod-policy` member of `OwnedEntityType`. Governance
  teams do not own SoD policies, so `canGovernanceTeamsOwn` was derived from the same map the team
  lookup uses and the rail drops itself rather than offering an always-empty view.

## Consequences

- The reviewer console (`sod-resolution-v3`) and this admin surface now share `sod-types.ts` and the
  access catalog and nothing else: this file owns the *rules*, `sod.ts` owns the *reviews*.
- `SodPolicy` gained `status`, `createdOn` and `updatedOn`, so the four seeded policies grew those
  fields. The reviewer console reads only `name`/`severity` and is unaffected.
- Superseded versions accumulate. Nothing prunes them yet; at real volume that needs a retention
  answer.
- Detection is not implemented — saving a ruleset does not yet raise violations against it. The
  expression model is the input that work will need.
- The nesting cap is a product judgement, not a limit of the model: `lib/sod-ruleset.ts` handles
  arbitrary depth, and only the builder refuses to add a third level.

## Alternatives considered

- **Two explicit sides (set A vs set B).** Matches how the domain is usually spoken about and makes
  a simpler first screen, but cannot express a one-sided or three-way rule without a second concept
  bolted alongside it.
- **Reuse `ConditionBuilderDrawer` from the automation module.** The same AND/OR shape, already
  built — but its leaves are attribute comparisons (`department = Finance`), and an SoD leaf is a
  reference to a catalog item picked from a drawer. Sharing would have meant a leaf-type union
  inside a component that currently has one clear job.
- **Version every save, including on drafts.** Uniform and simpler to explain, but it fills the
  history of a policy that has never done anything with the noise of building it.
