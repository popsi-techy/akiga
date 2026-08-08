# Visual Language

**What akiga looks like, and why.**

[`ux-principles.md`](./ux-principles.md) defines what a screen must *do*. The Design System defines
*which* token or component to use. This document is the layer between them: the aesthetic decisions,
stated as constraints, so a screen built from it looks designed rather than merely assembled.

It exists because the rest of the governance rewards correctness — tokens, accessibility, reuse,
every state shipped — and nothing in it fails a screen for being bland. This does.

> **Rule of use.** Read this before writing any UI. When it conflicts with a personal preference,
> this wins. When it conflicts with `AI_CONSTITUTION.md`, the constitution wins — then come back and
> propose an amendment here rather than making a one-off exception in a component.

---

## 1. The thesis

akiga is a **light, dense, calm governance console**. Someone using it is reading a lot of
consequential data and making decisions that revoke people's access. The interface earns trust by
being quiet, legible, and consistent — not by being decorated.

Three commitments follow from that, and everything below is an application of them:

1. **Structure carries hierarchy — not boxes.** Space, type size, and weight separate things.
   Borders and fills are a last resort. A screen with five nested bordered containers has no
   hierarchy; it has five borders.
2. **Colour is information.** Chromatic colour means *status* or *the one thing you can act on*.
   Anything decorative is greyscale. If a colour on screen doesn't answer "what state is this?" or
   "what do I click?", it shouldn't be chromatic.
3. **Density with air.** Rows are tight so you can scan hundreds of them; the regions containing
   them are generous so the eye knows where one thing ends and the next begins. Tight *inside*,
   generous *between*.

The bar is Linear / Stripe / Figma-grade craft. Not their look — a dark marketing canvas is the
wrong genre for this product — their **precision**: everything on a grid, one accent used sparingly,
type doing the work, nothing arbitrary.

---

## 2. The protagonist rule

**Every screen has exactly one protagonist. Everything else is support and must visibly recede.**

Deciding this first is what prevents the most common failure: a page where the header, the filters,
the table, and the sidebar all shout equally.

| Archetype | Protagonist | Everything else |
|---|---|---|
| **List / inbox** | The table | Title block, tabs, search — one thin band above it |
| **Object detail** | The decision and its evidence | Right rail is context; it never out-weighs the main column |
| **Canvas workspace** | The work surface | Chrome collapses to a ~44px bar; the stepper replaces the page title |
| **Wizard step** | The single question being asked | Preview/impact panel supports it, never competes |
| **Chooser / landing** | The choice cards | Prose above them is one sentence |
| **Dashboard** | "What needs me" | Org-wide stats sit below the fold of attention |

Test: *if you deleted everything except the protagonist, would the screen still do its job?* If yes,
the rest is correctly subordinate. If the screen collapses, something else is the real protagonist —
name it and design accordingly.

---

## 3. Surfaces and depth

### 3.1 The ladder

akiga is a **light** system with a short ladder. Depth comes from tone and hairlines, not shadow.

| Level | Token | Where |
|---|---|---|
| Canvas | `background.canvas` `#FFFFFF` | The page |
| Recessed | `background.subtle` `#F9FAFB` | Working areas that sit *behind* content — workspace columns, canvas |
| Sunken | `background.sunken` `#F8F8FA` | Inset strips: trail bars, table headers, code blocks |
| Surface | `surface.default` `#FFFFFF` | Cards, rows, menus — the thing you read |
| Selected | `surface.selected` `#FFF4EE` | The row or node you picked |

Note that canvas and surface are both white. **That is deliberate**: a card is distinguished by its
hairline and its padding, not by being a different white. Only *recessed* areas tint.

### 3.2 Lift or divide — pick one

The most common mistake in this codebase's history: boxing everything.

- **Divide with a hairline** (`border.default` `#E1E4E8`) when items are peers in a sequence — table
  rows, list rows, columns of a browser, sections of a rail.
- **Lift onto a card** (`surface.default` + 1px `border.default` + `radius.lg` 12px) when a thing is
  a self-contained object you could move elsewhere and it would still make sense.
- **Never nest a card inside a card.** If you need grouping inside a card, use a heading and space,
  or a `background.sunken` inset block.

### 3.3 Shadow

Shadows indicate *floating above the page*, never decoration.

| Token | Use |
|---|---|
| `elevation.xs` | Resting stat tiles — the only "resting" shadow permitted |
| `elevation.sm` | Hover on an interactive card; the selected node in a graph |
| `elevation.md` | Menus, popovers, tooltip cards |
| `elevation.lg` | Drawers |
| `elevation.xl` | Modals |

A card that never moves and cannot be clicked gets **no shadow**.

---

## 4. Type

DM Sans throughout. The scale is deliberately compact — base body is **14px**, not 16 — because this
is a data console. Compactness is not permission to be flat.

| Token | Size / line | Weight | Job |
|---|---|---|---|
| `display` | 32 / 40 | 700 | Reserved. Marketing-scale moments only |
| `h1` | 28 / 36 | 700 | Page title on padded pages |
| `h2` | 24 / 32 | 700 | Rare — a major in-page division |
| `h3` | 20 / 28 | 600 | Section heading |
| `h4` | 18 / 26 | 600 | Canvas page title (the compact header) |
| `h5` | 16 / 24 | 600 | Region and section headings |
| `card-title` | 15 / 20 | 400 | Rail card heading — names its contents without competing |
| `body-lg` | 16 / 24 | 400 | Lead paragraph under a page title |
| `body` | 14 / 20 | 400 | **Default.** Prose, tab labels |
| `body-medium` | 14 / 20 | 500 | Soft emphasis |
| `body-strong` | 14 / 20 | 600 | Emphasis at body size — a row's primary line |
| `body-sm` | 13 / 18 | 400 | Table cells, field labels, dense metadata |
| `body-sm-medium` | 13 / 18 | 500 | Soft emphasis |
| `body-sm-strong` | 13 / 18 | 600 | Emphasis at 13px — a table row's name, a field value |
| `caption` | 12 / 16 | 400 | Secondary lines, timestamps |
| `caption-medium` | 12 / 16 | 500 | Soft emphasis |
| `caption-strong` | 12 / 16 | 600 | Chip labels, counts, small marks |
| `overline` | 12 / 16 | 600, +0.06em, upper | Taxonomy labels inside a region |
| `micro` | 10 / 14 | 600 | Avatar initials, badge numerals |
| `stat` | 24 / 28 | 700 | KPI numerals |

**A `text-*` class is the complete type style.** Size, line height, tracking and weight
all come from the token. To emphasise, switch to the `-strong` partner — never add
`font-semibold` to a size class. The two exceptions are named: `font-emphasis` (600) for
text whose size is inherited or set dynamically, and `font-normal` (400) to de-emphasise a
run inside a stronger parent. `npm run check:type` fails the build on anything else.

**Three weights, and when each applies.** Every body size has `…` (400), `…-medium` (500)
and `…-strong` (600).

- **400** — everything not emphasised.
- **500 (`-medium`)** — the soft step. In DM Sans the 400 → 500 delta is about 1.7% of
  width, so it reads at 15px and up but barely registers at 12–14px. Reach for it when a
  label should sit *slightly* above its neighbours, not when the emphasis must be obvious.
- **600 (`-strong`)** — the firm step, and the default for emphasis in dense UI: a row's
  primary line, a field value, a chip label. If in doubt at ≤14px, use this.

Whichever you want, it is a **type role**, never a weight utility: say `body-medium`, not
`body` + `font-medium`.

### Rules

1. **Adjacent levels must differ by at least two steps, or by a weight change.** `body` next to
   `body-sm` at the same weight is not a hierarchy — it's a rendering accident. A row's
   label/sub-line pair is `body-strong` over `caption`, or `body-sm-strong` over `caption`.
2. **Three type levels per region, maximum.** A card with a title, a body, a label, a value, a
   caption and a chip has no hierarchy left to give.
3. **Weight before size.** Going 400 → 600 at the same size separates more cleanly, and more
   compactly, than jumping a size — which is exactly what the `-strong` partners are for.
4. **`overline` is taxonomy, not a heading.** It names *what kind of things these are*
   ("APPLICATIONS", "USER ACCESS THAT WILL BE REVOKED"). It never carries meaning you'd lose by
   removing it.
5. **Numbers are `tabular-nums`.** Always — counts, scores, ranges, money, dates in tables.
6. **Never invent a size.** If the design needs 15px, the answer is 14 or 16.

---

## 5. The colour budget

### 5.1 Orange is scarce

`brand.primary` `#EB5424` is reserved for **six** things. Nothing else on a screen is brand orange:

1. The product mark and active navigation item
2. The **one** primary action on the screen
3. Selection — selected row, selected tab (label + 2px indicator), selected node
4. Focus rings
5. Identity tint — avatar background `#FFF4EE` with the letter in `#EB5424`
6. Progress that is actively yours — the current step, the active edge in a graph

If a screen shows two orange buttons, one of them is wrong. Demote it to `secondary`.

### 5.2 Status colour only on status objects

Chips, dots, meters, rule outcomes, risk badges. **A container never takes a status colour.** A card
about a critical violation is a normal white card containing a red chip — not a red card.

**Taxonomy tags are the one permitted non-status tint.** A chip that names a *kind of thing*
("Applications", "Business Role") rather than a state may use `info` blue, under one condition: **no
status chip appears in the same region.** Blue must mean exactly one thing to the reader at a time —
where a list row shows an "In Progress" chip, a blue taxonomy tag beside it would make blue
ambiguous, and the tag goes grey. Tint via `StatusChip intent="info" dot={false}`, never a local
pill, so the tag inherits the chip's shape, type step, and verified contrast.

Everything else holds: a decorative tint that answers neither "what state?" nor "what kind?" is
greyscale.

Intents and their meanings are fixed:

| Intent | Means | Hue |
|---|---|---|
| `info` | Informational; in progress; the low end of a scale | Blue |
| `success` | Done, resolved, healthy | Green |
| `warning` | Needs attention; pending on the user | Amber |
| `caution` | Between warning and danger — the fourth step of a 4-level scale | Orange |
| `danger` | Destructive, failed, critical | Red |
| `neutral` | No state; not applicable | Grey |

**The four-level risk/severity ramp is one hue per level, and it is not negotiable:**
Low → `info` · Medium → `warning` · High → `caution` · Critical → `danger`.
Low is blue, never green: green says "all clear", but a low score is a measurement, not an
all-clear. Render it through `RiskScoreChip` / `RiskDot` / `SeverityChip` — **never re-map a score to
a colour in product code.**

### 5.3 The squint test

Squint at the finished screen. You should see: greys and white, one orange thing, and small coloured
marks where status lives. If you see broad areas of colour, or more than one orange, cut.

### 5.4 Text colour

`text.primary` `#172B4D` for content · `text.secondary` `#44546F` for supporting lines ·
`text.tertiary` `#54637B` for hints and disabled-adjacent labels · `text.disabled` `#808B9E`
placeholders only. **Small brand-coloured text uses `text.brand` `#C9441E`, not `#EB5424`** — except
where a documented waiver says otherwise (selected tab labels).

---

## 6. Density and rhythm

Base unit **4px**. Every dimension is a multiple. No 5px, no 15px, no 18px padding.

### 6.1 Controls — one height per size, always

| Size | Height | Use |
|---|---|---|
| `sm` | 36px | **Default in the product.** Toolbars, table filters, dense forms |
| `md` | 40px | Standalone forms, primary page actions |
| `lg` | 48px | Rare — a single hero action |

Every control of the same size shares that height (Button, Input, Select, DatePicker, TimePicker), so
a toolbar row lines up without adjustment. **Never hand-tune a control's height to fit a layout** —
change the layout, or add a documented size to the DS.

### 6.2 Containers

| Thing | Padding |
|---|---|
| Padded page | 32px sides, 24px top (the app frame supplies this) |
| Canvas page header | 20px sides, 10px vertical |
| Card (default) | 20px (`p-5`) |
| Card (feature / empty state) | 24px (`p-6`) |
| Card header | 20px sides |
| Table cell | 16px sides |
| Inset strip (trail, sunken block) | 20px sides, 8px vertical |

### 6.3 Rhythm

- **Between page regions:** 20–24px. Between a heading and its content: 12–16px.
- **Between peer rows:** 0 (hairline) in tables; 4–8px when rows are cards.
- **Inside a row:** 10–12px between the visual, the text block, and the trailing content.
- **A label and its value:** 2–4px. They are one unit; anything more breaks the pair.

### 6.4 Truncation

Enterprise data is long. Every text cell truncates rather than wraps, **except** descriptions, which
clamp to 2 lines. When a row has a trailing element, the text truncates — the trailing element never
gets pushed out or clipped. Icons and chips are `shrink-0`; text containers are `min-w-0`.

---

## 7. Motion

Motion confirms causality — this happened because you did that. It is never ambience.

| Duration | Use |
|---|---|
| `instant` 80ms | Press feedback |
| `fast` 120ms | Hover, focus, colour changes |
| `base` 200ms | Reveal, expand, tab change, chip appearance |
| `slow` 300ms | Drawer and modal enter |
| `slower` 400ms | Canvas pans, multi-element reflows |

Default easing `standard`; use `decelerate` for things entering, `accelerate` for things leaving.

**Never animate:** table rows when data changes, the position of persistent chrome, anything at page
load, or a value the user is trying to read.

**Always animate:** a canvas panning to reveal something the user just uncovered, a drawer or modal,
and any state change that would otherwise appear to teleport.

---

## 8. Screen archetypes

Start here for any new screen. Deviating is allowed; deviating without a reason is not.

These are **blueprints, not sketches** — every number below is measured from the shipping screen
named as its reference, so a new screen can be built to match without opening one and eyeballing
it. Measurements are at a 1440×860 viewport with the rail expanded: content width 1184px, `<main>`
padding 24px top/bottom and 32px left/right.

**Two frames.** Every screen is one of them, and choosing is the first decision you make:

| | Padded | Canvas |
|---|---|---|
| Used by | list, object detail, chooser, dashboard | builder, workspace, explorer, decision detail |
| Frame | inherits the `<main>` padding | cancels it: `-mx-8 -my-6 h-[calc(100%+3rem)] flex flex-col` |
| What scrolls | the page | nothing — only inner regions |
| Title | `h2` (list) or `h3` (detail) | `h5` |

**Page title by archetype — do not invent a fourth tier.** The product is consistent here; match
it rather than reaching for `h1`, which is reserved and currently unused:

| Archetype | Title | Lead |
|---|---|---|
| Padded list / landing | `h2` 24/700 | `body` 14/400 secondary |
| Padded object detail | `h3` 20/600 | `body-sm` 13/400 secondary |
| Canvas page (builder, workspace, detail) | `h5` 16/600 | `body-sm` 13/400, or none |

A canvas title is deliberately the smallest of the three: its chrome is a thin bar and the work
surface below it is the protagonist.

---

### 8.1 Padded list page

> Reference: `/iga/reviewer/sod-resolution-v3`, `/iga/directory/*`, `/iga/emergency`

```
+-- main - pad 24 / 32 ------------------------------------------+
|  h2 title                                    [primary action]  |  32h
|  (gap 4)                                                       |
|  body lead, secondary                                          |  20h
|  (gap 20)                                                      |
|  tabs (with counts)                                            |  42h
|  (gap 16)                                                      |
|  [ search 384w ] [ filter ]                     [ export ]     |  36h
|  (gap 16)                                                      |
|  +-- table - fills remaining height, scrolls its own body ---+ |
|  |  header row 46h | body row 55h | cell pad 10 / 16         | |
|  |  footer: rows-per-page | range | pager                    | |
|  +-----------------------------------------------------------+ |
+----------------------------------------------------------------+
```

| Region | Spec |
|---|---|
| Title to lead | 4px. The lead is one sentence, `text-secondary` |
| Lead to tabs | 20px |
| Tabs band | 42px tall, 40px min tab height, 24px between labels |
| Toolbar | 36px controls (`size="sm"`); search capped at `max-w-sm` (384px) |
| Toolbar to table | 16px |
| Table | `fillHeight` — takes the rest and scrolls internally. **The page never scrolls** |
| Rows | 55px with a two-line cell, 46px header, cell padding 10px/16px |

The whole row is the click target. Every tab needs its own empty state: a title plus one line
saying what will appear there and why it is empty.

---

### 8.2 Padded object detail

> Reference: `/iga/directory/user-identities/[id]` (via `DetailShell`)

```
+-- main - pad 24 / 32 ------------------------------------------+
|  < Back to Users                        caption-strong 12/600  |  16h
|  (gap 10)                                                      |
|  [avatar 40] h3 title  [chips]                    [actions]    |  25h
|               body-sm description, max-w-2xl                   |
|  (gap 36)                                                      |
|  tabs                                                          |  42h
|  (gap 20)                                                      |
|  +-- 2-up grid - 550 + 550, gap 20 -------------------------+  |
|  |  Card (framed) - header 15/400 - white inner panel       |  |
|  +----------------------------------------------------------+  |
+----------------------------------------------------------------+
```

The back link is `caption-strong` text, not a button. Related entities live in tabs, never
stacked down the page.

---

### 8.3 Canvas detail

> Reference: `/iga/reviewer/sod-resolution-v3/[id]`

```
+-- canvas - -mx-8 -my-6 - fills the frame, never scrolls -------+
|  header band - pad 20 top/side, 0 bottom            ~122h      |
|   [avatar 40] h5 Title - qualifier  [status chip]  [primary]   |
|   body-sm sub-line: what you can do here, in one sentence      |
|   tabs                                              42h        |
+----------------------------------------------------------------+
|  +-- main column (scrolls) ------+  +-- rail 320-360 --------+ |
|  |  h5 region heading + search   |  |  context Card          | |
|  |  cards / rows                 |  |  subject Card          | |
|  +-------------------------------+  +------------------------+ |
+----------------------------------------------------------------+
```

The rail is context you consult, never the main event. Rail cards are `Card` + `InfoRowGroup`.
The main column and the rail scroll independently.

---

### 8.4 Canvas workspace (and wizard steps)

> Reference: `/iga/reviewer/sod-resolution-v3/[id]?view=workspace`,
> `/iga/automation/approval-policies/[id]/builder`

```
+-- canvas - fills the frame, never scrolls ---------------------+
|  header band   shrink-0   px-5                       53h       |
|   [avatar] h5 Title                        [view/mode ctrl]    |
+----------------------------------------------------------------+
|  stepper + action bar   shrink-0   gap-4             61h       |
|   (1) Step > (2) Step > (3) Step      [secondary] [PRIMARY]    |
+----------------------------------------------------------------+
|  +-- work surface 60% (710) -----+  +-- live preview 40% ----+ |
|  |  section heading   shrink-0   |  |  heading + progress    | |
|  |  +-- scrolls ---------------+ |  |  +-- scrolls -------+  | |
|  |  |  the one question this   | |  |  |  consequence of  |  | |
|  |  |  step asks               | |  |  |  the answer, live|  | |
|  |  +--------------------------+ |  |  +------------------+  | |
|  +-------------------------------+  +------------------------+ |
+----------------------------------------------------------------+
```

| Region | Spec |
|---|---|
| Header band | 53px, `shrink-0`, bottom hairline |
| Stepper band | 61px, `shrink-0`. Stepper left, actions right, both vertically centred |
| Split | 60 / 40. Left is the action; right previews its consequence and updates live |
| Section headings | A `shrink-0` strip **above** each scroll area, so it never scrolls away |
| Action bar | Persistent. The primary is disabled-with-a-tooltip, never absent |

One question per step. A way back always exists — the stepper's back arrow, or an explicit Edit
on a final review step (which owns its own way back, so the arrow is suppressed there).

---

### 8.5 Chooser

> Reference: `/iga/access-view`

```
+-- main - pad 24 / 32 ------------------------------------------+
|  h2 title                                   [skip for now >]   |  32h
|  body lead                                                     |  20h
|  (gap 24)                                                      |
|  Callout - full content width                        50h       |
|  (gap 20)                                                      |
|  +-- 2-up grid - max-w-5xl (1024) - 502 cards - gap 20 ------+ |
|  |  card p-5 r-12: h4 title + arrow, dashed chain, prose     | |
|  +-----------------------------------------------------------+ |
+----------------------------------------------------------------+
```

The banner spans the full content width; the card grid is **capped and left-aligned**, not
stretched — two cards spread across a wide monitor read as a toolbar rather than a choice.

---

### 8.6 Dashboard

> Reference: `/iga/dashboard`

```
+-- main (scrolls) - inner max-w 1200 ---------------------------+
|  h2 greeting                                     [Customize]   |
|  (gap 24)                                                      |
|  KPI row - 4-up - gap 16 - StatTile                  96h       |
|  (gap 20)                                                      |
|  card grid - 3-up - gap 16 - equal-height Cards      352h      |
|  (gap 20)                                                      |
|  card grid - 3-up - gap 16                           352h      |
+----------------------------------------------------------------+
```

The only archetype where the page itself scrolls. "What needs me" comes before org-wide totals.
Card header icons stay `text-icon` grey — a dashboard is where decorative tinting creeps in, and
six differently-coloured card headers is not a hierarchy.

## 9. Building from a reference or screenshot

When given a screenshot, mockup, or a link to an interface to build: **reproduce its structure
faithfully; render it entirely in akiga's own material.** The reference supplies the plan, not the
paint.

### 9.1 Read it back first

Before writing any code, state in three bullets:

1. **Regions** — top to bottom, left to right, and which are fixed vs. which scroll.
2. **The protagonist** — what dominates, and how much of the frame it takes.
3. **Per repeating element** — what is primary, secondary, and trailing in each row/card.

If the read-back is wrong, correcting three bullets costs nothing. Correcting a built screen costs
the whole build.

### 9.2 Reproduce exactly

- The **region layout** and their order, proportions, and split ratios.
- What is **fixed vs. scrolling**, and what is sticky.
- The **information design**: which field leads, which is secondary, what sits on the right.
- The **relative rhythm** — if the reference is airy, be airy; if dense, be dense.
- The **interaction shape**: what is clickable, what discloses, what is selected.
- The **element order inside a row**, including where an affordance like an info icon sits.

### 9.3 Convert, never copy

| In the reference | What we ship |
|---|---|
| Any hex value | The nearest **semantic token** — by role, not by eye |
| Its typeface and sizes | DM Sans at the nearest step of **our** scale |
| Its radii, shadows, borders | Our `radius` / `elevation` / `border` tokens |
| Its controls | The DS component that plays that role |
| Its icon set | MUI Outlined at our sizes (14/16/18/20) |
| Its spacing | Snapped to our 4px scale and control heights |
| A dark reference | Translate **by role**: their canvas → our canvas, their surface-1 → our surface, their hairline → our border. Never invert literally. |

**Never** sample a colour from an image. **Never** add a font. **Never** reproduce a competitor's
brand colour, logo, illustration, or proprietary visual signature — take the structure and the
information design, which is what is actually useful.

### 9.4 When the reference has something we don't

1. Use the nearest existing DS component and say so.
2. If nothing is near and the pattern will recur, add it to the Design System properly — document,
   register, then consume. Never build a one-off local control.
3. If the reference does something that violates this document (three accent colours, a status-tinted
   card, a fourth type level), **build it our way and say which rule it broke.** Fidelity to the
   reference does not override the visual language.

### 9.5 Report the translation

After building, a short note: what was reproduced exactly · what was converted and to what · what
was deliberately not copied and why. This is how a reference-built screen stays reviewable.

---

## 10. Do and Don't

### Do

- Decide the protagonist before writing markup.
- Separate with space first, a hairline second, a card third.
- Use `body 500` over `bodySm 400` for a label/sub-line pair.
- Keep every same-size control on the same height.
- Put counts, scores and ranges in `tabular-nums`.
- Truncate text, clamp descriptions to 2 lines, and keep trailing elements `shrink-0`.
- Reserve orange for the six things in §5.1.
- Give every list an empty state that says what will appear there and why it's empty.
- Give every disabled primary action a tooltip explaining what unblocks it.

### Don't

- Don't nest cards, or wrap a bordered thing in another bordered thing.
- Don't tint a container with a status colour.
- Don't put two primary buttons on one screen.
- Don't introduce a second accent hue, a gradient, or a decorative illustration.
- Don't invent a size, spacing value, radius, or colour that isn't a token.
- Don't use `display`/`h1`/`h2` inside a canvas page — its header is `h4`.
- Don't animate data, or anything on page load.
- Don't let a design-system component's default height dictate a layout you know is wrong — fix the
  component, with a documented size.
- Don't mistake "it renders and passes contrast" for "it's finished". See §11.

---

## 11. The review pass

Run this before calling any UI done, and report what's weak — the same way contrast is reported.
"It renders" is not a design review.

1. **Squint.** One focal point? Or does everything weigh the same?
2. **Protagonist.** Is it the thing §2 says it should be, and does it own the most space?
3. **Hierarchy.** Name the levels in each region. More than three? Collapse them.
4. **Type contrast.** Does every adjacent pair differ by two steps or a weight?
5. **Colour budget.** Count the chromatic elements. Count the oranges — is it exactly one action?
6. **Grid.** Every offset a multiple of 4? Controls of the same size the same height? Icons optically
   aligned to text, not box-aligned?
7. **Long and empty.** Longest realistic string — does it truncate cleanly? Zero rows — is there an
   empty state? Slow data — is there a loading state?
8. **Narrow.** At 768px: does it scroll internally, or does the page break?
9. **Motion.** Anything janky, gratuitous, or missing where something teleports?
10. **Then measure** in the browser — computed heights, scroll containment, contrast — and report
    the numbers.

For anything net-new, produce **two directions** before building the real thing: a quick static mock
of each, screenshotted side by side. Choosing is cheap; rebuilding is not.

---

## Related

- [`ux-principles.md`](./ux-principles.md) — what a screen must do
- [`AI_CONSTITUTION.md`](../../../AI_CONSTITUTION.md) §4 Design Philosophy, §8–10 creation rules
- Design System docs → Overview → Visual Language (the token-level view of this document)
- `apps/design-system/scripts/check-contrast.ts` — the mechanical accessibility floor
