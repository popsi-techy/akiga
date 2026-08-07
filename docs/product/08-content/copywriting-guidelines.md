# Copywriting Guidelines

How the product speaks. Concise, so it can be applied while generating any screen.

## Voice & tone
- **Clear, calm, professional.** Enterprise software for people doing serious work. No hype, no
  jokes, no exclamation marks.
- **Direct and active.** "Approve this request", not "This request can be approved by you."
- **Respect the user's time.** Lead with the point. Cut filler ("please note that", "in order
  to").
- **Reassuring under risk.** Governance involves consequential actions; copy should make the
  stakes and the outcome obvious without alarming.

## Buttons & actions
- Verb-first, Title Case, ≤ 3 words: **Approve**, **Submit Request**, **Add to Cart**,
  **Certify Access**.
- The primary button states the specific action, never "OK" or "Submit" alone when a better verb
  exists.
- Destructive actions name the object: **Revoke Access**, **Delete Policy** (not just "Delete").

## Dialogs (confirmations)
- Title = the question or action: *"Revoke 3 entitlements?"*
- Body = the consequence, specific and honest: *"These users will lose access immediately. This
  is logged and cannot be undone from here."*
- Buttons = the verb, not "Yes/No": **[ Revoke Access ]  [ Cancel ]**.

## Empty states
- Say what belongs here + the one action to fill it.
- *"No pending approvals. New requests assigned to you will appear here."*
- Offer the primary action when the user can act: *"Create your first policy"*.

## Loading
- Prefer skeletons over spinners for content areas. If text is needed, keep it plain: "Loading
  requests…". Never "Please wait".

## Notifications / toasts
- State the result, past tense, specific: *"Request submitted"*, *"3 items certified"*,
  *"Approval failed — reviewer unavailable"*.
- Success = brief. Error = what happened + what to do next.

## Errors (inline & system)
- **What happened, why, and the fix** — in that order, in plain language.
- Field errors are specific: *"Justification is required (min 10 characters)"*, not "Invalid
  input".
- Never blame the user; never expose stack traces or codes as the primary message.

## Numbers, dates, status
- Dates: relative for recency ("2 hours ago"), absolute for records ("19 Jul 2026").
- Always show counts on bulk actions: "Approve (3)".
- Status uses the canonical lifecycle labels (see `04-domain/lifecycle-state-machines.md`), never
  ad-hoc words.

> These rules are product-level. The Design System implements the components; the copy patterns
> here define what goes *in* them.
