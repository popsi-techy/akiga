---
"@akiga/design-system-app": minor
---

Let the Emergency Access V2 stepper be skipped — a step at a time, or all of what is left — and make
what that costs visible before it is paid.

Skipping a *required* step is allowed, because the usual reason for stopping is not knowing something
yet, and a wizard that will not let you past that point turns "come back to it" into "start again".
It is a deferral, not a waiver: the price is that the flow ends at a draft instead of something
switched on, and it is quoted in three places. `StepTracker` gains a per-step `required` flag that
renders the same danger asterisk a required field carries, so "can I pass this?" is answered at the
step rather than on the final screen where it is too late to act. It also gains a `'skipped'` status
— the upcoming outline turned dashed, borrowing the connector's language — whose second line replaces
the description with the consequence, reading "Skipped — still required" where the step gates the
goal. And the required count now sits under the rail for the whole flow, not only on the header of a
saved draft.

Skipping is derived, not recorded: a step is skipped when the reader has been past it and it is still
empty. Filling one in later clears its own mark, and a step left empty by pressing "Save and
continue" is treated exactly like one left empty by pressing "Skip" — the button only says that
passing is allowed, it is not what makes it true. Which step is required comes from the same
`EA_REQUIRED_CHECKS` array the Activate button and the V1 checklist read, so the asterisks, the
"still needed" list and the disabled button cannot disagree.

"Skip all" leaves the stepper for the profile's own tabbed screen. A reader skipping every remaining
step is asking not to be walked through this — which is V1's model — and the tabbed screen is the
surface built for it: the same five pieces of setup reachable in any order, a checklist naming what is
outstanding, and Activate in the header. That checklist also beats the preview's "still needed" card
at the same job, since it lists the optional steps too and marks the always-satisfied one "Default
applied", so routing through the preview meant showing a worse version of the same answer on the way
to the real one. It is now offered on every skippable step, including the last: while it jumped to the
preview it had to be hidden there, because "the rest" and "this step" collapsed into one action.

The preview keeps the job it is actually for — the last look before activating, for a reader who
filled the steps in. It leads with the draft being safe before saying what is wrong, and derives one
"Add …" button per missing thing in wizard order instead of hardcoding two.

Two fixes found along the way: the description field is now marked required, which activation has
demanded all along while the form presented it as optional; and "Cancel" no longer appears once the
profile exists, where it did the same thing as "Save and close" while implying it threw the draft
away.
