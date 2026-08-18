---
"@akiga/design-system-app": minor
---

Avatar shape now carries meaning: **a circle is a person, a rounded square is a thing.**

Almost every list in an IGA product mixes the two — an owners table, an application, a policy, a
governance team all arrive as one letter on the same brand tint. The shape is what says which one you
are looking at before you read the name, and it is the convention readers already bring in from Slack,
Google and GitHub. The product had it right in exactly one place: the audit log gave the *actor* a
circle and the *event* a rounded square. It was never written down, so nowhere else followed it.

`shape="soft" | "circle"` is replaced by **`kind="person" | "entity"`** (default `entity`). The prop now
asks what the subject *is* rather than what it should look like — a caller always knows whether it is
rendering a person, and should not also have to know that people are round. Leaving that mapping to
memory is what produced an audit log whose actor was round, an owners table where the same people were
square, and governance teams that looked like people. Swept across every call site.

**The grey outline now appears only at `md` and `lg`.** It is drawn 2px *outside* the avatar's own box,
which makes it two problems in a dense row: weight the row does not need, and the first casualty of a
table cell that clips its overflow — the exact hazard `Column.wrap` was added to describe. At 24 and
32px the shape alone is enough.
