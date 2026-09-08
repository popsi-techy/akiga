# ADR-0020: Preview .docx in the browser, via mammoth (BSD-2-Clause)

- **Status:** Accepted
- **Date:** 2026-09-07
- **Deciders:** Product / Design System
- **Tags:** design-system, attachments, review, dependencies, privacy

## Context

`FileAttachmentField` (ADR-0018) previews an image and a PDF in place and downloads a Word
document instead. The browser renders the first two itself; there is no native `.docx`
renderer, so the row fell through to a download.

That gap lands on the surface where attachments matter most. Supporting files on an access
request are *evidence*: a reviewer approving WRITE_ACCESS on a production system is
deciding whether the marketing sign-off says what the request claims it says. Making them
download a file, leave the browser, open Word, and come back is enough friction that the
honest outcome is they approve without reading it.

## Options

**1. Office Online / Google `gview` embed.** Both take a `src` URL and render it on the
vendor's servers. Both therefore require the file to be **publicly reachable** — which
private governance evidence behind auth is not, so it would not work; and where it could
be made to work, it would mean shipping a tenant's attachments to a third party to look at
them. Rejected on both counts, and the privacy one is disqualifying on its own.

**2. Server-side conversion** (headless LibreOffice, Gotenberg) to PDF, then reuse the
existing PDF path. Highest fidelity, and the file stays inside the tenant. But it needs
infrastructure this product does not have yet, and `FileAttachmentField`'s contract is that
it does not talk to a backend — every attachment is a `FileAttachment` record the product
already holds.

**3. `docx-preview` (MIT).** Lays out the OOXML with CSS, so page geometry survives. More
faithful than option 4 and considerably larger and more brittle. More fidelity than the
question needs.

**4. `mammoth` (BSD-2-Clause).** Converts the package to *semantic* HTML in the tab —
headings, lists, tables, bold/italic, embedded images — and deliberately discards
presentation. No server, no third party, the bytes never leave the browser.

## Decision

**Option 4.** `mammoth`, imported dynamically inside `docxToHtml` so its parser stays out of
every bundle that merely renders an attachment list.

The deciding argument is what the preview is *for*. A reviewer needs to read what the
document says, not check its margins. Mammoth's output is a document's structure in our own
type scale (`.ds-docx-preview` in `globals.css`), which is a better answer to "does this
sign-off cover the access being requested" than a faithful reproduction of Word's page
would be.

Imported as the bare `'mammoth'` specifier, not `mammoth/mammoth.browser`: the package's
`browser` field swaps only its two Node-specific modules for browser equivalents, so a
bundler picks the browser-safe build *and* the types come with it.

## Consequences

**What a reviewer loses.** Headers, footers and page breaks are gone — the result is a
document, not pages. Text boxes, columns, and tracked changes degrade or disappear. If a
reviewer ever needs to see a document *as printed*, that is option 2, and this decision does
not block it: `docxToHtml` is one function behind one call site.

**Failure is a state, not a blank frame.** A package mammoth cannot read resolves to "This
document cannot be shown here… Download it to open in Word", with the Download button that
was always there. An empty preview would read as an empty document, which is a lie about
evidence.

**Converted markup is injected as HTML.** Mammoth emits a fixed, small set of semantic
elements from the OOXML and carries no script or style through from the document, and it is
only ever run on a file a reviewer chose to open from their own tenant's request. Should the
threat model change — attachments from outside the tenant, say — sanitising the output before
injection is the mitigation, and it belongs in `docxToHtml` rather than at the call site.

**`fileAttachmentCanPreview` now returns true for every kind.** It is kept rather than
inlined, because the answer is a property of the format and the next format added will want
somewhere to say no.

## References

- ADR-0018 — the field itself
- ADR-0019 — the precedent for taking an editor/document dependency
- `AI_CONSTITUTION.md` §13.3 — technology defaults (no document renderer named)
