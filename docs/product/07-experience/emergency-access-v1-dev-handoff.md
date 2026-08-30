# Emergency Access — developer handoff (V1)

Live product is **V1** at `/iga/emergency`. V2 and V3 permanently redirect here. Do not implement against those routes.

| | |
|---|---|
| List | `/iga/emergency` |
| Detail | `/iga/emergency/[id]` |
| Nav | Administration → Emergency Access (`VpnKeyOutlined`, registry icon `key`) |
| Source | `apps/design-system/src/components/product/emergency/` |
| Data | `apps/design-system/src/data/emergency-access.ts` |
| Tokens | `apps/design-system/src/design-system/tokens/tokens.ts` + `palette.ts` (light) |
| Dock width | 288px (`w-72`) |
| Activate gate | **3 of 5** setup steps |

---

## 1. Happy path

Administration → Emergency Access → **Create** → draft detail with the checklist **dock open** on Assignments → add assignments and eligibility → **Activate** → Overview.

| Step | Screen | What happens |
|---|---|---|
| 1 | List / empty | **Create Emergency Access**, or **View guide** (modal) then Create. |
| 2 | Create drawer (480px) | Name required. Description optional. Upcoming setup preview is static. |
| 3 | Detail `?from=create` | Draft. Dock open. Tab = first unfinished guided tab (usually Assignments). No Overview tab. |
| 4 | Assignments + Eligibility | At least one assignment and one eligibility group. Setup toasts nudge the next required step. |
| 5 | Header **Activate** | Enabled when `eaBlockingSteps` is empty. Toast: *“{name} is active. It can now be requested.”* Tab jumps to Overview. |
| 6 | Optional | Owners and Advanced limits. Advanced chip: **Default applied** → **Modified** after Save. |

### Routes

| URL | Status | File |
|---|---|---|
| `/iga/emergency` | Live list | `apps/design-system/src/app/iga/emergency/page.tsx` |
| `/iga/emergency/[id]` | Live detail | `apps/design-system/src/app/iga/emergency/[id]/page.tsx` — `openSetup` when `?from=create` |
| `/iga/emergency-v2`, `/iga/emergency-v3` | 308 → V1 | `next.config.mjs` |

---

## 2. Setup steps (canonical order)

One list in `EA_SETUP_STEPS`. Required-ness comes **only** from `isRequiredSetupStep` (the Activate gate). Hints and CTAs live in `setupSteps.ts`.

| # | id | Label | Required | Done when |
|---|---|---|---|---|
| 1 | `basic` | Basic details | Yes | `name.trim()` and `description.trim()` both non-empty |
| 2 | `assignments` | Assignments | Yes | entitlements + technical roles length > 0 |
| 3 | `eligibility` | Eligibility criteria | Yes | `eligibilityGroups.length > 0` |
| 4 | `owners` | Owners | No | individual `ownersCount > 0` (governance teams do **not** tick this step) |
| 5 | `advanced` | Advanced configuration | No | Always true — factory defaults count as done |

Guided tabs (`EA_GUIDED_STEPS`, no basic): Assignments → Eligibility → Owners → Limits (`advanced`).

`firstUnfinishedGuidedTab` returns the first unfinished of those, or Advanced if all are done.

> **Create can leave Basic undone.** The create drawer only requires Name. Description is optional there, but Activate and click-to-edit on the detail both require a description. A draft created without one still shows Basic details in the dock as unfinished.

---

## 3. List

`EmergencyAccessListView` with `basePath="/iga/emergency"`. Create is owned by the page (drawer). Row click → `/iga/emergency/{id}`.

### First-run empty

When `getEmergencyAccessList().length === 0`: no H1, no table. Centered empty state.

- Icon: `VpnKeyOutlined` in a 56×56 `bg-brand-subtle` (#FFF4EE) square, `rounded-xl` (16px), `text-icon-brand`
- Title: **Add emergency access** — `text-h5` / #172B4D / 16px 600
- Body: *Create a time-bound, break-glass profile so people can request critical access during an incident — and have it taken back when the session ends.* — `text-body-sm` / #44546F
- Secondary: **View guide** → `EmergencyAccessGuideModal` intro
- Primary: **Create emergency access**

### Populated

| Region | Spec |
|---|---|
| H1 | **Emergency Access** · `text-h2` (24/32 bold) `text-text-primary` #172B4D |
| Subtitle | *Track and manage time-bound, break-glass access to critical systems from one central table.* · `text-body` #44546F |
| Toolbar | Search (`max-w-sm`, placeholder **Search by application**) · Filter (toast: *Filters coming soon*) · **Create Emergency Access** (`ml-auto`) |

| Column | Width | Render |
|---|---|---|
| Emergency Access | flex | Avatar `sm` + `text-body-sm-strong` name |
| Status | flex | Draft = `warning` StatusChip · Active = `success` |
| Risk Score | flex | StatusChip `dot={false}` on active · **N/A** `text-text-disabled` on draft |
| Modified | 196px | `LastModified` — clock 16px + `formatDateTime`; tooltip/aria *Last modified {datetime}* |
| Actions | 80px | Menu: View details · Delete (danger) |

Search empty: DataTable `emptyTitle` **No emergency access found**, message *Try a different search, or create emergency access…*

---

## 4. Create drawer

Default `Drawer` width **480px**. Icon `VpnKeyOutlined` 22px using `var(--ds-color-brand-primary)` (#EB5424). Footer: Cancel secondary · Continue primary (disabled while name is blank).

| Field | Required | Details |
|---|---|---|
| Name | Yes | Hint: *Shown wherever this access is requested or reviewed. Name it after the system it unlocks.* Placeholder: `e.g. Bitbucket production` |
| Description | No (drawer only) | multiline `minRows={3}`. Placeholder: *What this access is for, and when it should be used* |

### Upcoming setup well

Static, not clickable. Classes: `rounded-lg border border-border bg-subtle px-4 py-3.5` — radius 12px, border #E1E4E8, fill #F9FAFB, padding 16×14px. Lists `EA_SETUP_STEPS` excluding `basic`. Required rows get a red asterisk `text-danger` (#C53030).

**On Continue:** `createEmergencyAccess` → toast *“{name} created as a draft.”* → `/iga/emergency/{id}?from=create`. Never return to the list first.

---

## 5. Detail shell

Full-bleed inner: `-mx-8 -mt-6 -mb-6` against AppFrame padding. Left column is the object; right column is the dock when open.

### Layout

| Region | Classes | Resolved |
|---|---|---|
| Header | `bg-canvas px-8 pt-3` | white, 32px / 12px |
| Tabs | `border-b border-border px-8` | hairline #E1E4E8, 32px |
| Body | `px-8 py-5` | 32 / 20 |
| Dock | `w-72 border-l border-border bg-subtle` | 288px, #E1E4E8, #F9FAFB |

### Header cluster (left)

| Element | Spec |
|---|---|
| Avatar | size `md`, initials from name |
| Name | `ClickToEditText` as `h1` · `text-h4` (18/26 600) #172B4D · required · overlay edit, no reflow |
| Risk | Active only · StatusChip `dot={false}` · Low `info` / Medium `warning` / High `caution` / Critical `danger` |
| Status | Draft `warning` · Active `success` |
| Description | `ClickToEditText` as `p` · `text-body-sm` #44546F · required · placeholder **Add a description** |

Last modified does **not** sit in this header (removed on purpose). Provenance is the list **Modified** column and Overview Timeline.

### Header actions (right)

| Control | Draft | Active |
|---|---|---|
| Primary / secondary | **Activate** (primary). `aria-disabled` when `blocking.length > 0` — stays in tab order. Tooltip names missing steps. | **Deactivate** (secondary + `BlockOutlined`) → danger Dialog |
| Overflow Menu | Edit basic details (divider) · Delete | Same |
| Guide button | Tertiary icon. `SegmentedDonut` 32px, thickness 2.5, around the book. Progress = required done / 3 | Same button, **no donut** (`progress` undefined) |

### Tabs

| State | Tabs in order |
|---|---|
| Draft | Assignments · Eligibility Criteria · Owners · Advanced Configuration — **no Overview** |
| Active | **Overview** first, then the four above |

Initial tab: draft uses `firstUnfinishedGuidedTab` (skips basic — already collected in create). Active opens Overview.

Tab counts: assignments = entitlements + roles; eligibility = groups; owners = individuals + governance teams.

### Dock open vs closed

Initial `checklistOpen = openSetup || isDraft`. Create query forces open. Active profiles start closed. Close via dock × (**Hide setup checklist**) or the book button. Activation does **not** auto-close the dock.

---

## 6. Setup guide vs checklist dock

**The book is not a modal on the detail.** `EmergencyAccessGuideButton` toggles `SetupChecklistDock`. The modal (`EmergencyAccessGuideModal`) is only wired on the empty list — **View guide**. Variant `next-steps` exists in code but is **not** used in the live V1 flow.

| Surface | Where | Job |
|---|---|---|
| Guide modal · `intro` | Empty list | **How emergency access is set up.** 560px. Numbered `EA_SETUP_STEPS`. Footer Close + Create emergency access. |
| Guide button | Detail header | Toggles dock. Draft: donut of required steps. Tooltip: *“N of 3 required steps complete. Setup guide / Hide setup checklist”*. |
| `SetupChecklistDock` | Right of draft (and when opened on active) | Remaining work. **Not a second navigator** — tabs still are. |
| `SetupProgress` (full) | Not on EA detail | Only `SegmentedDonut` is used on the book. |

Donut segments: done `--ds-color-status-success-fill` #12855A · pending border default #E1E4E8.

### Dock anatomy

| Part | Classes | Resolved |
|---|---|---|
| Aside | `w-72 border-l border-border bg-subtle` | 288px · hairline #E1E4E8 · fill #F9FAFB |
| Header | `px-4 py-4` | 16px. Title `text-h5` #172B4D. Subtitle `text-caption` #44546F |
| Subtitle copy | — | *Finish the required steps, then activate.* **or** *Required steps are complete.* |
| Close | `h-8 w-8 rounded-md` | aria-label **Hide setup checklist** · icon 18px `text-icon` #44546F |
| Body | `ds-scroll px-3 pb-4 space-y-3` | 12px gutter. Hidden scrollbars. |
| Step group card | `rounded-xl bg-surface p-3` | 16px radius · white #FFFFFF on grey frame · 12px pad |
| Group heading | `text-overline uppercase text-text-tertiary` | 12px 600 · tracking 0.06em · #54637B |
| Row current | `border border-brand bg-surface` | `brand.border` orange[200] #FFCCB5 |
| Row idle | `border-transparent hover:bg-subtle` | hover #F9FAFB |
| Tick done / undone | `text-success` / `text-border-strong` | #00695C / #C4C9D2 · `CheckCircle` 16px |

### Groups

| Group | Heading | Steps |
|---|---|---|
| Required | **Required to activate** | Basic details · Assignments · Eligibility criteria. Basic is `seedDone` (object exists) so it never becomes the Next target, but it still renders. |
| Additional | **Additional** | Owners · Advanced configuration. SR: *optional, and does not block activation.* |

`gateVerb` defaults to `activate` (Applications onboarding uses `connect`).

### Per-step copy (`setupSteps.ts`)

| Step | Hint | CTA |
|---|---|---|
| basic | The name and description shown wherever this access is requested or reviewed. | Edit details |
| assignments | The entitlements and technical roles a session hands over, then takes back. | Add assignments |
| eligibility | Who can ask for it — anyone matching the rules in a group becomes eligible. | Add criteria |
| owners | Who answers for this access when it comes up for review. | Add owners |
| advanced | How long a session lasts, how many run at once, and when it can be requested. | Review limits |

### Next CTA — implement exactly

```
listed = required.filter(s => !s.seedDone) + additional
someoneFinished = listed.some(countsAsFinished)
nextId = someoneFinished ? listed.find(s => !s.done)?.id : undefined
showNext = (step.id === nextId) && !step.done && !current
```

`countsAsFinished(step)`:

| Condition | Result |
|---|---|
| not done | false |
| `passiveDone === true` (factory advanced) | false — does not unlock Next |
| `doneLabel` set and `passiveDone` undefined (legacy) | false |
| done, including **Modified** (`passiveDone: false`) | true |

- CTA label: `Next: {cta}` — Add assignments, Add criteria, Add owners, Review limits.
- Variant **primary** while any required step is undone; **secondary** once Activate is unblocked.
- The whole row is the hit target; the Button is a `span` with `tabIndex={-1}`.
- Current tab: `step.tab === currentTab` — orange border, **no Next** on that row (the page is the place to work).
- Basic row click opens the Basic details drawer, not a tab.

### Advanced chip

| State | Chip | Intent | `passiveDone` |
|---|---|---|---|
| Factory limits | **Default applied** | `info` · fg #0D47A1 · bg #F5FAFE · border #90CAF9 | `true` — does not count as a decision |
| After **Save** of a real change | **Modified** | `neutral` · fg #44546F · bg #F8F8FA · border #C4C9D2 | `false` — counts as `someoneFinished` |

Dirty but unsaved does **not** flip the chip. Reverting values to factory restores **Default applied**.

---

## 7. Tab screens

Rails are **240px** `NavList`. Pickers reuse DS drawers. Peek is `PeekSlot` default **320px**.

### Overview (active only)

Two cards: **Advanced Configuration Info** (read-only limits via `InfoRow`) and **Timeline** (Last Updated On / Created On with `formatDateTime`). Edit limits on the Advanced tab, not here.

### Assignments

| Piece | Spec |
|---|---|
| Rail | Entitlements · Technical Roles |
| Empty | Centered. e.g. **No entitlements granted.** CTA Add Entitlements / Add Technical Roles |
| Entitlements picker | `EntityCatalogDrawer` **860px** |
| Technical roles picker | `TableSelectDrawer` **820px** · title **Add Technical Roles** |
| Save | Immediate `setEAAssignments`. `toastEASetupStep` if the step just became done |

### Eligibility

| Piece | Spec |
|---|---|
| Empty | **No eligibility criteria yet** · Create Eligibility Criteria Group |
| Populated | Search · bulk delete · `EligibilityGroupCard` grid · Add Eligibility Group |
| Editor | `EligibilityCriteriaDrawer` **720px** · group name + AND conditions (attribute = value) |

### Owners

| Piece | Spec |
|---|---|
| Rail | Individual Owners · Governance Teams |
| Individuals | Custom Drawer **780px** · searchable multi-select DataTable + SelectionPanel |
| Teams | `TableSelectDrawer` **820px** · **Add Governance Teams** |
| Step done | `ownersCount` = individual owners only. Teams do not tick Owners in the dock. |

### Advanced Configuration

Explicit **Save** (disabled until dirty). Toast *Advanced configuration saved*. No setup-step toast — the step is always done. Sections: General (risk score + limits) and Time (timezone, allowed days, daily window).

### Basic details drawer

Opens from Actions → **Edit basic details**, or dock **Basic details**. Name and description **both required** on save (stricter than create). Toast: setup completion or *Basic details saved.*

---

## 8. Activate, deactivate, delete

| Action | Gate / copy | After |
|---|---|---|
| Activate | `eaBlockingSteps` empty: *basic details*, *assignments*, *eligibility criteria*. Tooltip while blocked: *Add X and Y before this can be activated.* | `activateEmergencyAccess` · toast *is active. It can now be requested.* · tab Overview · risk chip appears |
| Deactivate | Dialog tone danger. Title **Deactivate {name}?** Body: *Active users will lose emergency access immediately. This action is logged and the access can be re-activated later.* | Draft again. Toast *…deactivated. It is a draft again.* Overview tab hidden; falls back to first unfinished guided tab |
| Delete (draft) | *The profile and everything configured on it are removed. Nothing has been granted under it, so nobody loses access.* | `deleteEmergencyAccess` · list |
| Delete (active) | *Anyone holding access through this profile keeps it until their session ends, and nobody can request it again. Sessions already granted stay in the audit log.* | Same delete · list |

### Setup toasts (draft only)

`toastEASetupStep` fires when a step **becomes** done, not on later edits or removals.

| When | Title | Message | Duration |
|---|---|---|---|
| Required step done, more required remain | `{Step} complete` | *Next, {add assignments \| add eligibility criteria \| …}.* | 6000ms |
| Last required step done | **Required steps complete** | *Activate now, or add owners and limits.* | 8000ms |
| Optional step done | `{Step} complete` | Next optional action, or *Ready to activate.* | 6000ms |

Other toasts: create draft, activate, deactivate, delete, assignment/eligibility/owner removals, advanced config saved, filter stub.

---

## 9. Tokens this flow actually uses

Never hardcode these. Classes map through Tailwind → CSS variables → `color.*` in `tokens.ts`.

### Surfaces

| Class / token | Hex | Use |
|---|---|---|
| `bg-canvas` · `background.canvas` | #FFFFFF | Page, detail header |
| `bg-subtle` · `background.subtle` | #F9FAFB | Dock frame, create well, hover |
| `bg-surface` · `surface.default` | #FFFFFF | Step group cards, current row |
| `border-border` · `border.default` | #E1E4E8 | Tabs underline, dock edge |
| `border-brand` · `brand.border` | #FFCCB5 | Current dock row |
| `bg-brand-subtle` · `brand.subtle` | #FFF4EE | Empty-state icon tile |
| `brand.primary` | #EB5424 | Primary buttons, drawer icon, focus |
| `text.brand` (small text) | #C9441E | AA brand text — not fills |

### Text and type

| Class | Token | Use |
|---|---|---|
| `text-text-primary` | #172B4D `ink[800]` | Titles, names |
| `text-text-secondary` | #44546F `ink[500]` | Subtitles, hints |
| `text-text-tertiary` | #54637B `ink[300]` | Overlines, LastModified |
| `text-text-disabled` | #808B9E `ink[50]` | N/A risk |
| `text-h2` | 24/32 700 | List title |
| `text-h4` | 18/26 600 | Detail name |
| `text-h5` | 16/24 600 | Empty title, dock title |
| `text-body` | 14/20 400 | List subtitle |
| `text-body-sm` / `-strong` / `-medium` | 13/18 400/600/500 | Rows, dock labels |
| `text-caption` | 12/16 400 | Chips, dock subtitle, LastModified |
| `text-overline` | 12/16 600 uppercase 0.06em | Dock group headings |

### StatusChip intents (EA)

| Intent | fg | subtle | border | Where |
|---|---|---|---|---|
| `warning` | #856404 | #FFFBEC | #FFE794 | Draft |
| `success` | #00695C | #F0FFF4 | #BEDECE | Active · dock tick |
| `info` | #0D47A1 | #F5FAFE | #90CAF9 | Default applied · Low risk |
| `caution` | #9E3416 | #FFF4EE | #FFB38F | High risk |
| `danger` | #C53030 | #FEF5F5 | #FEB2B2 | Critical · delete |
| `neutral` | #44546F | #F8F8FA | #C4C9D2 | Modified |

Risk ramp: Low → `info` · Medium → `warning` · High → `caution` · Critical → `danger`.

### Spacing and radius

| Class | Token | px |
|---|---|---|
| `px-8` / `pt-3` / `py-5` | spacing 8 / 3 / 5 | 32 / 12 / 20 |
| `w-72` | 18rem | 288 dock |
| `w-[240px]` | literal | 240 tab rails |
| `rounded-md` / `lg` / `xl` / `pill` | radius md lg xl pill | 8 / 12 / 16 / 9999 |
| Avatar | `radius.avatar` | 6px |

### Chrome widths

| Surface | px |
|---|---|
| Create drawer (default Drawer) | 480 |
| Guide modal | 560 |
| EligibilityCriteriaDrawer | 720 |
| Owners individual Drawer | 780 |
| TableSelectDrawer (roles, teams) | 820 |
| EntityCatalogDrawer (entitlements) | 860 |
| PeekSlot | 320 |

---

## 10. Data layer

Session memory maps + seed from `apps/design-system/src/data/seed.ts`. All writes call `touchEmergencyAccess` (ISO `updatedOn`).

| Function | Purpose |
|---|---|
| `getEmergencyAccessList()` | List rows |
| `getEmergencyAccess(id)` | Detail view-model |
| `createEmergencyAccess({ name, description })` | New draft; empty assignments/owners |
| `updateEmergencyAccessBasics` | Name/description + touch |
| `deleteEmergencyAccess` | Tombstone + cascade |
| `activateEmergencyAccess` / `deactivateEmergencyAccess` | Status toggles |
| `getEAAssignments` / `setEAAssignments` | Entitlements + technical roles |
| `setEmergencyAccessEligibility` | Eligibility groups |
| `getEAOwners` / `setEAOwners` | Individual owners |
| `getEAGovernanceTeams` / `setEAGovernanceTeams` | Governance team ids |
| `getAdvancedConfig` / `setAdvancedConfig` | Limits, risk, schedule |
| `isAdvancedConfigDefault` | Factory vs modified |
| `isEASetupStepDone` / `isRequiredSetupStep` | Checklist |
| `eaBlockingSteps` | Activate blockers |
| `firstUnfinishedGuidedTab` | Initial/fallback tab |
| `eaSetupCompletionNotice` | Setup toast content |
| `riskChipFromScore` | List + advanced risk display |

---

## 11. Components — DS vs product

**Design System (`@ds/components`):** Tabs, Card, InfoRow, StatusChip, Avatar, Button, Menu, DataTable, Dialog, Drawer, Input, SelectionPanel, NavList, Tooltip, Modal, Select, Checkbox, SetupChecklistDock, ClickToEditText, PeekPanel / PeekSlot, TableSelectDrawer, SegmentedDonut / SetupProgress, useToast.

**Product EA only:** `EmergencyAccessListView`, `EmergencyAccessDetail` (shell + Overview + Owners), empty state, guide modal/button, assignments/eligibility/advanced tabs, `setupSteps.ts`, `ea-setup-toast.ts`. Product paths re-export dock and ClickToEdit from DS.

**Shared product (not EA-specific):** `LastModified`, `RowActions`, `EntityCatalogDrawer`, `IdentityDetailsBody`, `RiskScoreChip`.

---

## 12. Implementation rules

### Do

- Reuse SetupChecklistDock, ClickToEditText, TableSelectDrawer, EntityCatalogDrawer, StatusChip, DataTable.
- Keep setup order and required-ness in `emergency-access.ts` — presentation copy in `setupSteps.ts`.
- Stamp `updatedOn` on writes. List Modified column uses the same stamp.
- Disabled Activate uses `aria-disabled` so the reason is reachable from keyboard.
- Ship loading / empty / error / success on every surface.
- Consume tokens. Never hardcode colors, spacing, radii.

### Don't

- Do not put last-modified in ProductTopbar. Provenance belongs on the object list column or Overview Timeline — not console chrome. The detail-header stamp was removed on purpose.
- Do not open the guide modal from the detail book control.
- Do not treat **Default applied** as a user finishing a step (Next CTA).
- Do not drop the Advanced chip on save — switch it to **Modified**.
- Do not implement against `/iga/emergency-v2` or v3. Do not reintroduce `VersionsSlider`.
- Design System never imports the IGA product.

### Nav

`registries/product/navigation.json` — id `emergency`, label Emergency Access, route `/iga/emergency`, icon `key` → `VpnKeyOutlined`. Group **Administration**.
