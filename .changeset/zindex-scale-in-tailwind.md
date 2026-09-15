---
"@akiga/design-system": patch
---

The `zIndex` token scale becomes reachable from a className.

`tokens.ts` has carried eight named stacking steps since the beginning — `base`, `raised`,
`sticky`, `dropdown`, `drawer`, `modal`, `toast`, `tooltip` — and Tailwind had no matching
scale, so the only way to spend one was an inline `style`. Two components did that. Ten
call sites reached for `z-[1]` instead, and `RelationshipCanvas` wrote `z-[1300]`, which is
the literal value of `zIndex.drawer`. A token nobody can spend is a token nobody spends.

The scale is now in `tailwind.config.ts` and every arbitrary value is migrated: `z-[1]` →
`z-raised`, `z-[1300]` → `z-drawer`. `raised` is the step for "above my own sibling" —
inside a local stacking context any positive value behaves the same, and naming it is what
stops the next person inventing `z-[2]` for the same job. The two automation builders paired
a `z-[1]` label with a `z-10` delete button in one stacking context; both are `z-raised`
now, so the pair reads as one decision rather than half a named one, and the button still
paints above the label.

Tailwind's own numeric steps still work — this extends the scale rather than replacing it.

Also replaces the last two raw hexes outside the palette: `contrastText: '#FFFFFF'` in the
MUI theme becomes `p.white`, and the SoD resolution panel's `border-[#90CAF9]` becomes
`--ds-color-status-info-border`, which is the token that value already was.
