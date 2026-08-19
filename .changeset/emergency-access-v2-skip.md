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

**Skip sits in the footer, immediately left of the forward action, as a `secondary` button.** It spent a
round in the step heading as a text link, which was wrong once "Skip all" went: passing a step and saving it
are the same kind of move — both leave this step for the next one — so they belong in the same group, and
`secondary` makes it a peer of Back rather than an aside. The order is Cancel · … · Back · Skip step · Save as
draft · Save and continue.

**The left corner is Cancel on every step, and "Save as draft" sits beside "Save and continue".** The left
button used to change its name mid-flow — "Cancel" on step 1, "Save and close" after — which made one
position mean two things. Now the escape is the same escape for the whole flow (and still keeps the draft
once step 1 has committed; leaving never deletes anything), while saving-and-leaving lives with the other
save verbs on the right, where the two can be compared. It renders only once there is a draft to keep, so
step 1 shows just Cancel and Save and continue.

Step 1 still shows neither, because it has no `skipLabel` — every editor after it writes against a profile
id, so there is nothing to attach anything to until basics have been through once.

**Step bodies fill the wizard column.** Basic details carried `max-w-2xl` and the assignments, owners and
preview bodies carried `max-w-3xl`, so each step stopped short of the footer that acts on it and the
column looked like it had a right margin its own buttons did not. All four are uncapped; these are
icon-and-control rows, not prose, so there is no line length to protect. Nothing else moved — the
assignments and owners *tabs* on the profile detail page are two-pane table editors and never rendered
these blocks, so the caps were wizard-only despite living in shared files.

**Skipping is now offered only where nothing is gated, and "Skip all" is gone.**

Assignments and eligibility criteria both carry a `blocker`, so the profile cannot be switched on without
them — and a "Skip" beside a step the rail marks with a required asterisk is the app arguing with itself.
Owners and limits gate nothing, so they keep theirs ("Skip step" and "Keep defaults" respectively).
`StepDef.skipLabel` now documents the invariant: never set it on a step with a `blocker`.

**A gated step now cannot be passed at all.** Removing its skip button was half the job — "Save and
continue" still advanced whether the step was filled or not, so a required step could sit behind the reader
marked "Skipped — still required", which is the app allowing something it then refuses to honour. The button
is disabled until the step's own `blocker` clears, with the reason on its tooltip, and `goTo` refuses forward
movement independently so the rail cannot route around the button. Backward movement is never blocked — the
reader can always return to anything already reached, including from a step they cannot yet leave.

One consequence: a required step can no longer end up `skipped`. That state is derived from sitting behind
`reached` while empty, and nothing gated can now get behind `reached` while empty — so the rail's
"Skipped — still required" marker is reachable only for the optional steps, which is the only place it was
ever true.

Step 1 is exempt from the tooltip gate, and not as a convenience: before it commits there is no profile, so
`eaBlockingSteps` names `basic details` by definition and the button would be dead with no way to revive it.
Its gate stays `commitBasics`, which does better than a tooltip anyway — it marks the offending field. A
picker step has no field to mark, which is why the others need the tooltip.

"Skip all" and its `skipToProfile` handler are deleted outright. It existed to hand a reader who wanted no
stepper over to the profile's tabbed screen, but that reader can reach the same place with "Save and close",
which is one row below and already says what it does.
