---
"@akiga/design-system-app": minor
---

Word documents preview in place, like PDFs and images already did.

The gap landed on the surface where attachments matter most. Supporting files on an access request
are *evidence*: a reviewer approving WRITE_ACCESS on production is deciding whether the marketing
sign-off says what the request claims. Making them download the file, leave the browser, open Word
and come back is enough friction that the honest outcome is they approve without reading it.

`docxToHtml` converts the package to semantic HTML in the tab with **mammoth** (BSD-2-Clause),
imported dynamically so its parser stays out of every bundle that merely renders an attachment list.
`.ds-docx-preview` in `globals.css` maps the converted `h1`/`p`/`ul`/`table` onto our type scale —
the elements are the document's own, so they are styled by tag rather than by classes we cannot put
on them.

**No third-party viewer, and that was the deciding constraint.** Office Online and Google's `gview`
both need a *publicly reachable* URL, so they would not work for evidence behind auth — and where
they could be made to work, they would mean shipping a tenant's attachments to a vendor in order to
look at them. Server-side conversion to PDF is the higher-fidelity route and stays open (ADR-0020
records it), but it needs infrastructure and this component's contract is that it does not talk to a
backend.

**What a reviewer loses:** headers, footers and page breaks — the result is a document, not pages —
and text boxes, columns and tracked changes degrade. For "does this sign-off cover the access being
requested", structure beats fidelity.

**Failure is a state, not a blank frame.** A package mammoth cannot read resolves to "This document
cannot be shown here… Download it to open in Word", keeping the Download button that was always
there. An empty preview would read as an empty document, which is a lie about evidence.

**The `.docx` fixture was an empty ZIP** — `UEsFBgAAAAAA…`, an end-of-central-directory record and
nothing else, sitting behind a name claiming 18KB. That is part of why nobody noticed Word had no
preview: there was nothing inside it to preview. `release-brief.docx` is now a real minimal OOXML
package with headings, a bulleted list and prose that actually reads as the brief the request
refers to.

Verified end to end: the row's accessible name changes from "Download release-brief.docx" to
"Preview…", the modal renders `H1 · P · H2 · UL(3 items) · H2 · P · H2 · P` in our type scale with
`list-style: disc`, and corrupting the stored bytes produces the fallback state rather than an empty
frame. `npm audit` attributes no advisory to mammoth.

See ADR-0020.
