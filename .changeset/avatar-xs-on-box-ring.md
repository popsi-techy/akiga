---
"@akiga/design-system-app": patch
---

Person avatars at `xs` now carry the grey outline, with a 1px surface gap.

The 2px offset used at sm and up was left off at 24px so it would not read as a smudge — and
IdentityCell then had no outline at all. A ring sitting on the tint is invisible (`border.default`
on brand-subtle is 1.06:1). A 1px gap puts the grey on white without swallowing the mark. The
larger sizes keep the 2px gap.
