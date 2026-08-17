---
"@akiga/design-system-app": minor
---

Add Emergency Access V2 at `/iga/emergency-v2`, alongside the existing module now labelled
Emergency Access V1. The two differ only in creation: V1 opens a drawer for a name and leaves you
on a draft with a checklist; V2 walks a six-step `StepTracker` — basic details, assignments,
eligibility criteria, owners, limits and timing, preview — and ends on an Activate that lands you
on the live profile.

The list and the detail screen are shared, not copied: `EmergencyAccessListView` takes the base
path and what its create button does, and `EmergencyAccessDetail` takes the id and where "back"
goes. Each wizard step embeds the same editor its tab uses, so what you configure during creation
and what you maintain afterwards cannot drift apart. Restores `updateEmergencyAccessBasics` and the
`onChanged` callbacks on the eligibility, assignments and advanced-config editors, which V2 needs
to re-read readiness as you go.
