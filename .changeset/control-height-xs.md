---
"@akiga/design-system-app": minor
---

`xs` (32px) joins the shared control-height scale, and the Emergency Access **Advanced Configuration**
tab steps down to it.

That tab is a column of settings rows whose values are stepper-width numerals — a risk score, a
concurrency cap, a cooldown in hours and minutes. At the 36px default those fields read as a stack of
boxes rather than a set of values.

The alternative was hand-tuning that one input, which §6.1 of the visual language forbids for a good
reason: the scale is why a Button, an Input and a Select of the same size line up in a toolbar without
adjustment. The rule names its own escape hatch — *change the layout, or add a documented size* — so this
is the documented size.

`Button`, `Input` and `Select` all take `xs` and all land on 32px, so the step cannot be half-applied to
one control type. `sm` stays 36px and remains the product default; nothing outside that tab moves. The
whole tab stepped down together — measured: **10 controls, one height, 32px** — because an `xs` field
beside a `sm` button is precisely the misalignment the scale exists to prevent.

Recorded in the visual language's control table with the condition attached: `xs` buys density by giving
up a comfortable target, so it belongs only where fields are small, numerous and adjacent, and a region
commits to one size.
