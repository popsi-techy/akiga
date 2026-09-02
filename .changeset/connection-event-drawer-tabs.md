---
"@akiga/design-system-app": patch
---

Split the connection event drawer into four tabs — Details (name, authorization), API call (method and endpoint, headers, body, and a simulated Test event), Response (status code, success and error keys, external identifier, records key), and Advanced (priority, full records, pagination). The tabs move into the Drawer's pinned toolbar slot and carry the checklist tick, so a required field on an unopened tab is visible before Save; Save jumps to the first tab with a gap rather than failing silently.
