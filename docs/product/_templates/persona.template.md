# Persona: <Name>

- **ID:** `<kebab-id>` (must match `personas.json`)
- **Type:** Human user | System/service | Auditor (external)
- **One-line:** <who they are in a sentence>

## Responsibilities
What this persona is accountable for in the organization.

## Goals
What they are trying to achieve when they use the product. Outcome-oriented, not feature-oriented.

## Pain points
The frustrations, risks, and friction they experience today (with or without an IGA tool).

## Permissions
The capabilities this persona has. Reference action IDs from `permissions.json` — do not restate
the matrix here; link to it.

## Primary journeys
The end-to-end flows this persona drives or participates in. Reference journey IDs from
`journeys.json`.

## Key entities they interact with
Which business entities (from `entities.json`) they create, review, own, or consume.

## Success looks like
How we know the product served this persona well (ties to `metrics.json`).

---
> Keep implementation-free. No screens, no components — that's the Design System's job.
> Update `personas.json` in the same change.
