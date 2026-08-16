---
"@akiga/design-system-app": minor
---

Build Access Certification at `/iga/certifications` — the route was in the navigation registry with
nothing behind it. List with status tiles, search and filters; a template chooser where only Custom
Review is built and the rest keep their place as coming soon; and a five-step wizard for a custom
review (details → users → reviewers and outcomes → timeline → preview) that saves a draft at every
step. Adds `StepTracker`, a vertical progress rail with a sentence per step — the sibling of
`Stepper`, which reports position in a strip rather than explaining the steps in a column. The
industry word "campaign" is deliberately absent from the UI, the types and the copy: the product
calls these access certifications everywhere else. `DirectoryListPage` gains a `summary` slot for a
strip between the title and the toolbar.
