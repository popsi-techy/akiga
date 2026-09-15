---
"@akiga/design-system-app": patch
---

The mapping table's application column is called "App attribute".

It was `${applicationName} field`, so the header was as long as the application is named:
"Google Workspace field" wrapped to two lines in a 144px column, and "Microsoft Entra ID
field" would take three — a header row whose height depended on which application you opened.
It was also telling the reader something they already knew, since the whole drawer belongs to
one application.

Dropping the name puts the column in the same shape as the one beside it — app attribute on
the left, IGA attribute on the right, which is exactly the mapping each row makes. Okta uses
the same word for the app side of a profile mapping.

The full name stays on the field's accessible name ("Google Workspace attribute"), where
length costs nothing.

All four headers are now one line: 16px tall, against the 32px this one was forcing.
