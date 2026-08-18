---
"@akiga/design-system-app": patch
---

`PickerSlot` takes the design system's icon tile.

The leading mark was a `grid h-11 w-11 rounded-xl bg-brand-subtle` tile built inline, with callers
passing `sx={{ fontSize: 22 }}` to size the glyph themselves. It is now `Avatar` with an `icon` — 40px on
`radius.avatar`, glyph sized at half the box by the component — which is the same mark the All Identities
exception queue uses, so a slot and a finding read as the same family instead of two near-misses. Callers
pass a bare glyph; the six `sx` overrides came out.

Two things the row now holds itself to. The title truncates, and the hint clamps to two lines at
`caption` rather than wrapping freely at `body-sm` — a long hint used to grow the row, so a column of
slots came out ragged at different heights. The gap between mark and text went 16px to 12px, which is
what the visual language asks for inside a row.

The two Emergency Access hints were cut to fit one line at the wizard's column width (measured: 411px and
396px of room), so the pair of slots on that step now sit level at 74px each. The clamp is the safety
net; the copy is the fix.
