---
"@akiga/design-system-app": minor
---

Build the admin side of SoD Policies at `/iga/sod-policies` — the route was already in the
navigation registry with nothing behind it. List with severity, status and lifecycle dates; a
create drawer (name, description, severity) that lands on the new draft; and a detail page with
Overview, Owners and Ruleset tabs. A ruleset is one AND/OR expression over entitlements and
technical roles, edited in a drawer and versioned once the policy is live (ADR-0011). Extracts
`NextStepsCard` from the Emergency Access setup card so both modules share one checklist, and
derives `canGovernanceTeamsOwn` in the directory service so owner surfaces drop the teams rail for
entity types teams cannot own.
