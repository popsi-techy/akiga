---
"@akiga/design-system-app": minor
---

New `BlockEditor` — a block-style document editor, on Tiptap (MIT).

Type `/` at the start of a block for headings, bulleted, numbered and to-do lists, quotes, code and
dividers; select a run of text for bold, italic, underline, strikethrough and inline code. Arrow keys
move through the command menu, Enter inserts, Escape dismisses.

**`RichTextEditor` stays and is still the default.** It is a form field: a short, bounded run of
formatted text with a fixed toolbar. It has no document model, so it cannot know the caret is inside a
to-do item or turn one block into another — extending it into a block editor means writing a schema, a
transaction model and selection mapping, which is building ProseMirror badly inside a design system.
The docs for both say which to reach for. ADR-0019 records the decision and the dependency.

Only the MIT distribution of Tiptap is used, and **no Pro extension may be added without a further
ADR** — drag handles, comments and AI are paid, and a licence behind a component the docs tell every
team to reuse freely is a decision rather than a detail.

Two things the component gets right that are easy to get wrong:

**It is uncontrolled.** `value` seeds the document once; writing HTML back on every keystroke re-parses
it and drops the selection. Remount with a `key` to replace content from outside.

**`onChange` only fires when the document actually differs.** ProseMirror can emit an update for its
own parse of the seed — normalising attribute order, dropping a stray wrapper — and a consumer counting
those calls sees an edit nobody made, so "unsaved changes" lights up on a document that was only
opened. The component compares the serialisation before reporting.

Document typography lives in `globals.css`, scoped to `.ds-editor-content`, applied with `@apply` and
the named type classes: ProseMirror renders its own DOM out of reach of a React `className`, and
typography is deliberately not exposed as CSS variables, so a hand-written `font-size` there would be a
second definition of `h4` free to drift.

`DirectoryListPage` also gains **`emptyAction`**, forwarded to the table's empty state. It is distinct
from `actions`, which sits in the toolbar whether the list has rows or not: on a first run the toolbar
is a long way from where the reader is looking, which is the middle of an empty table telling them
there is nothing here.
