---
"@akiga/design-system-app": patch
---

Access Certification V3 (`/iga/reviewer/access-certification-v3`) — a third bulk surface for the same campaign, alongside V1's draggable header pill and V2's bottom dock. `AccessCertificationReview` takes `bulkSurface="toolbar"`: a Bulk action menu sits beside Filter and stays there, disabled until the table has a selection, with Select all N / Clear all appearing beside it at the moment it wakes up.

Nothing floats over the rows and nothing arrives mid-task, so the toolbar cannot reflow under the pointer and the actions never cover what they apply to. The table's own header checkbox still takes only the page it is on, which is what Select all N is for — it reaches every row the current filter matches, not just the visible twelve. Destructive choices (Does not belong to me, Revoke) route through the same confirm dialog as the other two surfaces.
