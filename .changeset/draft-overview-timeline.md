---
"@akiga/design-system-app": patch
---

A draft emergency-access profile no longer shows the Timeline card, and its Overview goes single-column.

Both timestamps on a fresh draft are the same instant — the screenshot that prompted this had "Last
Updated On" and "Created On" both reading `Aug 19, 2026, 4:56 AM` — so the card spent two rows saying one
thing. It comes back once the profile has been live and edited, which is the point at which the pair
starts to differ and is worth reading. Same reasoning the Information card was already hidden under, and
now the same treatment.

**The grid collapses with it.** Those were the only two cards in the right-hand column, so hiding both
left a 340px gutter holding nothing — which reads as a panel that failed to load, not as a deliberate
empty. A draft's Overview is now one column and the setup checklist takes the full width; measured
1013px on a draft against `653px 340px` on a live profile.

Both Emergency Access modules render this component, so V1 and V2 get it from one change.
