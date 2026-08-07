# Business Rule: <Title>

- **ID:** `BR-<AREA>-<NNN>` (stable, immutable; must match `business-rules.json`)
- **Module:** `<module-id>`
- **Status:** Draft | Active | Superseded by `<BR-id>`
- **Applies to:** `<entity-ids>`

## Statement
The rule in one clear, testable sentence. Unambiguous enough that two engineers would implement
it identically.

## Inputs
The data the rule depends on (entity attributes, configuration values, time).

## Logic
The precise behavior: conditions, thresholds, formulas, and outcomes. Use pseudo-logic or a
decision table where helpful. Keep it implementation-neutral (no code, no component names).

| Condition | Outcome |
|-----------|---------|
| | |

## Edge cases
What happens at the boundaries: null/missing data, conflicts, concurrent changes, expiry.

## Rationale
Why the rule is what it is. Link the **PDR** that decided it and any **compliance control**
(`compliance-controls.json`) that requires it.

## Related rules
Other `BR-` IDs that interact with, depend on, or could conflict with this one.

---
> Update `business-rules.json` in the same change. If this rule changes product behavior,
> record a PDR in `12-decisions/`.
