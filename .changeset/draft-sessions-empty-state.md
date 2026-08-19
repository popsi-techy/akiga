---
"@akiga/design-system-app": patch
---

A draft's Sessions tab says why it is empty instead of claiming the screen is unfinished.

It showed the generic "This section isn't built yet" placeholder, which is the wrong answer on a draft: the
tab is empty because nobody can request the access yet. That is a fact about the profile, not a gap in the
product — and telling the reader the screen is unfinished sends them looking for a feature instead of at the
switch that would fill it.

Two wordings, from the same gate the header button and the checklist read:

- Requirements outstanding — *"Nobody can request this access until it is switched on. Add eligibility
  criteria, then activate it from the header and sessions will appear here."*
- Ready to go live — *"Nobody can request this access until it is switched on. Activate it from the header
  and sessions will appear here as people use it."*

Naming the missing pieces in the same words `eaBlockingSteps` gives the checklist and the Activate button
means the three cannot tell the reader different stories.

No Activate button in the empty state. The header's already carries the gate and its progress ring; a second
one would be a copy to keep in step, and on an unfinished draft it would be dead on arrival. Live profiles
keep the existing placeholder, since that tab genuinely is still to be built.
