# Personas

> **Populated.** The **rich, normative source of truth for all personas** (responsibilities,
> goals, pain points, permissions, journeys) is `registries/product/personas.json`. Per-persona
> narrative files are created on demand only when a persona needs explanation beyond the registry.
> See also `../permission-matrix.md` and `../user-journeys.md`.

## Expected personas (initial set — extend as needed)

| Persona | ID | One-line |
|---------|----|----------|
| Administrator | `administrator` | Configures and operates the IGA platform. |
| Reviewer | `reviewer` | Approves/denies access requests and reviews certifications. |
| End User | `end-user` | Requests access and manages their own entitlements. |
| Auditor | `auditor` | Inspects evidence and compliance posture (often read-only). |
| Application Owner | `application-owner` | Accountable for an application and its access. |
| Role Owner | `role-owner` | Accountable for the definition and membership of a role. |
| Entitlement Owner | `entitlement-owner` | Accountable for a specific entitlement. |
| Manager | `manager` | Approves access for and certifies their direct reports. |

> This list is a starting point, not a limit. Add personas (e.g. Security Analyst, Help Desk)
> as the domain requires — each with a registry entry.
