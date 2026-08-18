---
"@akiga/design-system-app": minor
---

All Identities — an overview of who exists and what is wrong with it, first under the Identities group.

**No number is a dead end.** Every legend entry, every queue row and every "highest risk" line carries
the route that lists exactly those rows. The failure mode of most IGA dashboards is a wall of figures
with no verb: the reader learns there are four orphan accounts, then goes and rebuilds that filter by
hand on another screen. `StatTile` gains `href`/`onClick` for this, and the affordance is the tile's own
hover rather than a "View all" link in the corner — a second target inside a card that is already one
target gives two places to aim for one outcome.

**The population is one donut, not four tiles.** What the top band answers is how the population
*splits*, and four separate counts made the reader do that division in their head. The wedges take the
same two intents `IdentityKindChip` uses, so a population is the same colour in the chart and in the
pill wherever it is met. **`DonutChart` segments take an `href`**, which makes the legend row itself the link to the rows behind
that slice — so the rule survives without a separate strip of links under the chart. The row keeps its
colours exactly: the label stays secondary, the value stays primary, and nothing turns blue. A legend
row already carries a colour that means something, and tinting the text on top of it would run two
colour systems through one line; the row is the target, and hover is what says so.

**Highest risk sits beside the donut.** A composition on its own is a fact; the page's first thing to
*act* on belongs in the same eyeline, not a scroll below the queue. Four names, ruled apart — a
shortlist that scrolls has stopped being a shortlist and become a worse copy of the list it points at.
No "see all" link in the card's corner: a page-level escape belongs in the header, right-aligned, where
every other page keeps it, and one buried in a card teaches two places to look for the same move.

**`EntityAvatar` now forwards person-ness.** A `user` gets the round avatar and everything else — an
account, an app, a role, a team — keeps the rounded square, which is the standing rule the component
was quietly not honouring: it took a `kind` and then rendered every kind as an entity. That was visible
anywhere a person and the accounts belonging to them sit in one column, which is most of Directory.

**Exceptions are a queue, not a scoreboard.** Only non-zero findings appear, worst first, each with the
count set large, a severity chip that says what to do ("Act now" / "Review" / "Watch"), and up to three
sample names so the row is concrete before it is opened — "4 orphan accounts" is a statistic, "4 orphan
accounts, one of them on AWS" is a thing to do. A queue padded with green zeroes teaches the reader to
skim past it, and the day something appears they will skim past that too.

Findings derived: external access past its end date, inactive identities still holding accounts, open
SoD reviews, high and critical risk identities, active identities with no account anywhere.

**Orphan accounts left the queue for a card of their own**, third in the top band. They were the one
finding in that list not about a person: every other row resolves to someone you can go and ask, where
an orphan is an account whose owner is the open question — and read among those rows it kept inviting
the arithmetic the page cannot support, four of what out of the twenty identities above. As a card it
names the four accounts and the systems they sit in, which is the thing you actually need to chase them.

The band is **three equal thirds**, 328px each. That costs the risk rows their kind chip: at an equal
third the row is 279px and two chips took 179px of it, leaving the name 31px for the 74 it needs — every
person on the card truncated to a first syllable. Workforce-or-external is one click away on the identity
and on both lists, where the risk score is the only reason the card exists, so the score is what stays.
Names now fit; only the job-and-department line under them gives way, which is the order the visual
language asks for.

The card links to **App Accounts**, which marks these rows with an "Orphan" chip — the nav's own
`/iga/orphan-accounts` entry has no page behind it and would have dead-ended the reader.

**The queue has the last word.** There is deliberately no chart section beneath it. A distribution is
for exploring rather than reacting, and anything parked below the exceptions competes with the one
section on the page that has a verb in it — risk tier already reaches the reader as a chip on every
identity that matters, which is where a score is actionable.

SoD reviews are counted from the SoD module, which keeps its own reviewer population, so the figure is a
count of open reviews rather than a subset of the identities above — the code says so where the count is
built, so nobody later re-expresses it as a percentage of this directory.

---

**Needs attention, redesigned.** The queue was five near-identical three-line rows: a bare integer, a
coloured pill, a description, and a grey comma-list of names. Four type levels where the visual
language allows three, and its loudest element on every row was a pill whose words ("Act now",
"Review", "Watch") restated an order the list was already in.

- **An icon avatar leads the row**, stating the shape of the problem — a date that passed, a person
  switched off, a broken link, a rule, an account that leads nowhere — so the row is placed before it
  is read. **`Avatar` gains `icon`** for this, superseding the letter the way `StatusChip`'s icon
  supersedes its dot; it replaces a `grid h-8 w-8 rounded-md bg-brand-subtle` tile that had been
  hand-rolled in eight places at three sizes, two radii and two icon colours. The row glyphs are
  outlined: at 20px in a tinted tile a filled icon becomes a solid orange blob, and six down a card read
  as a colour block. That is the opposite of the 15px Card header case `check:icons` guards, where an
  outline disappears.

**The person ring now appears at `sm`, not just `md`/`lg`.** It is what separates a person's tint from
the surface behind it, and a screen mixing ringless 32px avatars with ringed 40px ones reads as two
components. `xs` stays bare — at 24px the ring is a third of the box's visual radius and reads as a
smudge. Checked the Workforce table for the known failure mode: the ring paints outside the avatar's box,
but those cells are `overflow: visible` with 11–16px of room against the 3px the ring needs, so nothing
clips.
- **The count carries its noun.** `4 accounts`, `10 reviews`, `1 identity` — the unit is data now, not
  a comment, which retires the footnote that used to explain SoD reviews are not a subset of this
  directory. A bare number beside a finding gets read as identities every time. It sits at the row's
  trailing edge now that the icon has the gutter, still right-aligned in a fixed width so the numerals
  form a column.
- **Severity is not drawn at all.** It began as a chip reading "Act now" / "Review" / "Watch", became a
  6px dot, and is now nothing: the queue is ordered worst-first, so position carries it. It stayed on
  the button's accessible name, because a screen reader has no position to read.
- **Faces, not a comma list.** `AvatarGroup` renders the sample, so the row is recognisable before it is
  read. All rounds, including the orphan-accounts row — one square stack among four round ones read as a
  rendering fault rather than as a distinction, and the row's own icon already says these are accounts.
- The finding label is `body-medium` (500) rather than `body-strong` (600) — a softer step above the
  description under it. Worth knowing the visual language warns that at 14px the 400 → 500 delta is
  about 1.7% of width and barely registers; the label reads as emphasised here mostly because the line
  beneath it is `caption`.
- The page carried its own `ds-scroll overflow-y-auto` container while `<main>` in the IGA layout
  already scrolls, so the right edge had two thumbs side by side. Removed — the frame owns the page
  scroll.
- The count came out again after moving. The `+N` on the face stack now carries the quantity, and
  `unit` still prints in the accessible name, so the "reviews are not identities" distinction survives
  where a bare number could mislead.
- Rows went from 14px to 16px vertical padding — 14 is not on the 4px grid — and the divider moved to
  `divide-y` on the list, so it cannot be got wrong per child.

**`AvatarGroup` now takes a `kind`** and forwards it. It hardcoded a square ring, so a group of people
rendered circles inside rounded-square rings; it had no product callers to reveal it. Overlap became
`box/4` — proportional, so it stacks at every size, and a quarter rather than the third a photo
facepile would use, because these avatars carry a single letter and past a quarter the glyph vanishes
under its neighbour. The `+N` chip is set at 0.75 of the letter size so a two-glyph count does not
outweigh the initials it summarises.
