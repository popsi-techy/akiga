---
"@akiga/design-system-app": patch
---

The email templates stop using raw weight utilities, and `check:type` passes again.

Sixteen spans across `additionalEmailBodies`, `EmailTemplateBodySlot` and
`BaseEmailTemplatePreview` emphasised a run of inline text with `font-semibold` or
`font-medium`. The typography gate has been failing on them, which meant `prebuild` was red for
everyone and the one gate that catches a drifting type scale had stopped being able to say anything.

All sixteen are now `font-emphasis` — the name the system reserves for exactly this case, text whose
size is inherited from its parent rather than set by a `text-*` class. The nine `font-semibold`
occurrences are unchanged in weight; the seven `font-medium` ones move from 500 to 600, which is the
scale's deliberate position that emphasis is 600 and never 500.

Verified in the rendered emails rather than only by the gate: the inline runs still emphasise, at
weight 600, with nothing dropped.
