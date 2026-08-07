# Entity: <Name>

- **ID:** `<kebab-id>` (must match `entities.json`)
- **Definition:** <one precise sentence — what this entity *is*>
- **Owner persona:** `<persona-id>` (who is accountable for it)
- **Module:** `<module-id>`

## Why it exists
The business/compliance reason this entity is part of an IGA system.

## Attributes
The fields that describe this entity. For each: name, type, required?, description, example.
This is the attribute-level detail the data dictionary aggregates. Do **not** invent UI here —
just the data.

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| | | | |

## States & lifecycle
The states this entity can be in and the legal transitions between them. Reference
`lifecycle-states.json`. If the entity is stateless, say so explicitly.

## Relationships
How this entity relates to other entities (has-many, belongs-to, grants, requires, conflicts-with,
etc.). Reference entity IDs; the canonical edges live in `relationships.json`.

## Governing rules
Business rules (`business-rules.json` IDs) that constrain this entity's creation, modification,
ownership, or deletion.

## Compliance relevance
Which controls/regulations (`compliance-controls.json`) touch this entity (e.g. subject to
certification, requires audit evidence, SoD-sensitive).

---
> Update `entities.json` (and `relationships.json` if edges change) in the same change.
