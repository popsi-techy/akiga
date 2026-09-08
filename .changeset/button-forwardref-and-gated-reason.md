---
"@akiga/design-system-app": minor
---

`Button` forwards its ref, so tooltips on buttons render at all — and the request wizard's gated
Submit says why it is unavailable.

**Every `<Tooltip><Button/></Tooltip>` in the product was silently doing nothing.** `Button` was a
plain function component, so MUI's Tooltip had nowhere to anchor its popper: React logged "Function
components cannot be given refs" on every render and no tooltip ever appeared. That included the two
in `RequestWizardChrome` — the Back button's label, and the one explaining a disabled primary CTA.
`React.forwardRef` fixes all of them at once.

That mattered more than a missing label here, because `Button` maps `disabled` to `aria-disabled`
rather than the native attribute **specifically** so a gated control stays in the tab order and the
explanation stays reachable. With the tooltip broken, every gated button was paying the whole cost of
that choice — a focusable control that does nothing — and delivering none of the benefit.

**The wizard's Submit now names what is missing.** It gates on two conditions and said neither:

- no items → "Add at least one entitlement to submit this request."
- justification under 10 characters → "Add a justification of at least 10 characters."

Items first, since there is nothing to justify until something is being asked for. `describeChild`
puts the reason on `aria-describedby`, so it explains the button rather than renaming it, and the
tooltip opens on focus — a reader who tabs there hears why rather than just "Submit Request,
unavailable".

Audited the rest of that button while I was there: label contrast 4.60:1, focus ring 3.45:1 against
the dock's ground, target 287×36, `aria-disabled` announced, activation neutralised. The missing
reason was the only gap.
