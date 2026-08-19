---
"@akiga/design-system-app": patch
---

Assignments comes before Eligibility criteria, and the tab strip is reordered to match.

Tabs are now **Setup/Overview · Sessions · Assignments · Eligibility Criteria · Owners · Advanced
Configuration**, and the setup checklist runs Basic details → Assignments → Eligibility criteria → Owners
→ Advanced configuration.

This closes an inconsistency rather than just moving things: the **creation wizard already asked for
assignments second** (step 2 Assignments, step 3 Eligibility criteria), so the checklist and the tabs on the
profile disagreed with the flow that created it. The order also reads better on its own terms — what the
access hands over is the thing being built; who may ask for it is a rule *about* that thing, so it cannot
sensibly be decided first.

**`EA_REQUIRED_CHECKS` moved with them.** That array is also what the footer's "Add X and Y before this can
be activated" sentence reads, so leaving it would have produced a sentence listing the missing items in an
order the reader had just seen contradicted twice. Three readings of one array, and now all three agree.
