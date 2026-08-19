---
"@akiga/design-system-app": patch
---

`StepTracker` — a skipped step reads as a loose end, and keeps its description.

**The marker is a solid amber fill with a white numeral** — the same construction as the done and current
markers, which are solid green and solid orange. It first shipped as a dashed amber outline on a pale tint,
which was the wrong family: that is how the *unreached* steps are drawn, so a step the reader had passed over
looked like one they had not got to yet, differing only in hue. Skipped is a state, and it now reads as one.
The dashed border went with the change, since a dash cannot read against a solid fill; "passed over" is
carried by hue alone.

`warning.fill` (#B45309), not `warning.solid` (#FACC15): yellow at full strength holds white at 1.53:1, which
is why its `onSolid` role is near-black — and a black-on-yellow disc would outshout the step the reader is
actually on. The amber holds white at **5.02:1**, clear of AA and stronger than either of the other two
markers (4.64:1 and 3.60:1). The numeral takes `text.inverse` rather than `warning.onSolid` for that reason,
and `check:contrast` gained a `text.inverse on status.warning.fill` pairing so the combination this component
actually ships is enforced rather than assumed — 52 pairings now.

It also carries the same 4px halo the other stateful markers wear, in a new `status.warning.halo` role
(yellow[200]) — the same two-rungs-up-from-subtle rule as the green and orange halos, so every marker with a
state sits in something and only the untouched ones sit flat.

**"Skipped" moved to the trailing edge of the header row**, where it used to replace the description
underneath. The description says what the step is *for*, which is precisely what someone deciding whether to
go back and fill it in needs — swapping it for one word traded the useful line for the obvious one. The mark
is `ml-auto`, so the marks form a column down the rail rather than drifting with each label's length.

`Skipped — still required` is gone with it. Required-ness is the asterisk's job, and after the Emergency
Access wizard started gating forward movement a required step cannot be skipped there at all.

**The required asterisk now renders inside the label's text run**, after a literal space, exactly as `Input`
does it. As a flex sibling it sat at the edge of the label's *box* — the same place as the last word only
while the label fits one line. On a wrapping label it drifted to the right margin and ended up beside
"SKIPPED", so the marker for "this step is required" appeared to modify the word "skipped". A required marker
modifies the word it follows or it says nothing.
