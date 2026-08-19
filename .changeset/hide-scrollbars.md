---
"@akiga/design-system-app": patch
---

`.ds-scroll` hides the scrollbar instead of styling it.

Scroll regions kept their scrolling; what is gone is the grey track and thumb painted down their right
edge. The class previously made the bar *thin and tidy* — `scrollbar-width: thin` with a coloured thumb
— which still left visible chrome on the app frame, the navigation rail, wizard step bodies, drawer and
modal bodies and the canvas panels, and still stole width from the content beside it. It is now
`scrollbar-width: none`, `-ms-overflow-style: none` and `::-webkit-scrollbar { display: none }`, so wheel,
trackpad, keyboard and touch scrolling all behave exactly as before.

One region was missing the class and so would have kept its bar: the condition list inside
`EligibilityGroupCard`. It was the only `overflow-y-auto` in the codebase not paired with `.ds-scroll`.

Recorded as **§7.2 of `AI_CONSTITUTION.md`**: regions may scroll, every scrolling region must carry
`.ds-scroll`, and a visible scrollbar is never the answer — nor is deleting the overflow, since the
regions genuinely overflow (the nav rail is ~755px of destinations in a 638px viewport at laptop
heights). The rule states the trade it accepts: a hidden bar is a missing affordance, so if one region
ever needs that hint back it gets a visible bar deliberately rather than the rule being reverted.
