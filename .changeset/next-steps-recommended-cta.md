---
"@akiga/design-system-app": minor
---

`NextStepsCard` — one recommended step, opened, with a CTA naming the work. And the title names the goal:
**To activate this access** on a profile, **To activate this policy** on an SoD policy, in place of
"Recommended next steps" — which described the card's own contents and left the reader to work out what the
steps were for. The required rows still carry the asterisk and the footer still names what is actually
blocking, so the title can state the purpose without claiming every row is mandatory.

Every row used to carry a 36px icon tile, its own description and a `Completed`/`Pending` chip. Five rows
of equal weight, and no answer to the only question a checklist exists to answer: *what do I do now.*

**One row is open at a time.** It gets the tint, its description, and a CTA that names the work —
`Add criteria`, `Add assignments`, `Build ruleset`. The rest collapse to a line and a mark. A checklist
only guides if one row looks different from the others.

**The first click opens a row; the second leaves the page.** A single click that navigated meant the reader
had to leave in order to find out what a step involved, and the description they needed in order to choose
was on the row they had already abandoned. Opening is cheap and reversible, navigating is neither, so they
are two gestures — and the CTA appearing is what says the next click commits. It names the work, so
"Add assignments" is both the label and the promise.

Which row starts open is the first unfinished step, and it tracks the work while the reader is passive:
finish that step and the next takes its place with nobody clicking. Once they pick a row the choice sticks,
including on a step already done — revisiting finished setup is normal, and a selection that jumped as data
changed underneath them would be the card arguing with the reader.

**Status is a mark, not a chip.** A filled tick for done, a dashed ring for pending — matched to the same
box, so the column reads as one mark in two states. A column of `Completed` chips beside a column of ticks
was the same fact twice. The one chip that survives is `Default applied`, because there a plain tick would
overclaim: nobody chose those limits. That is now the documented rule for `doneLabel` — set it only when a
tick would overclaim.

**The recommended row is bounded, not just tinted.** `background.subtle` and `surface.hover` are both
`#F9FAFB`, so a tint alone meant any hovered row looked recommended, and the recommended one was
indistinguishable while the pointer sat on it. The hairline is what survives hover — caught by measuring
the rows rather than by looking at them.

**The CTA is a primary `span` styled as a button.** Primary because on a draft the header's Activate is
disabled, so this is the one live action on the screen and the colour belongs to it — measured, it is the
only filled orange present. Worth flagging the other state: once every requirement is met, Activate becomes
filled too and a reopened step's CTA would make two. Owner's call, taken deliberately; if it reads badly
there, the fix is for the CTA to step down to `secondary` while the object is activatable rather than
demoting it on the draft, where it is doing the work.

It stays a `span` rather than a button: the whole row is already the target, and a real button inside it
would be invalid HTML and a second place to press for one outcome.

**The descriptions grew into sentences.** They were label-length fragments written for a row that always
showed them — "Name and description", "What it hands over" — which is all a permanently-visible line can
afford. Now that a hint appears only on the row being acted on, it has room to answer the question that
decides whether to go there: *the entitlements and technical roles a session hands over, then takes back*.
All seven across both modules were rewritten, and each measured at one line (56–77 characters) at the card's
width, so the row height does not jump when it opens.

`NextStep` loses `icon` and gains a required `cta`, so a caller cannot add a step without saying what its
action is called. Both callers updated — Emergency Access (five steps) and SoD Policies (two) — and the
five per-step icon imports came out with the tiles.
