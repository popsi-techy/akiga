---
"@akiga/design-system-app": minor
---

The creation drawer previews the setup checklist, and the step list becomes one definition.

**In the drawer**, below Description, a preview of what Continue leads to: heading **Upcoming setup
steps**, helper *You will configure these in the next steps:*, then **Assignments\*, Eligibility
criteria\***, **Owners, Advanced configuration**. Required steps keep the form asterisk, so the
gate matches the rest of the product without repeating the word Required.

The Continue button promised more without saying what, so the reader could not tell whether they
were two fields from a working profile or twenty.

Static and unclickable on purpose — none of it exists yet, and a row that looked pressable before the
profile is created would be a promise the drawer cannot keep. `Basic details` is left out because it *is*
the form being filled in.

**`EA_SETUP_STEPS` is now the one ordered list**, and required-ness comes from `isRequiredSetupStep`, which
reads the activation gate rather than re-declaring it. This order is read in four places — the drawer's
preview, the profile's checklist, the tab strip, and the "Add X and Y" sentence — and it has already had to
change once. A fourth hardcoded copy is the one that drifts silently, because nothing fails when it
disagrees; it just tells a different story on a different screen.

`EmergencySetupCard` now maps over that list and contributes only what belongs to its screen — the hint, the
CTA, the tab a row opens, and whether it is done. `EA_REQUIRED_CHECKS` entries carry an `id` matching the
step ids so the two can be joined without matching on prose.

Verified after the refactor: checklist order and done-state unchanged (Basic ✓, Assignments ✓, Eligibility
pending with its CTA, Owners pending, Advanced "Default applied"), asterisks on exactly the three gating
steps, and the footer still naming what blocks activation.
