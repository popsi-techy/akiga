---
"@akiga/design-system-app": patch
---

Two long-standing type errors in the directory drawers, one of which was a real bug.

**`AddEntitlementDrawer` never enforced its 100-character limit.** `maxLength` was passed straight to
`Input`, but it is a native input attribute rather than a `TextField` prop, so it never reached the
element — the `0/100` counter under the field was the only thing suggesting a limit existed, and it
would happily count past it. It now goes through `inputProps`, the form the locale settings page
already uses. Typing 114 characters into that field now stops at 100.

**`ConnectionEventDrawer`'s de-duplicating name could not be assigned.** `eventKindMeta().label`
returns one of the literal event-kind names, so `let name = base` inferred that union and the
`"Accounts Fetch 2"` built to avoid a collision was not assignable to it. Annotated as `string`, which
is what the field it ends up in has always been. Adding a second call to an event kind that already
has one now produces "Accounts Fetch 2".

With these, `tsc` is clean across the app and all three design gates pass.
