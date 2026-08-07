# State Experience

The product's stance on the state matrix every screen must handle. The Design System supplies the
components; this defines *what each state must communicate*. (Copy patterns:
`08-content/copywriting-guidelines.md`.)

## Loading
- **Skeletons** for content areas (tables, cards, detail) — match the shape of what's coming.
- **Inline spinners** only for in-place actions (a button's busy state).
- Simulate **realistic latency** (per `scope-and-assumptions.md`) so loading states are actually
  exercised — the prototype must look production-real.

## Empty
Three distinct kinds — don't treat them the same:
- **First-use empty** ("no policies yet") → explain + primary action to create the first one.
- **Cleared-work empty** ("no pending approvals") → reassure; this is a *good* state.
- **Filtered empty** ("no results for these filters") → offer "clear filters", don't imply there's
  no data at all.

## Error
- **Field-level**: inline, specific, fixable ("Justification required, min 10 chars").
- **Section/page-level**: what failed + retry, without losing the user's context/input.
- **Action failure** (e.g. provisioning failed): toast + a persistent, retryable status on the
  object — never a silent failure.
- Never surface raw codes/stack traces as the primary message.

## Success
- **Toast** for transient confirmation (past tense, specific: "3 items certified").
- **State change** on the object itself (status chip updates) is the durable signal — toasts are
  supplementary, not the only feedback.

## Partial / degraded
- Show what loaded; indicate what didn't (e.g. "risk score unavailable") rather than blocking the
  whole screen.

## The required matrix
Every list/detail/flow must intentionally handle: **loading · empty (which kind) · error ·
success · partial**. A screen missing any of these is not done (see `CONTRIBUTING.md` DoD).

> These map directly to Design System state components. Product decides *when/what*; the system
> decides *how it looks*.
