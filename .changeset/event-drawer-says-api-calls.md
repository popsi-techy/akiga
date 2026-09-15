---
"@akiga/design-system-app": patch
---

The connection-event drawer calls its items API calls.

"Calls" was ours, not the industry's. SailPoint's Web Services connector names the level
*above* this one an **operation** — "Accounts Fetch" is the operation — and the HTTP
requests inside it **endpoints**; Saviynt's REST connector keys them `call1`, `call2`; Okta
speaks of SCIM **operations** and, for custom integrations, **API endpoints**.

Three of those four words are unusable here, each for a concrete reason rather than taste:

- **Endpoint** is already a field on every one of these items — the method and URL. A
  container cannot be named after one of its own fields.
- **Operation** belongs to the event kind, one level up. Borrowing it for the items inverts
  the meaning it has in the connector everyone is coming from.
- **Request** means an access request in this product, which has a whole Request Governance
  module.

**API call** is the industry's term and the only one that stays unambiguous here. It is
applied to every place the item is named: the drawer title ("Account Delete API calls"), the
rail heading, the search field and its label, the empty state and its button, the "API call
name" and "API call priority" fields, the remove dialog, the save toasts, the name an
unnamed row falls back to, and the accessible names on the tablist and the tab strip.

The count beside the rail heading is the number on its own: the heading an inch to its left
already supplies the noun.

The *kind* is still an Event, and stays one: the Configure tab's Events section, the
"No connection events are configured" gap on the overview, and the fallback label when a
kind cannot be resolved. Event is the level above — "Accounts Fetch" is an event, and the
API calls are what it makes.
