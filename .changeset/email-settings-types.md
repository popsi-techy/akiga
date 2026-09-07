---
"@akiga/design-system-app": minor
---

New System Settings section: **Email** — the notification emails a tenant composes for itself.

**The list.** Every email type with its source template, status and last edit. Empty, it is a centred
"Add email type" inside the table rather than only a toolbar button in the corner: on a first run the
reader is looking at the middle of an empty table, which is where the way in should be.

**The gallery.** Adding one opens a template catalog built to the same shape as the workflow template
gallery — a still banner with search and a start-from-scratch escape, a scrolling grid, and a
name-and-description drawer before anything is created. Two galleries that behaved differently would be
two things to learn for one idea. Five starters span the lifecycle rather than being the five most
common — Welcome to the Organization, Access Request Submitted, New Review Request, Password Reset,
Emergency Access Assigned — so browsing lands somewhere different in the product each time. Preview
renders the real email through `BaseEmailTemplatePreview`, so what is approved in the modal is what the
recipient gets.

**The editor.** The base template's greeting, logo, sign-off and legal footer are rendered around the
body and are *not* editable — that is the point of a base layout, and the disclaimer is not something
an admin should be able to delete by selecting it. The editable middle is a `BlockEditor`, in place, at
the real width: there is no separate preview to disagree with, because the reader is typing into the
email. Saving is explicit, since a draft is cheap to leave open and autosave would make "close without
keeping this" impossible.

**Status.** `Draft → Active → Inactive`, and back. A new type is always a draft: it exists, but nothing
is sending it. The row menu offers only the transitions that state allows, so there is no Activate on
something already live. Draft is `caution` rather than `info` — it is the one state meaning "this is
not sending", which a reader scanning a list needs to catch — and Inactive is neutral, because it was
switched off deliberately rather than left unfinished.

Email types are a separate store from the shipped `email-templates` catalog. A template is a starting
point; a type is the tenant's copy, with its own name, subject, body and lifecycle. Editing one never
touches the catalog.
