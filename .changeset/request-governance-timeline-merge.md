---
"@akiga/design-system-app": minor
---

Request Governance detail has one **Timeline** tab instead of Lifecycle and Audit Trail, following the
SoD violation's review timeline.

Lifecycle and Audit Trail were the same question at two grains — what has happened to this request —
and splitting them hid the only thing they were jointly for. "Was the approver nudged before or after
the SLA breached" meant holding a timestamp in your head and switching tabs. Now the four stages are
the spine and every intervention sits inside the stage it happened in, so RG-2408 reads: approval
opens, SLA breaches two days later, an admin nudges Priya — in that order, in one column.

**The merge is curated, not concatenated.** The audit log restated every stage transition that the
stage cards already carried, in less detail: "Stage approved · Manager stage approved" against an
approval hop that names the approver, their title, the decision and the note they left. Concatenated,
each stage was immediately echoed by a line repeating it. `buildRequestTimeline` drops those
restatements and keeps everything additive — nudges, reassignments, overrides, retries, ticket
hand-offs, SLA breaches, and findings like `SoD conflict`, whose detail names the specific clashing
access that the stage note does not. It is a blocklist rather than an allowlist because stage
transitions are a closed set and interventions are an open one, so a new action shows by default and
only a proven duplicate hides.

**Events are not cards.** Stages are the structure of a request and stay filled cards; an event is
something that happened during one, so it is a plain row. The rail keeps a single node diameter — two
sizes on one vertical line reads as a misalignment, not a hierarchy — and both levels share one text
spine, so the column is tidy and the weight difference is carried by the fill alone.

Ties in the ordering resolve to the event, because a stage's `startedAt` opens a phase while
everything else closes one: stage boundaries share a timestamp, and a finding stamped at the instant
policy handed off to approval is the work of the stage that just closed.

`LifecycleTrail.tsx` becomes `RequestTimeline.tsx`, exporting `RequestTimeline`; `AuditTrail` is gone.
The request drawer, which stacked both trails, now stacks the summary and the one timeline under a
`Timeline` heading — headed there because there is no tab to name it.

Verified across five requests: a stage-only run (RG-2404, RG-2402), a mid-stage finding (RG-2403), an
SLA breach inside approval (RG-2408), and a live nudge landing at the right position.
