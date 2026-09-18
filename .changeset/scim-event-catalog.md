---
"@akiga/design-system-app": patch
---

SCIM and Adobe connection events are User import, Group Import, and Group membership — a flat list, not the REST inbound/outbound catalog. Those types do not make HTTP calls, so direction was a REST leftover.
