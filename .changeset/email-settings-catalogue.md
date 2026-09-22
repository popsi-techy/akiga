---
"@akiga/design-system-app": minor
---

Email settings becomes a catalogue of the emails the product sends, each with its own versions.

System Settings → Email used to open an empty table where you pressed "Add email type", picked from a starter gallery, and named a type before you could edit anything. Now it opens a **card grid** of every email the product sends, grouped by area, each card showing which wording it currently sends. There is no on/off — every email always sends; the only choice is whose words.

Opening a card lists that email's **versions**: the shipped **Default** (always present, the fallback) plus any the tenant has written, with a **Create new version** button. Exactly one version is **In use** at a time — Default until you pick a custom — and the version editor composes name, subject and body inside the fixed base envelope. The starter gallery is gone (`/configurations/email/templates` redirects).

The `EmailType` store is repurposed as per-email versions keyed by catalogue id (many per email, one `inUse`); the shipped catalogue and the editor primitives (`BaseEmailTemplateShell`/`BaseEmailTemplatePreview` + `BlockEditor`) are reused unchanged.
