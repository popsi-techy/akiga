# Non-Functional Product Qualities

Product-level commitments that apply to every screen, independent of feature. These are
acceptance criteria, echoed in the Design System and the Definition of Done.

## Security (prototype-appropriate)
- **No real credentials, secrets, or PII** — ever. Auth is mocked; sample identities are
  fictional.
- **Model least-privilege in the UI**: the product *demonstrates* good governance — permission-
  and state-aware actions, guarded destructive operations, visible audit.
- No action that would be dangerous in production is a no-op that looks real without a guard.

## Accessibility
- **WCAG 2.1 AA is the floor** (product value, not just a DS rule): keyboard operability, visible
  focus, AA contrast, correct semantics, reduced-motion respect. Governance tools are used by
  everyone; inaccessible = broken.

## Performance
- Lists must stay responsive at **realistic enterprise volumes** (thousands of rows) — virtualize
  or paginate; never render 10k DOM rows.
- Heavy surfaces (workflow builder, large graphs) **lazy-load**.
- Simulated latency is intentional but bounded (feels real, not sluggish).

## Scalability of the model
- The information model (entities, nav depth ≤ 3, consistent patterns) must hold as modules grow.
  New capabilities reuse existing patterns rather than adding structural depth.

## Internationalization
- **i18n-ready**: no concatenated strings, no text baked into images, layouts tolerate longer
  translations. English-first, but nothing should block localization later.

## Reliability & resilience (prototype)
- Deterministic mock data (same on every load); graceful handling of simulated failures (retry
  paths, partial states); no unhandled errors surfacing to users.

> These are testable. A screen that breaks at 5k rows, fails keyboard nav, or hardcodes English in
> a way that can't be translated does not meet the product's quality bar.
