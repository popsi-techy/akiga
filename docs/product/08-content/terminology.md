# Terminology — preferred vs. avoided

Consistent words build enterprise trust. Use the **preferred** term everywhere in the UI and
docs; avoid the alternatives (they exist across competitors and create confusion).

| Concept | ✅ Use | 🚫 Avoid | Why |
|---------|--------|----------|-----|
| Unit of access | **Entitlement** | Permission, Privilege, Grant | One canonical noun; "permission" is overloaded |
| Access review | **Certification** | Recert, Attestation (as a noun for the campaign), Review campaign | Single term for the feature; "certify" is the verb |
| Toxic combo | **SoD Violation** | Conflict, Toxic combination | Precise, audit-aligned |
| Break-glass | **Emergency Access** | Firefighter, Privileged access | Clear to non-experts |
| Grant access in target | **Provision** | Fulfill, Push, Sync (as the user-facing verb) | Standard IGA verb |
| Person/actor | **Identity** | User, Account (when you mean the person) | "Account" is app-specific; "identity" is the person |
| Request decision | **Approve / Reject** | Accept/Deny, Grant/Decline | Two consistent verbs |
| Review decision | **Certify / Revoke** | Keep/Remove, Confirm/Delete | Distinct from approve/reject |

## Verb conventions (buttons & actions)
- Requests: **Approve**, **Reject**, **Submit**, **Withdraw**.
- Certifications: **Certify**, **Revoke**, **Reassign**, **Sign-off**.
- Lifecycle: **Provision**, **Deprovision**, **Revoke**.
- Generic CRUD: **Create**, **Edit**, **Delete**, **Duplicate**.
- Never invent a new verb when one above fits.

## Capitalization
- Entity names in running text are lowercase ("the entitlement"), Title Case when used as a
  proper UI label or column header ("Entitlement").
- Product module names are Title Case ("Access Requests").

> This is the enforcement layer for the glossary. When copy and this table disagree, this table
> wins; fix the copy.
