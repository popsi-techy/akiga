# 11 · Sample / Seed Data

The canonical, deterministic mock dataset the prototype uses everywhere. The constitution
requires "deterministic, seedable mock data" — this section defines it **once** so every screen
shows a coherent, believable organization instead of ad-hoc fixtures.

> **Populated.**

| Document | Purpose |
|----------|---------|
| `sample-data-strategy.md` | **The seed-data strategy** — the fictional organization (departments, sample identities, applications, roles, entitlements, requests, certifications), how it's kept realistic and internally consistent, how it maps to the entities in `entities.json`, and the principles for determinism (same data every load) and volume (enough to exercise pagination, filtering, empty states). |

> This defines the *strategy and shape* of the data, not the fixtures themselves. The actual
> seed files live with the implementation (`packages/core`) and conform to what's specified here.
> No real people, credentials, or PII — ever.
