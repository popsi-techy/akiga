# 07 · Product Experience

Product-level UX **principles and catalogs** — the "how the product should feel and behave"
that sits *above* the Design System. This section defines *what good looks like* for this
product; the Design System later decides *how* to render it. No components or tokens here.

> **Populated.** · **Feeds:** `metrics.json`, `notifications.json`

| Document | Purpose |
|----------|---------|
| `ux-principles.md` | **The product's UX philosophy** — the small set of principles every screen must honor (clarity over density, guided over open-ended, safe destructive actions, etc.). |
| `interaction-patterns.md` | **Philosophies for recurring surfaces** — navigation, dashboards, forms, tables, search, filters, drawers, wizards. *When and why* to use each, at the product level (the Design System implements the *how*). |
| `state-experience.md` | **The product's stance on empty, loading, error, and success states** — what each should communicate and when. The behavioral contract the Design System's state components fulfill. |
| `notifications-catalog.md` | **Every notification type** — trigger, audience, channel, urgency (e.g. "approval pending", "certification due", "access expiring"). Mirrored in `notifications.json`. |
| `metrics-and-kpis.md` | **Definitions of every KPI/metric** surfaced on dashboards and reports (risk score, certification completion %, SoD violations, orphan accounts). Without definitions, dashboards are decoration. Mirrored in `metrics.json`. |
| `reporting-catalog.md` | **Standard reports** the product provides — purpose, audience, contents, and the metrics/entities each draws on. |

> Boundary: this section says *"dashboards lead with risk posture and pending actions."* The
> Design System says *"here is the Card/Chart component."* Keep that line clean.
