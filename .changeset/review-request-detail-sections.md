---
"@akiga/design-system-app": minor
---

The review-request detail page's **Requested For** and **Requested Entitlement** sections are rebuilt
against the reference design.

**One frame per section, not two.** Both sections were a `Card` — which paints a grey tray around a
white inner panel — wrapping their own bordered panel, because each needs a two-tone body (white
identity row over a grey "Requested By" strip; grey app strip over a white body). So every section
rendered a grey frame around a white frame around a white frame. `DetailSection` is a header line
plus a single bordered panel, which is also the honest count: there is one object here, not two.
Its icon is outlined at 18px — filled is reserved for a `Card` header, where the glyph is forced to
15px and a 1px stroke stops reading.

**The same sentence no longer appears twice.** The application strip printed `itemDescription`
beneath the app name — that is the *entitlement's* description, which the row below already carries,
so "Create, edit, and publish content on managed system pages." was rendered twice, six pixels
apart. The request has no description for the application itself, so the strip is now the logo and
the name: which system this lives in, which is the whole job of that strip.

**Typography follows the reference.** The subject of the page and the entitlement being decided on
read at 16px (`text-h5`) rather than 14px, a step above the fields describing them. The justification
label moves from `text-micro` (10px) to `text-overline` — at 10px it was smaller than anything else
on screen and read as a caption *under* the paragraph rather than a heading over it — and its body
from 13px to 14px.

**"Requested By" is one fact, so it looks like one.** The avatar, name, dot and job title were four
loose items in a flex row. The mark and the name now keep a tighter gap than the row's, which groups
them without a container — grouping by spacing rather than by a box, so the grey strip stays one
surface.

The entitlement inset drops its hand-picked margins for a single 16px rhythm, and the two meta chips
stretch to equal height so one wrapping to two lines does not leave the other short.

`formatRequestDate` also joins the house format: `Aug 31, 2026` rather than `1 Sep 26` — day-first
with a two-digit year, read from local time, sitting beside `Sep 1, 2026 · 10:15 AM` on the same
screen.

Two things I did **not** take from the reference, both deliberate:

- **The person mark stays a round avatar with an initial.** The reference shows a square orange tile
  with a `PersonOutlined` glyph, but avatar shape is semantic here — round for a person, square for
  an entity — and a square person mark would break that everywhere it is read.
- **No info icon beside "User Details" or the job title.** That button has no `onClick` and there is
  nowhere for it to go: `requestedForId` is `u-*`, a SoD-fixture id, while the identity directory is
  keyed `o-*`, so it resolves to nothing, and `UserDetailsDrawer` takes a `SodReview` rather than a
  person. Adding a second affordance to a control that does nothing makes it worse, not better.
  Wiring it needs a destination first.
