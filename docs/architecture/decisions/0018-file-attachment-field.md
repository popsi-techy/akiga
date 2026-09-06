# ADR-0018: File attachments as a Design System field

- **Status:** Accepted
- **Date:** 2026-09-03
- **Deciders:** Product / Design System
- **Tags:** design-system, access-requests, evidence

## Context

Access-request justifications sometimes need supporting evidence (a manager note,
an org chart, a ticket PDF). There is no file-upload primitive in MUI or in this
Design System. Building a drop zone only on the request dock would fork the
interaction the first time another surface (provisioning evidence, SoD) needs
the same job.

A tall dashed well in a 320px rail would compete with the justification — the
step’s protagonist.

## Decision

We will own a **FileAttachmentField** in the Design System: a compact evidence
strip for PDF, Word, and image. Empty is one dashed “Add files” row. Filled is
a list of file rows plus a tertiary Add files control. Images preview in a
Modal; documents download.

Each row shows its own lifecycle — uploading, success, or failed — so a
rejected type, an oversize file, or a persist miss is visible on the file,
not only in a toast.

Access requests store `attachments` on the request record. The same field,
`readOnly`, is how reviewers and the requester see files after submit.
Submit keeps only successful files with a data URL.

New evidence-upload surfaces MUST reuse this field.

## Consequences

- Product code MUST NOT invent a second attachment list or a one-off `<input type="file">`.
- Attachments are optional unless a specific policy says otherwise.
- Per-file size lives on the component so every caller agrees. A count cap is opt-in (`maxFiles`); the justification dock does not set one.

## Alternatives considered

- **Tall drop well.** Discovers drag-and-drop well; too loud for a rail and for
  a supporting field.
- **Product-only control on the justification dock.** Faster this week; the next
  evidence surface would fork it.
- **Accept any file type.** Audit reviewers then open unknowns; PDF / Word /
  image covers the justification cases.
