# 02 · Users, Permissions & Journeys

Who uses the product, what they're allowed to do, and the end-to-end flows they drive.

> **Populated.** · **Feeds:** `personas.json`, `permissions.json`, `journeys.json`

| Document | Purpose |
|----------|---------|
| `personas/README.md` | Explains the persona model and points to the per-persona files. Each persona uses `_templates/persona.template.md`. |
| `personas/<persona>.md` | One file per persona (Administrator, Reviewer, End User, Auditor, Application Owner, Role Owner, Entitlement Owner, Manager, …): responsibilities, goals, pain points, permissions, primary journeys. |
| `permission-matrix.md` | **The product's own capability matrix** — which persona/role can perform which action on which entity. The canonical source for the constitution's "permission-aware UI" requirement. Mirrored in `permissions.json`. |
| `user-journeys.md` | **Cross-persona, end-to-end journeys** that stitch personas together (e.g. Joiner → access request → manager approval → provisioning → certification). Where IGA's value actually lives. Mirrored in `journeys.json`. |

> Personas describe *people*; journeys describe *flows across people*. Permissions are defined
> **once** in the matrix and only referenced (by action ID) elsewhere.
