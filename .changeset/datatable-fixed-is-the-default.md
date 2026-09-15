---
"@akiga/design-system": minor
---

`DataTable` defaults to `layout="fixed"`, and every existing table says which it uses.

The component shipped the behaviour its own prop documentation told you not to use. `'auto'`
was the default "for compatibility", the doc explained at length why `'fixed'` is what you
want, and every new table then inherited `'auto'` without anybody deciding anything — 28 of
33 call sites were on it, and not one had asked for it. Every site that *had* thought about
it passed `'fixed'`.

Flipping it blind was not an option, and the doc said why: fixed stops guessing, so a table
that does not declare which column carries the name gives it the same share as its status
column. So the flip comes with the opt-outs written in. Every call site now states its
layout: `'fixed'` where columns already carry widths, `'auto'` everywhere else, which
preserves exactly what each table did before. Nothing moved. What changed is what happens to
the *next* table — it has to opt out of the good behaviour rather than into it.

`grep 'layout="auto"'` is now the work remaining: each of those is a table owed a width per
column. `ReconciliationTab` moves to `'fixed'` in this change because all six of its columns
already declare one.

`DirectoryListPage` forwards the prop, so it holds `'auto'` as its own default rather than
inheriting the new one. Without that, ten list pages that had never considered the question
would have been changed by a wrapper on their behalf — on the applications list that meant
the actions column taking the same share as Last Synced and squeezing both. That list is the
best candidate for the next one to move: on `'fixed'` its overflow drops from 190px to 5px,
and a width on the actions column would close the rest.
