---
"@akiga/design-system": minor
---

The flow canvas gets colour tokens, and stops being six hex literals in four files.

`color.flow` is a new role: `terminal` for the Start / End pills, and `section` for the icon
tile a node wears by the palette section it came from. The values move into a `categorical`
family in the palette — the only family there that is not a ramp, because it is not
measuring anything. The canvas needs tiles that are told apart at a glance and mean nothing
in order, which is also why they sit outside `blue` / `yellow` / `green`: a node tile
borrowing `status.info` would say "informational" about a step that is simply a task.

`FLOW_SECTION_TILE` and `flowSectionTile()` are exported alongside `FlowCanvas`, because the
canvas is what consumes them — `FlowPaletteItem.tile` is that shape, and a sidebar, a
preview and a docs example all have to agree with the node they are drawing. The same six
literals were previously declared in the approval-policy builder, the workflow visuals, the
policy flow preview and the FlowCanvas docs page: four places to change and four chances to
miss one. `workflow-visuals` keeps exporting `SECTION_TILE` under the name its callers
already use, now as a re-export.

`FlowCanvas`'s terminal pill was `bg-[#CFE5FC]` — a raw hex inside a design-system
component, and one that is `blue[400]` in the palette it sits next to. It takes
`--ds-color-flow-terminal` now. Nothing changes visually: every token resolves to the value
it replaced.

Naming the values made them measurable, and two of the five do not clear WCAG 1.4.11's 3:1
floor for a glyph on its own tint — amber at 1.94:1 and teal at 2.83:1. They were those
values before this role existed. The measurements are recorded on the token rather than
quietly corrected, since changing them changes how every canvas looks; the same hue and
saturation clears the floor at `#C27D08` and `#0D9D75`. They are deliberately not in
`check-contrast.ts`: adding them would fail the gate, and a waiver should be granted rather
than assumed.
