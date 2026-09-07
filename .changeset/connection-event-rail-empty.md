---
"@akiga/design-system-app": patch
---

The connection-event drawer's rail appears with the first call, rather than sitting empty.

The rail is a switcher between the calls configured for one event kind, and there is nothing to switch
between until one exists. Empty, it was a 240px column reading "No calls yet" beside an empty state
that said the same thing 200px away, with an Add event button underneath a list that had nothing in
it — the same action the empty state already offers as its primary, in the middle of the pane where
the reader is actually looking.

Gone until it has something to hold, the empty state gets the full width and says it once. The rail
and its Add event return with the first call.
