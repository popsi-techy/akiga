# Glossary

The canonical vocabulary of the product. **A term must exist here before it appears in any doc
or UI.** The machine-readable source of truth is `registries/product/glossary.json`; this page is
the readable view grouped for onboarding.

> Rule: use the **preferred** term in all UI. Synonyms are for recognition only — never mix them
> in the interface (e.g. always "Entitlement", never "Permission", in product copy).

## Core identity & access
- **Identity** — a person or non-human actor governed by the platform.
- **Account** — an identity's login within one application (an identity may have many).
- **Application** — a governed system that holds accounts and access.
- **Entitlement** *(preferred over "permission")* — a grantable unit of access within an app.
- **Group** — a collection used to grant access to many identities at once.
- **Role** — a business-meaningful bundle of entitlements (role-based access).

## Access lifecycle
- **Access Request** — a request to grant/revoke access, subject to policy and approval.
- **Approval** — an approve/reject decision by an authorized approver.
- **Approval Policy** — who must approve what, in what order, with escalation/timeouts.
- **Workflow** — an orchestrated sequence of steps triggered by an event.
- **Provisioning** — granting access in a target app (deprovisioning = revoking). *Simulated.*

## Governance & compliance
- **Certification** *(= access review / attestation)* — periodic confirmation that access is
  still appropriate.
- **Certification Campaign** — a scoped, scheduled instance of a certification.
- **Separation of Duties (SoD)** — control preventing toxic access combinations.
- **SoD Violation** — a detected conflicting combination.
- **Risk** — a score/level indicating sensitivity/exposure, used to prioritize.
- **Emergency Access** *(= break-glass)* — time-bound elevated access with mandatory review.
- **Audit Trail** — immutable, timestamped record of actions; compliance evidence.

## Identity lifecycle (JML)
- **Joiner / Mover / Leaver (JML)** — the identity lifecycle events.
- **Birthright Access** — access auto-granted from attributes, no request needed.
- **Orphan Account** — an account with no owning identity (a risk).

## Ownership
- **Application / Role / Entitlement Owner** — the person accountable for a given object's access
  appropriateness and approvals.

> Full definitions, synonyms, and relations: `registries/product/glossary.json`. Add new terms
> there **and** here, together.
