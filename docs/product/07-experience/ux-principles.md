# Product UX Principles

The small set of principles every screen must honor. These sit **above** the Design System (which
decides *how* to render); they define *what good looks like* for this product.

1. **Lead with the user's next action.** Every landing surface answers "what needs me?" first —
   pending approvals, due reviews, open violations — before org-wide browsing.
2. **Show risk and context at the point of decision.** Never ask someone to approve, certify, or
   revoke without the risk level, who/what/why, and the consequence visible in the same view.
3. **Make consequences explicit.** Destructive and governance actions state their effect
   ("users lose access immediately", "this is logged") before confirmation.
4. **Guided over open-ended.** Complex tasks (requesting access, building a role, launching a
   campaign) are wizards/multi-step flows with validation, not blank forms.
5. **Bulk is a first-class citizen.** Reviewers and approvers act on many items; every task inbox
   supports select-all, filtered bulk actions, and clear per-item outcomes.
6. **Consistency over cleverness.** The same concept looks and behaves the same everywhere: one
   status chip, one risk badge, one owner display, one table pattern.
7. **Provenance is visible.** For access, always answer *why* ("direct", "via role X", "via group
   Y") — governance is about explainability.
8. **Permission- and state-aware by default.** Show only actions the persona can take in the
   object's current state; disable-with-reason over silent absence when the user might expect it.
9. **Fast feedback, honest failures.** Every action gives immediate feedback; simulated
   operations (provisioning, sync) show realistic progress and surface failures with a next step.
10. **Calm density.** Enterprise users scan a lot of data — favor scannable tables, clear
    hierarchy, and restraint over decoration.

> These principles are testable review criteria. A screen that hides risk at decision time, or
> lacks bulk actions in an inbox, violates the product's UX contract regardless of how it looks.
