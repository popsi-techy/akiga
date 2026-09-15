---
"@akiga/design-system-app": minor
---

`FileAttachmentField` gains `itemVariant` — `'filled'` (default, unchanged) or `'outlined'`.

A read-only file card sat on `bg-subtle`, which is right inside a white panel: the fill is what
separates the card from the surface behind it. It is wrong wherever the card already sits on a tinted
or grouped ground, where the two greys stack, or inside a block that is itself outlined, where a
filled card reads as a different kind of object. `outlined` trades the fill for a hairline.

The choice is the call site's, because the call site is the only thing that knows what the card is
sitting on. Applied to the Request Governance flow board, where the file cards sit inside outlined
nodes on the canvas ground.
