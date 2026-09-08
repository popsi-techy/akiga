---
"@akiga/design-system-app": patch
---

An access request takes at most ten supporting files.

Past ten the justification dock stops being a list of evidence and becomes a folder — and an approver
who has to open twelve files to answer one question opens none of them.

`FileAttachmentField` already had `maxFiles`; the wizard simply never passed it. At the cap the field
replaces **Add more files** with **10 files max**, and a picker that selects more than the remaining
room rejects the excess rather than silently keeping the first ten.

`onReject` is wired at the same time. It was unset, so those rejections — wrong type, over size, and
now over the count — were dropped in silence: a reader who picked twelve files watched ten appear
with no account of the other two. They surface as a toast carrying the field's own message.

Verified at the limit: ten cards, no add row, "10 files max" in its place, and Submit Request still
in view.
