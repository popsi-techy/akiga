---
"@akiga/design-system-app": minor
---

Attachment marks are tinted by file format: red PDF, blue Word, green image.

Every file was getting the same brand-orange tile with a different glyph inside it, so the mark said
"attachment" and nothing more — the one thing it should say once a name has truncated to
`marketing-si…` is what kind of file it is.

**New `color.file` token group**, a sibling of `status` rather than a reach into it. A format is a
*kind*, not a state, and spending `danger` red on PDF would make red mean "failed" in one place and
"PDF" four pixels away. The fills sit one step up from the matching status tints (`[100]`-weight
where status uses `[50]`) so a file tile reads as a solid little object rather than a status wash.
`other` stays greyscale. All four are enforced in `check-contrast.ts` at WCAG 1.4.11's 3:1 graphical
floor — the tile is what distinguishes a PDF from a spreadsheet when the name is cut off:

```
file.pdf.fg   on its subtle   4.80:1
file.word.fg  on its subtle   4.03:1
file.image.fg on its subtle   3.14:1
file.other.fg on its subtle   7.22:1
```

**No vendor logos, deliberately.** The obvious reading of "a red one for PDF" is Adobe's mark, but
PDF is an ISO format rather than Adobe's product, so stamping every PDF with Adobe branding tells the
reader something untrue about where the file came from — and a `.docx` is not Google Docs. Red-for-PDF
and blue-for-Word are a filing convention every reader already has, which is what the colour is
actually for; `AppIcon`'s live-favicon route stays for applications, where the logo *is* the vendor's.

**`FileMark` stops using `Avatar`.** An avatar is a person's or an entity's initial on a brand tint;
a file has no initials, and the DOM was announcing `aria-label="report.pdf avatar"`. It is now a tile
of its own that carries the format tint, announces `"PDF file"`, and shows an image's own thumbnail
where one exists.

Verified on the component's docs page across both variants: 32px editable marks and 24px read-only
ones, each reading its format's tint. The `file.*` swatches are documented on Foundations → Colors.
