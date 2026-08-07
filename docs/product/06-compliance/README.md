# 06 · Compliance & Regulatory

**Why the product behaves the way it does.** IGA exists largely to satisfy regulations —
certifications, SoD, audit trails, and least-privilege are compliance-driven, not cosmetic. An
AI that doesn't understand this will design flows that quietly break compliance intent.

> **Populated.** · **Feeds:** `compliance-controls.json`

| Document | Purpose |
|----------|---------|
| `regulatory-context.md` | **The regulations that shape the product** — SOX, GDPR, HIPAA, SOC 2, ISO 27001, NIST — described in terms of what each *requires of an IGA system* (not legal advice). |
| `audit-and-evidence.md` | **The audit trail & evidence model** — what must be logged, immutability expectations, what auditors need to see and export, and retention concepts. Shapes nearly every mutation in the product. |
| `controls-mapping.md` | **Feature → control mapping** — which product capabilities and business rules satisfy which compliance controls. Mirrored in `compliance-controls.json`. |

> This section explains intent, not legal obligation. Where a business rule exists *because* of
> a control, the rule (`BR-` id) cites the control id defined here.
