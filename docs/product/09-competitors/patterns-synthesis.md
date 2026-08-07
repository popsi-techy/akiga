# Competitor Patterns — Synthesis

Inspiration, not imitation. We build an **original** product; this distills what the landscape does
well and where it fails, so our UX is modern by default. Landscape reference:
`registries/product/competitors.json`.

## Patterns worth borrowing (and making our own)
- **Access packages / bundles** (Entra, roles everywhere): let users request a meaningful bundle,
  not raw permissions. → our **Roles** + curated catalog.
- **Risk-based decisioning** (Saviynt, SailPoint): surface risk at the point of approval/review.
  → our **risk badge everywhere + request risk = max item risk**.
- **Frictionless self-service request** (Lumos, Zluri, Okta): catalog → cart → submit in minutes.
  → our **Phase-2 flagship journey**, kept simple and guided.
- **Rigorous certifications** (SailPoint): scoped campaigns, reviewer inboxes, bulk decisions,
  evidence. → our **shared inbox pattern + campaign progress + export**.
- **Break-glass with mandatory review** (CyberArk): emergency access that's time-bound and
  reviewed. → our **BR-EMERGENCY rules + countdown UI**.
- **Posture/analytics framing** (Palo Alto): a governance dashboard that leads with exposure. →
  our **action-first dashboard + KPI tiles**.

## Anti-patterns to avoid (learned from their weaknesses)
- **Density without hierarchy** (legacy IGA): screens that overwhelm. → *calm density*, scannable.
- **Module-to-module inconsistency** (Saviynt, Entra portals): every area looks/behaves
  differently. → our **Design System + shared patterns** exist precisely to prevent this.
- **Terminology drift** (Entra): the same concept named differently across screens. → our
  **canonical glossary + terminology rules**.
- **Config complexity leaking to end users**: admins' complexity shouldn't reach requesters. →
  **permission-aware, role-appropriate UI**.
- **Chat-only flows that skip evidence** (some SaaS tools): fast but not auditable. → we keep
  **speed *and* evidence**.

## Our differentiation thesis
> Modern, consumer-grade ease of use **without** sacrificing governance depth or auditability —
> one consistent system across every module, risk visible where decisions happen, and evidence
> produced automatically.

> This is the one competitor doc we maintain. Deep per-vendor screen tear-downs are out of scope
> unless a specific decision needs one — then add a focused note and cite public sources only.
