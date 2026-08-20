---
"@akiga/design-system-app": minor
---

The application profile navigates in a docked rail, like Emergency Access V1.

`DetailShell` gains an optional `rail`, which replaces its tab strip when passed. Opt-in per page
rather than a shell-wide switch: a page earns a rail when its sections outgrow a strip, or when it has
per-section setup state a strip has no room for. Applications has both — eight sections, four of which
are setup steps. Every other directory detail page passes nothing and keeps its tabs untouched.

`tabs` stays required alongside a rail, because it remains the definition of which sections exist. The
rail is derived from it, not kept beside it, so it cannot offer a section the page lacks or miss one it
has. A connected application shows the same grouped, ticked list one in setup does — it just leads
with the sections that are not steps — so connecting does not restyle the navigation, it drops two
group headings.

The Connect button loses its progress ring and its "N required steps" label, for the reason the
Activate button did: the rail reports progress step by step now, so the ring said the same thing twice
and crowded out the button's one action. `ApplicationSetupCard` is deleted with it — nothing could
reach it once the checklist moved into the rail. Overview keeps its own name in both states, since it
no longer holds setup: during setup it is what the application *is*, and once connected what it holds.

`EmergencySetupRail` becomes **`DetailRail`** under `components/product/`, since two modules now share
it, and gains an optional `currentId`.

## Two bugs fixed on the way through

**A hydration error on every onboarded application.** The page read the `localStorage`-backed
onboarding store while rendering, so the server saw no onboarded app and the client saw one — React
threw, and the profile of an application you had just onboarded loaded with an error overlay. It now
reads after mount, like every other session-memory store here. This was not caused by the rail; it was
reachable the whole time and simply needed an onboarded application to show up.

**Two rail rows claiming to be current.** Authorization and Connection events are both configured on
Provisioning Setup, so matching the current row by section alone lit both. `DetailRail.currentId`
narrows it to the row that was pressed, and the page clears the override whenever the section changes
by another route — `connect()` returns to Overview, where a stale Provisioning override would be a
claim about a different section.

The four `InfoRow` calls on this page that were missing their required `icon` are fixed as part of the
Application type card, from the shared `infoIcon` vocabulary. **`tsc` is now clean across the app**,
where it had been failing on those four.
