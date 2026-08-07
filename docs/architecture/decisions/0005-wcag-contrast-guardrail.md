# ADR-0005: Enforce WCAG contrast with an automated token check

- **Status:** Accepted
- **Date:** 2026-07-19
- **Deciders:** Repository maintainer + AI
- **Tags:** design-system, accessibility, tokens, guardrails

## Context

The constitution and the Accessibility foundation both state "WCAG 2.1 AA is the floor." But this
lived **only as prose** — there was no mechanical enforcement. As a result, low-contrast color
tokens shipped unnoticed: the `warning`/`info` status chips (2.9:1 and 4.4:1) and, on the first
run of the new checker, `brand.onPrimary on brand.primary` (white on `#EB5424` = 3.6:1) all failed
AA despite the "floor" rule. This is the classic *governance-by-prose decays* failure the
constitution itself warns about (W2): a rule nobody can mechanically fail is a rule that gets
broken.

## Decision

Contrast is enforced **mechanically**, not by eye or by prose:

1. `apps/design-system/scripts/check-contrast.ts` validates **every semantic token pairing**
   (text on backgrounds; status `fg` on `subtle` and `onSolid` on `solid`; risk `fg` on `subtle`;
   `onPrimary` on brand; icon/focus-ring graphical contrast) against WCAG — **text at AA
   (≥4.5:1)**, **graphical/UI at ≥3:1** — and exits non-zero on any failure. Disabled/placeholder
   text is reported as exempt (WCAG 1.4.3).
2. `npm run check:contrast` is part of the **Definition of Done** (CONTRIBUTING.md) and the
   component/token creation rules (AI_CONSTITUTION.md §8).
3. **Any new or changed color token must be added to the checker** with its intended fg/bg. A
   token that fails AA for its intended use is a **defect**, not a stylistic preference.
4. Failing status/risk foregrounds and solid fills were darkened one palette step to pass
   (documented inline in `tokens.ts`).

## Consequences

- Contrast regressions are caught immediately and cheaply, by any AI or human, without judgement.
- **The check gates the build**: it runs as npm `prebuild`, so a contrast regression aborts
  `next build` *before* it compiles (verified: a deliberately-broken token exits 1 and Next.js
  never runs). It is also part of the DoD and can be wired into CI. A build cannot ship a
  contrast regression.
- Vibrant brand colors that can't carry small white/colored text at AA are surfaced as explicit
  decisions rather than silent failures.

## Resolved: brand orange exception

`brand.primary` = `#EB5424` gives **3.60:1** with white text — below AA (4.5) for normal text,
above the 3:1 bar for large text / UI.

**Decision (owner):** keep `#EB5424` exactly, to match the live product's primary CTA, recorded as
a **deliberate, documented exception** — never a silent pass. It is encoded as an explicit
`waiver` in `scripts/check-contrast.ts`: the pairing is reported as `WAIVED` on every run (with its
justification and this ADR reference) and does not fail the build, so the check stays green **and**
the exception stays visible and auditable. Removing or adding a waiver is a deliberate code change,
never a silent one.

**Compliance guidance (applies to all future components):** brand orange with white text/fill is
compliant only as *large text* — use `#EB5424` + white at **≥24px, or ≥18.66px bold**. For smaller
brand-colored text, use a darker orange (e.g. `#C9441E` = 4.85:1). Weight alone does **not** rescue
normal-size text.

## Alternatives considered

- **Rely on the prose rule + manual review:** rejected — it already failed. Humans and models miss
  contrast math.
- **A full CI/a11y pipeline (axe, Storybook a11y) now:** deferred — heavier than needed at this
  stage; the token-level check catches the most common, systemic failures cheaply. Component-level
  a11y automation can be added later without contradicting this ADR.
