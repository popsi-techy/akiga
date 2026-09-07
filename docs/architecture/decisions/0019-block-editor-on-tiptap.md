# ADR-0019: A block editor, built on Tiptap (MIT)

- **Status:** Accepted
- **Date:** 2026-09-07
- **Deciders:** Product / Design System
- **Tags:** design-system, editor, email, dependencies

## Context

Email settings let a tenant compose the notification emails it sends. That body is a
document — headings, lists, to-dos, quotes, a divider — not a field.

`RichTextEditor` already exists and is the right tool for what it does: a short, bounded
run of formatted text in a form, with a fixed toolbar. It is a `contentEditable` with no
document model, so it cannot know the caret is inside a to-do item, cannot turn one block
into another, and has nowhere to put a block-insert menu. Extending it into a block editor
means writing a schema, a transaction model, selection mapping and undo grouping — which
is building ProseMirror, badly, inside a design system.

The technology defaults (§13.3) do not name an editor. They do say prefer extending MUI;
MUI has no editor to extend.

## Decision

We will own a **BlockEditor** in the Design System, built on **Tiptap v2 (MIT)** over
ProseMirror. `RichTextEditor` stays; the docs for both say which to reach for, and the
default is still `RichTextEditor`.

Only the free distribution is used: `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`,
and the placeholder, task-list, task-item, underline and link extensions. The slash command
menu and the formatting bar are ours, built on Tiptap's public API.

**No Tiptap Pro extension may be added without a further ADR.** Drag handles, comments and
the AI extensions are paid, and a design-system component that the docs tell every team to
reuse freely must not carry a licence behind it.

The editor is uncontrolled: `value` seeds the document once. Writing HTML back on every
keystroke re-parses the document and drops the selection — the same reason
`RichTextEditor` is uncontrolled. `onChange` reports HTML out, and only when the document
actually differs, so a re-serialisation of unchanged content cannot read as an edit.

Typography inside the document is applied with `@apply` and the named type classes in
`globals.css`, scoped to `.ds-editor-content`. ProseMirror renders its own DOM, out of
reach of a React `className`, and typography is deliberately not exposed as CSS variables —
so a hand-written `font-size` there would be a second, drifting definition of `h4`.

## Consequences

**Good.** A document surface exists that behaves the way people now expect one to. Email
bodies compose in place, inside the real template frame. Any future long-form surface
(published guidance, a policy note that outgrew its field) has somewhere to go.

**Cost.** A real dependency: ProseMirror is not small, and it is a second editing engine in
the bundle alongside `RichTextEditor`. That is accepted because the two answer different
questions; it would not be accepted as a replacement for the field-level one.

**Watch.** The pull toward Pro is real — drag handles in particular are the first thing
anyone asks for after using this. That request is an ADR, not a patch.
