---
"@akiga/design-system-app": patch
---

A new API call is named "<Event> 1", not "<Event>".

The first call took the bare kind label and only the second one got a suffix, so a rail read
"Accounts Fetch" then "Accounts Fetch 2" — the first looking like the event itself rather
than one call of it, and the pair distinguished by one of them having a number at all.
Several calls per event is the normal case, not the exception.

Numbering from 1 says a number is coming, and any two defaults then differ by something the
reader can see in the same position. De-duplication is unchanged otherwise: the next free
number is taken, so deleting "Accounts Fetch 2" and adding again gives 2 back.
