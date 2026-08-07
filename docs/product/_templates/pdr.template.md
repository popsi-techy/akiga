# PDR-0000: <short, present-tense product decision>

- **Status:** Proposed | Accepted | Superseded by PDR-XXXX | Deprecated
- **Date:** YYYY-MM-DD
- **Deciders:** <who>
- **Affected:** <module / entities / rules / personas affected>
- **Tags:** <e.g. certification, risk, access-request>

## Context
The product situation or force requiring a decision. What problem are we solving, for which
persona, under what constraints (business, regulatory, UX)? State facts.

## Decision
The product decision, stated plainly: "The product will …". Specific enough that a business rule
or journey can be written from it directly.

## Reason
Why this is the right call — the driver (user need, compliance requirement, competitive gap,
simplicity). Cite the regulation/control or research if relevant.

## Alternatives considered
Each realistic option and why it was **not** chosen.

## Impact
What this changes: which business rules (`BR-` IDs), entities, journeys, metrics, or
notifications must be created or updated as a result.

---
> A **PDR** governs *product behavior* ("emergency access expires after 4 hours"). A technical
> choice is an **ADR** instead (`docs/architecture/decisions/`). One decision may need both.
> Copy this file to `NNNN-title.md`, increment the number, and never rewrite a decided PDR —
> supersede it.
