---
"@akiga/design-system-app": patch
---

Fix the production build failing to prerender `/iga/certifications/new/custom`. The wizard reads
`useSearchParams()` for the `?id=` that continues an existing draft, and that hook has no value during
a static prerender — so Next refuses to prerender the route unless the component reading it sits under
a Suspense boundary. `next dev` never showed it, because dev renders every route on demand.

The component reading the param now sits under `React.Suspense`, with the same "Loading…" the wizard
already showed while reading its store as the fallback, so the prerendered HTML matches the first
thing the client would paint anyway. The route goes back to being prerendered as static rather than
being pushed to on-demand rendering, which is what `dynamic = 'force-dynamic'` would have cost.

Note for anyone adding one of these: the other `useSearchParams()` caller,
`/iga/reviewer/sod-resolution-v3/[id]`, is a dynamic route and is never prerendered, which is the only
reason it does not fail the same way. Giving it `generateStaticParams` would need the same boundary.
