---
"@akiga/design-system-app": patch
---

`Input` forwards `aria-label` to the field instead of losing it on the wrapper.

`InputProps` extends MUI's `TextFieldProps`, so everything unrecognised spread onto
`TextField` — which hands unknown props to the root `FormControl`. `aria-label` landed on a
wrapping `<div>`, where it names nothing, and the `<input>` itself had no accessible name at
all. Measured on the live page before the fix: `input.getAttribute('aria-label')` → `null`.

Eight call sites were passing one and none of them had it: ReportsListView, ReportTable,
WorkflowTemplateGallery, EmailTemplatesWorkspace, EmailTypeTemplateGallery,
SystemSettingsView, RequestFlowBoard and ConnectionEventDrawer — every unlabelled search
field in the product. A screen reader announced each of them as an edit field with only a
placeholder to go on, and a placeholder is not a label: it disappears the moment there is a
value in the box.

The label is now pulled out of the rest-spread and written into `inputProps` (lowercase),
the only route to the native input. It applies only where there is no visible `label` — a
field that already has one is named by it, and a second, different name read over the top of
it is worse than none.
