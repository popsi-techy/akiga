---
"@akiga/design-system-app": patch
---

A draft's first tab reads **Setup** instead of Overview — in Emergency Access V1 only, for now.

"Setup" is what the tab actually holds while the profile is a draft: a checklist of what is still missing
and the control that switches it on. "Overview" names a summary of something that already exists, which is
what the tab becomes once the profile is live and starts reporting sessions.

The tab's `value` stays `overview`. It is what `onGoToTab` and every checklist row route to, so changing
it would mean renaming the destination in order to change a word on a label.

**Scoped to V1 deliberately.** Both modules render `EmergencyAccessDetail`, so the rename would otherwise
land in both at once; `basePath` is already how the component knows which version opened it, so the scope
costs nothing to express and the comparison can be made side by side. When it is settled the condition
reduces to `ea.isDraft` and the module check comes out — noted in the code so it does not calcify into a
permanent difference between two modules that are meant to converge.

Verified across all four combinations: V1 draft reads `Setup`; V1 live, V2 draft and V2 live all still read
`Overview`.
