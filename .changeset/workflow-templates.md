---
"@akiga/design-system-app": minor
---

Workflow templates — eleven lifecycle processes you can preview before you commit to one, plus the
empty canvas.

**Selection is the preview.** Eleven templates is exactly the number where a card grid stops working:
you cannot choose without looking inside, and looking inside costs a navigation each time. So the list
and the preview sit side by side and selecting a template previews it. There is no Preview button —
previewing is not a separate act, so the affordance disappears and browsing costs an arrow key (↑/↓
walk the list, scratch included).

**The preview is the real renderer.** A template *is* a node tree, so the gallery hands it to
`WorkflowFlowPreview` — the same component the workflow detail page uses. What you saw and what the
builder opens cannot diverge. A drawn illustration of each flow would have looked better for a week and
been wrong from the first template edit.

**What the template can't know is stated before you commit, not after.** Every template declares what
an administrator must still confirm — connections, naming standards, licence SKUs, retention windows —
and the preview shows that list beside the Use button, with a readiness count ("7 steps · 7 ready", or
"6 steps · 4 ready · 2 waiting on details only you can fill in"). That count exists because the flow
honestly shows some steps reading "Not configured", which without it looks like a broken template
rather than a deliberate blank.

Create Workflow now opens the gallery instead of a name-and-description dialog. Naming a thing before
deciding what it does is the wrong order, and the dialog's only possible outcome was an empty builder.

**Seven new block types**, because the templates could not be expressed honestly without them:
`provisionAccount`, `setAttributes`, `manageLicense`, `revokeAccess`, `accountAction`,
`delegateAccess`, `triggerReview`. Each is a verb an IGA connector actually performs, so each is its own
type rather than a mode of one generic "Action" block — the canvas has to say what a step does at a
glance, and "Action" says nothing. They live in a new **Lifecycle** palette section with its own hue:
on a leaver canvas the difference between "notify the manager" and "delete the account" should not be a
matter of reading the label. Each has a config panel, a canvas summary that names the systems and the
operation, and a completeness rule.

**Palettes are now scoped by event.** A joiner never revokes access; a leaver never provisions an
account. Shaping the palette this way is the cheapest correctness control in the builder — an operation
that cannot appear cannot be mis-assembled. This also fixes the old scoping, which offered a leaver
nothing but Notification and a mover nothing but User Filter and Assign Entities.

`createWorkflow` accepts a starting tree and re-mints every node and branch id on the way in — a
template is read from module scope and shared by every preview, so storing its ids would make two
workflows created from one template share node identity, and editing either would corrupt the other.
