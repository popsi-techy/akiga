---
"@akiga/design-system-app": patch
---

`RadioCardGroup` centres its radio dot against the icon tile.

An option with an icon puts a 16px dot beside a 32px tile, and both were pinned to the top of
the card — so the control read as sitting above the thing it selects, most visibly on
two-column outlined cards where the card is 56px tall. The dot now centres on the tile's
height when there is an icon, and keeps aligning to the label's first line when there is not,
which is where the eye starts on a text-only option.

Also adds **Advanced attribute mapping** to an application's Configure rail: identity
classification for imported users, then account-fetch and entitlement-fetch attribute maps
behind a tab each.

Identity classification asks the question the configuration actually turns on — does this
source send one identity type, or several? One type needs a single select and nothing else.
Several needs the field to read, a fallback for unmatched records, and the rules themselves.
Presenting both at once (a required default plus optional rules) made a reader assemble that
distinction from two labels; asking it outright means each answer only shows the fields it
needs.
