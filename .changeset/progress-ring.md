---
"@akiga/design-system-app": minor
---

**`ProgressRing`** — "N of M done" as a ring small enough to sit inside a button — and the Emergency
Access header now uses it instead of a meter standing beside the button it describes.

The header carried two elements saying one thing: a segmented `2 / 3 required` indicator, and a disabled
Activate that gave no reason for being disabled. Put the progress *in* the control and it answers "why is
this dead" and "how far off am I" in the place the reader is already looking.

**The label resolves into the verb.** While the gate is unmet the button reads `2 of 3 required` and is
disabled; when the last requirement lands it becomes `Activate` and goes live. So the control reads as a
state that turns into an action rather than a button that mysteriously wakes up.

**One animated moment, and only one.** The arc transitions as the count changes (`duration.slower`), and
the final step swaps it for a tick that draws itself (`ds-check-draw`, `duration.slow`, decelerate). The
visual language asks for motion exactly where a state change would otherwise appear to teleport, and
"the button you could not press is now the one you should press" is that change. Nothing else moves.

**The track and the tick inherit; the arc takes an `accent`.** Inheriting everywhere sounded principled
and was wrong in the one place it mattered: the progress arc — the only part carrying information — came
out in the host's disabled grey, which is where it is least visible and most needed. The arc now takes
`status.success.fill`, matching the green a completed step has always used in the checklist, and measures
4.44:1 against the disabled button. The track and tick still follow the host, so they turn white the
moment the button goes primary. The ring is `aria-hidden` — the label beside it states the count, and a
second announcement of the same number helps nobody.

**The label counts what is left and names what it buys:** `2 steps to activate`, not `1 of 3 required`.
The old copy made the reader subtract, then guess what the three were for. It also keeps the word the
button is about to become, so the label resolves into "Activate" rather than being replaced by it.

`SetupProgress` stays for indicators that stand alone: segments read better where there is room to count
them, and at 18px there is not. `Meter` remains the continuous proportion. Documented with a live
stepping demo, and registered.

**The checklist card's Activate came out with it.** Once the header button carried the progress ring and
the same gate, the card's footer button was a second control for one action — two places to press, two
things to keep in step, and the reader left to work out whether they differ. The sentence stays, because
saying what is still missing is the checklist's job; doing it is the header's. Its complete-state copy now
points at the header rather than describing a button that is no longer beside it, and the handler,
`activateEmergencyAccess` import, toast and `Button` import went with the control.
