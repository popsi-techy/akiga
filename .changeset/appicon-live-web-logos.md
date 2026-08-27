---
"@akiga/design-system-app": patch
---

AppIcon loads the vendor’s current logo from the web instead of a bundled Simple Icons snapshot.

Onboarding tiles (and every other AppIcon) now show the live site icon for catalogued brands — Google Workspace, Entra, Active Directory, ServiceNow, CyberArk, and the rest of the seed apps. Custom and SCIM stay identification marks. A failed fetch falls back to the letter tile.
