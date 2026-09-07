---
"@akiga/design-system-app": patch
---

The email-type editor renders the base template's envelope instead of a copy of it.

`BaseEmailTemplatePreview` now composes `BaseEmailTemplateShell` — the greeting, the logo, the
sign-off, the disclaimer and the support line, with the middle left open as `children`. The preview
puts a heading and the body slot in that middle; the email-type editor puts a live `BlockEditor`
there.

The editor previously carried its own hand-written copy of that chrome, and within a day it had
drifted in four places: the footer read "Need help? Write to us at info@xecurify.com" where the real
email reads **For assistance,** contact support, a sentence of the disclaimer was missing, the
responsive paddings differed, and the heading sat in a different position. That is the failure mode a
"what you see is the email" editor cannot afford — the whole claim of editing inside the real frame
is that the frame is real.

The fixed copy the shell needs now comes from the `base` template's own `content` rather than being
retyped at the call site, so the words a tenant cannot edit have exactly one source.

Verified: the editor's footer and the `/iga/email-templates` preview render the same disclaimer,
automated-email line and support line, from the same component.
