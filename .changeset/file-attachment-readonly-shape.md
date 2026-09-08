---
"@akiga/design-system-app": minor
---

`FileAttachmentField`'s read-only variant is its own shape rather than a disabled copy of the
editable one.

Editing needs a well: a frame to drop onto, a gutter so cards do not touch the drop edge, one card
per row wide enough to carry a progress bar and a status. Reading needs none of that. There is
nothing to drop, every file is by definition uploaded, and the question is "what is attached" — a
list of five things, not five rows of one thing.

So `readOnly` now drops the frame, the gutter and the file count, lays the files out as a wrapping grid, shrinks the
mark to `xs`, and says only the name and the size. **"Uploaded" is gone**: on a reviewer's screen it
was a column of the same word down the side. A failure still speaks — it is the one status that is
not the default.

The count beside the label goes too. It earns its place only while the well can hide rows: given
`fill` the editable list scrolls inside a fixed height, so the number says how many exist past the
fold. The read-only grid sizes to its content — every card is on screen, and a "2" floated to the far
right of a list of two counts something the reader already has.

`fill` now behaves differently either side of the first file, because the two states want opposite
things from the leftover height.

**Empty, the well is the drop target**, and a target should be as big as the column can spare: it
takes `flex-1` and stacks its prompt — mark above the words, both centred — so the whole area reads
as the place to let go. Sized to its content the same prompt stays the compact row it was, since a
stacked, centred prompt in a form is three lines of chrome for one control.

**Once files are in it the well is a list**, and a list claiming the whole column left one card at
the top of a box four times its height. So it switches to `flex-initial` (`0 1 auto`): the height its
files need, shrinking only when the column runs out, at which point the `min-h-0` chain down to the
list's `overflow-y-auto` turns the overflow into a scroll. Measured in the request wizard's
justification dock (466px column): 236px of dropzone when empty, 190px with two files, 298px with
eight — Submit in view throughout.

**Columns are container-driven, not viewport-driven:**
`grid-cols-[repeat(auto-fill,minmax(140px,1fr))]`. What has to fit is this container, and it is far
narrower than the viewport wherever the field sits beside a rail — on the review page a 1142px
window leaves it 380px, where a `sm:grid-cols-3` cut "marketing-signoff.pdf" down to "marketi…".
Measured: 2 columns at 380px, 3 at 500px, 4 at 600px, **5 at 753px** (the width the review page has
on a 1440 screen), 7 at 1100px. Below the floor the column *count* drops instead of the names, and
where a 140px card does truncate, the full name is on the card's `title` and in the button's
accessible name.

The editable variant is untouched — verified on the component's own docs page, where the two
editable fields still render `display: flex` with a 10px gutter, a bordered well and their status
line ("82 KB • Uploaded", "169 KB • 64%"), and only the read-only one is a borderless, gutterless
grid reading "82 KB". Its docs example is widened to 760px, since a 320px box would only ever have
shown the two-column fallback.
