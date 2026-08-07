# Regulatory Context

Why the product enforces what it does. **Not legal advice** — a working model of what regulations
expect from an IGA system, so UX decisions carry the right weight. Source of truth:
`registries/product/compliance-controls.json`.

| Regulation | What it expects of IGA | Shows up in the product as |
|-----------|------------------------|----------------------------|
| **SOX** | Controlled, reviewed, separated access to financial systems | Certifications, SoD, approvals, audit trail |
| **GDPR** | Least-privilege access to personal data; accountability | Time-bound access, risk scoring, audit trail |
| **HIPAA** | Minimum-necessary access to health data; audit | Least-privilege, certifications, audit trail |
| **SOC 2** | Logical access controls, monitoring, change mgmt | Approvals, reviews, lifecycle, audit |
| **ISO 27001** | Access control policy, periodic review, SoD | Policies, certifications, SoD |
| **NIST 800-53/CSF** | AC family: least privilege, SoD, account mgmt | Lifecycle, SoD, emergency access, approvals |

## The through-line
Regulations don't ask for features; they ask to **prove** that access is *authorized*,
*appropriate*, *reviewed*, and *separated* — continuously and with evidence. That is exactly the
core loop (`01-overview/what-is-iga.md`). This is why:
- approvals and certifications **cannot be skipped or self-served**,
- **evidence** is produced by every governance action,
- **SoD** and **least-privilege** are enforced, not optional.

> For UI: this is the justification behind justification fields, approval chains, review comments,
> expiry dates, and audit links. Don't treat them as friction to minimize away.
