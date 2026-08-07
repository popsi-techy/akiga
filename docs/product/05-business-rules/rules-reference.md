# Business Rules — Reference

The precise behavior of the product, grouped by area. **Normative source of truth:**
`registries/product/business-rules.json` (stable `BR-` IDs). This page explains the logic and its
UX implications. These are **enterprise defaults** — change any via a PDR.

## Approval (`BR-APPROVAL-*`)
- **Routing** (`001`): manager → then owners of requested items; high/critical risk adds a step.
  Show the full chain and current step.
- **Escalation** (`002`): overdue after 3 business days → escalate to approver's manager; never
  auto-approve. Overdue = warning intent.
- **No self-approval** (`003`): can't approve your own request; escalate instead.

## Risk (`BR-RISK-*`)
Score is a weighted sum of active factors, bucketed:

| Score | Level | Intent |
|-------|-------|--------|
| 0–24 | Low | success/neutral |
| 25–49 | Medium | info |
| 50–74 | High | warning |
| 75–100 | Critical | error |

- Factors: privileged access, SoD exposure, dormancy, access breadth (weights in
  `risk-factor` entities).
- **Request risk** = max item risk, +1 level if it introduces an SoD conflict. Approvers see risk
  before deciding. **One badge, one color mapping, everywhere.**

## Ownership (`BR-OWNERSHIP-*`)
- Every application/entitlement/role **must** have an active owner; ownerless objects are flagged
  and routed to admin. Owner is required at create time.
- Ownership transfer preserves history and reassigns the prior owner's open approval tasks.

## Certification (`BR-CERT-*`)
- **Assignment**: user-access → manager; app/role/entitlement → owner; else admin.
- **Revoke → deprovision** (simulated); revoke requires a comment. Certify records evidence
  (reviewer, time, comment).
- **No self-certification**: reassign self items to manager.

## Access duration (`BR-DURATION-*`)
- Permanent or time-bound (30/90/custom). Time-bound auto-expires, notifies 7 days prior, and
  offers renewal. **High-risk access defaults to time-bound.** Show a countdown on granted access.

## Emergency access (`BR-EMERGENCY-*`)
- Always time-bound (**default 4h**), auto-expires, never permanent. Prominent countdown.
- **Mandatory post-use review** by admin; unreviewed grants stay flagged.

## Separation of Duties (`BR-SOD-*`)
- **Preventive** policies block at request time (or require a justified, time-bound exception) —
  show both conflicting sides inline in the cart.
- **Detective** policies don't block; they raise an **open violation** for remediation.
- **Exceptions** need justification + expiry; on expiry the violation reopens.

## Lifecycle / JML (`BR-LIFECYCLE-*`)
- **Joiner**: birthright roles from department/title; exceptions → manager.
- **Mover**: compute access delta; risky removals need manager confirmation; show before/after
  diff.
- **Leaver**: revoke all access + disable accounts by effective date; residual access is flagged.

---
### How AI should use this
When generating any logic-bearing screen, find the relevant `BR-` rule(s) in `business-rules.json`
and honor both the **logic** and the **`ui` hint**. If a needed behavior isn't covered by a rule,
that's a gap — raise it in `12-decisions/open-questions.md` (and add a PDR + rule) rather than
inventing behavior silently.
