# 12 · Product Decisions & Open Questions

The system for recording **why the product behaves as it does**, and for tracking what we don't
yet know.

> **Status:** structure defined, content not yet populated.

## Product Decision Records (PDRs)

A **PDR** captures a durable decision about *product behavior* — so a future AI never silently
reverses it. PDRs are authored from `_templates/pdr.template.md`, numbered sequentially, and
immutable once accepted (supersede, never rewrite).

Every PDR records: **Date · Decision · Context · Reason · Alternatives · Impact.**

| Document | Purpose |
|----------|---------|
| `0000-pdr-template.md` | The PDR template (also mirrored in `_templates/pdr.template.md`). |
| `NNNN-<title>.md` | One decision each (e.g. "Emergency access auto-expires after 4 hours"). |
| `open-questions.md` | The living log of unresolved questions and unverified assumptions. |

### PDR vs. ADR — which one?

| Question | Record type | Location |
|----------|-------------|----------|
| Does it change **product behavior / policy**? | **PDR** | `docs/product/12-decisions/` |
| Does it change **how it's built** (architecture, tooling)? | **ADR** | `docs/architecture/decisions/` |
| Both? | Write both, cross-linked. | — |

Business rules (`business-rules.json`) cite the PDR that justifies them. Amending product
behavior requires a PDR before the rule changes.
