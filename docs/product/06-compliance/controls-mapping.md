# Controls Mapping

Which product capabilities and rules satisfy which compliance controls. Source of truth:
`registries/product/compliance-controls.json`. Use this to understand *why a feature exists* and
what must not be compromised when designing it.

| Control | Regulations | Satisfied by (features) | Key rules |
|---------|-------------|-------------------------|-----------|
| Periodic access review | SOX, SOC2, ISO27001, NIST | Certifications | BR-CERT-001/002 |
| Separation of duties | SOX, ISO27001, NIST | SoD policy & violations | BR-SOD-001/002/003 |
| Least privilege | GDPR, HIPAA, SOC2, NIST | Access request, Risk | BR-DURATION-001, BR-RISK-001 |
| Access approval | SOX, SOC2, ISO27001 | Approvals | BR-APPROVAL-001/003 |
| Provisioning & deprovisioning | SOX, SOC2, ISO27001, NIST | Lifecycle (JML) | BR-LIFECYCLE-001/003 |
| Emergency/privileged access | SOX, SOC2, NIST | Emergency access | BR-EMERGENCY-001/002 |
| Audit trail & evidence | all | Audit, Reports | — |

## How to use this
- When building a feature in the "Satisfied by" column, the linked **rules are non-negotiable** —
  they're the reason the control is met. Don't design them away for UX convenience; find a UX that
  keeps the control intact.
- New compliance-relevant behavior → add a control here and link it to the feature/rule.

> Mapping only. The behavior itself lives in `05-business-rules/`; the "why" in
> `regulatory-context.md`.
