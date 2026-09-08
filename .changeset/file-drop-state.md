---
"@akiga/design-system-app": minor
---

Dragging a file over `FileAttachmentField` now looks like a drop target.

It used to answer with `border-border-strong` and a faint brand ring — a grey box getting slightly
greyer, at the one moment the reader needs to know their file will land *here*. The well now takes a
blue outline and a translucent blue wash, the convention every file UI shares.

The wash goes **over** the well's content rather than swapping its background, so the target reads as
one lit surface whether it holds the empty prompt or nine file cards. Swapping the background would
have left the cards sitting on it unchanged, and the reader could not tell which region takes the
drop. It is genuinely translucent — `color-mix(… 12%, transparent)` against `status.info.fill` — so
the files underneath still show through, which is what says "these will be added to" rather than
"these will be replaced".

A **Drop to attach** pill appears over a populated list, and only there: the empty well already says
"Drag and drop or browse files", and a pill repeating it two lines below is the same sentence twice.

**A dropzone's outline is dashed, 6px dash and 2px gap.** `border-style: dashed` cannot say how long
a dash is — the browser picks, and it varies by engine and border width — so the pattern comes from an
SVG rect used as a **mask** rather than a background image. A background would have to carry the
colour inside the data URI, where a CSS variable cannot reach, and the outline would be the one thing
on the surface not drawn from a token; masking leaves the colour to `background-color`, which is how
it turns blue on drag alongside the wash. Only the filling, empty dropzone takes it — a well holding
files keeps its solid hairline, and so does the compact drop row in a form.

Blue rather than the brand orange a selection would take. This is a transient interaction state that
exists only while a drag is held over the target — nothing else on the panel is being read at that
moment — so it does not spend the `info` blue a chip would.

Two things worth recording for whoever touches this next:

- The border colour is an inline `style`, not a `border-[…]` utility. Both it and `border-border` are
  border-colour utilities, so which wins is decided by their order in Tailwind's output rather than
  in the class array — and grey was winning, leaving a blue ring inside a grey outline.
- `pointer-events-none` on the overlay is load-bearing. It appears under the cursor mid-drag, and
  without it the `dragenter`/`dragleave` depth counting on the parent would see the overlay and
  flicker.

`check-contrast` now enforces every `status.*.fg` on plain surface as well as on its own tint — the
pill's label is read on white, and that ground was unchecked. All six pass (info 8.63:1, warning
5.49:1 lowest); 66 → 72 enforced pairings.
