---
"@akiga/design-system-app": minor
---

`QuickFilter` takes `clearable={false}` for a choice that cannot be unset.

The chips were clearable by contract: the active one carried a ✕ and clicking it returned
`null`, meaning "no filter". That is right for status or category, and wrong for any control
where every option is a real answer and "unset" is not one of them — a reporting period is
always some period, a unit is always some unit.

Passing `clearable={false}` drops the ✕, makes clicking the active chip a no-op, and
guarantees `onChange` never emits `null`. It also changes what assistive technology hears:
clearable chips report as toggles with `aria-pressed`, a required set reports as a radio
group with `aria-checked`, because announcing a pressed state the reader cannot leave
describes a control that does not exist.

The alternative was `SegmentedControl`, which has always been the always-on choice. Both now
exist for the same behaviour, and picking between them is a question of weight rather than of
semantics: a connected track is the heavier of the two, and a screen already spending one on
something else should not spend a second. The Do/Don't list says so, and the stale
"one option must always be on; that is SegmentedControl" has gone with it.

Adopted by the Reports register and compliance framework views, whose reporting period had
been a track next to a bordered evidence band — three rectangles inside 100px.
