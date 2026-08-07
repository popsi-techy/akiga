# What is Identity Governance & Administration?

**IGA** answers one question continuously: *"Who has access to what, is it appropriate, and can
we prove it?"* It combines **administration** (granting/changing/revoking access) with
**governance** (policies, approvals, reviews, and audit that keep access appropriate over time).

## The problem it solves
In any enterprise, access accumulates. People join, move teams, and leave; apps multiply; grants
are made "temporarily" and never revoked. The result is **over-entitlement** — a security risk
and an audit failure. IGA replaces ad-hoc, spreadsheet-driven access management with a governed,
auditable process.

## The core loop (mental model)
```
Request  →  Approve  →  Provision  →  Use  →  Review (certify)  →  Revoke/Renew
   ▲                                                                      │
   └──────────────────────── governed & audited throughout ──────────────┘
```
Every step is policy-checked (SoD, risk, approval rules), time-aware (expiry, renewal), and
logged (audit evidence).

## Where IGA sits (adjacent, not us)
| Category | Focus | Relationship to IGA |
|----------|-------|---------------------|
| **IdP / SSO** (e.g. Entra, Okta) | Authentication — *who you are* | IGA governs *what you can access*; often consumes an IdP |
| **PAM** (e.g. CyberArk) | Privileged sessions & secrets | IGA governs the *entitlement* to privilege; PAM controls the *session* |
| **IAM** (broad) | Umbrella for identity + access | IGA is the *governance* layer of IAM |
| **ITSM** (e.g. ticketing) | General service requests | IGA specializes the *access* request with policy & provisioning |

## Why governance is non-negotiable
Regulations (SOX, GDPR, HIPAA, SOC 2, ISO 27001) require organizations to prove access is
appropriate and reviewed. That's why the product enforces approvals, certifications, SoD, and an
immutable audit trail — not as features, but as the reason IGA exists. See `06-compliance/`.

> For UI generation: this framing explains *why* screens carry justification fields, risk
> badges, approval chains, expiry dates, and audit links. They are the product, not decoration.
