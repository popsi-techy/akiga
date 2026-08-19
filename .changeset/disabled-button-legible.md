---
"@akiga/design-system-app": patch
---

Disabled buttons use the product's tokens, and can be read.

The theme set `opacity: 0.45` on `.Mui-disabled` with a comment saying "dim rather than recolor so the
intent stays" — but MUI recolors a disabled contained button regardless, to `rgba(0,0,0,0.26)` text on
`rgba(0,0,0,0.12)`. The result was a recolor *and* a dim on top of it, and the label measured barely over
1:1 against its own background.

That was survivable while a disabled button said "Activate", a word you can guess from shape and position.
It stopped being survivable when one started carrying information: a button reading `2 steps to activate`
is useless if the words cannot be made out.

Now `background.subtle` with `text.tertiary` and `border.default`, no opacity layered on top — **5.83:1**,
measured on the Emergency Access header. It still cannot be mistaken for an active control; flat grey
beside a filled orange is unambiguous. It can simply be read. Every disabled button in the product gets
this, not just the one that prompted it.
