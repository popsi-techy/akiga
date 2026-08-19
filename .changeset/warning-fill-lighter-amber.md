---
"@akiga/design-system-app": patch
---

`yellow[750]` — the graphical amber — goes from `#B45309` to `#AF6400`.

Lighter and gold-leaning rather than burnt. The old value read as brown next to the brand orange, which is
the wrong signal from the step tracker's skipped marker: it should say "amber, unfinished", not "a duller
version of the current step".

**White text is what caps how light this can go.** The marker prints a numeral on it, so the fill has to hold
white at 4.5:1, and every meaningfully lighter amber falls short — `#BE6A0A` is 4.00:1, `#D97706` 3.19:1,
`#CA8A04` 2.94:1. `#AF6400` measures **4.52:1**, which is about as light as this step can be while staying
legible. Worth knowing it now sits close to the floor: `check:contrast` enforces the pairing, so nudging it
lighter fails the build rather than quietly going illegible.

It is a shared step, so `Meter`'s `warning` tone and the Medium risk segments in Governance Analytics take the
same shift. Both were checked — the graphical floors hold at 4.52:1 on surface and 4.33:1 on subtle, well clear
of the 3:1 needed for a non-text mark, and the meter bar reads as a cleaner amber against the green and red
either side of it.
