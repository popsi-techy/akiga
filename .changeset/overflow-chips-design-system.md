---
"@akiga/design-system-app": minor
---

Promote `OverflowChips` into the Design System: a few named things plus a `+n` that reveals the
rest, for rows whose height must not change with their contents. With an overflow the set now sits
in one tinted pill — the named chip and the `+n` are two halves of a single value, and as loose
outlined chips they read as two separate values; the `+n` is plain text rather than a second chip,
because it is a remainder and not an item. A set with nothing to collapse stays a single ungrouped
chip. Replaces the private copy in the app-account panel and is used by the certification wizard's
application summary; registered with a docs page.
