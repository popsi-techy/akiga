# System Settings — frontend handoff

Share this with a frontend engineer implementing **System Settings**. It is a visual and layout spec: fonts, colors, spacing, and which component to use for each surface.

**Tokens are the source of truth.** Hex and px below are the current light-theme resolutions so you can match the UI if you are outside this repo. If you have the Design System, consume the token / class — do not paste hex into product code.

| Live reference | Path |
|---|---|
| Hub | `/iga/configurations` |
| Anatomy ADR | [`docs/architecture/decisions/0012-settings-page-anatomy.md`](./decisions/0012-settings-page-anatomy.md) |
| Visual language | [`docs/product/07-experience/visual-language.md`](../product/07-experience/visual-language.md) |
| Tokens | `apps/design-system/src/design-system/tokens/tokens.ts` |
| Settings primitives | `apps/design-system/src/design-system/components/Settings/Settings.tsx` |
| Hub catalog | `apps/design-system/src/data/system-settings-catalog.ts` |

---

## 1. Hard rules

1. **No visible page `h1`.** The breadcrumb is the page name. Pass `title` to `SettingsPage` (it renders `sr-only`) or use `hideTitle` on catalog lists.
2. **Do not wrap a grey well in a `Card`.** The well *is* the setting. A bordered white panel around it is two frames.
3. **Do not hardcode** colors, spacing, radii, or type. Use semantic tokens / DS classes.
4. **Do not rebuild** Settings chrome. Compose `SettingsPage` → `SettingsSection` → `SettingsStack` → `SettingsRow`.
5. **Chosen sets on a grey well** use `OverflowChips tone="onSubtle"` + a 32×32 pencil — not `StatusChip`.
6. **Nested fields** go in `SettingsNested` (white panel) *inside* the well — not a second well, not a Card.
7. **Catalogs of records** (one row per schema/rule) use the directory list + 480px Drawer. They do **not** use `SettingsPage`.
8. Settings catalog lists hide the Filter button (`hideFilter`). Search stays.
9. Do **not** add Email Templates or Notification Routing to the hub.

---

## 2. Tokens (use these values)

Font family: **DM Sans**. Product base size is **14px**.

### 2.1 Type used on settings

| Role | Token / class | Size / line | Weight | Color token | Hex |
|---|---|---|---|---|---|
| Hub / section heading | `h5` / `text-h5` | 16 / 24 | 600 | `text-primary` | `#172B4D` |
| Hub destination title | `cardTitle` / `text-card-title` | 15 / 20 | 400 | `text-primary` | `#172B4D` |
| Well title (grey well) | `bodyMedium` / `text-body-medium` | 14 / 20 | 500 (+0.01em) | `text-primary` | `#172B4D` |
| Nested-row title | `bodyMedium` | 14 / 20 | 500 | `text-primary` | `#172B4D` |
| Body / tab label | `body` / `text-body` | 14 / 20 | 400 | primary or secondary | `#172B4D` / `#44546F` |
| Search note, NavList label | `bodySm` / `text-body-sm` · `bodySmMedium` | 13 / 18 | 400 / 500 | secondary / primary | `#44546F` / `#172B4D` |
| Empty-state title | `bodySmStrong` | 13 / 18 | 600 | `text-primary` | `#172B4D` |
| Well / destination description | `caption` / `text-caption` | 12 / 16 | 400 | `text-secondary` | `#44546F` |
| Chip label, `+n` | `captionMedium` | 12 / 16 | 500 | primary / secondary | `#172B4D` / `#44546F` |
| Info banner copy | `caption` | 12 / 16 (leading 20) | 400 | `status.info.fg` | `#0D47A1` |
| Muted / empty / disabled | — | same size as neighbour | — | `text-tertiary` / `text-disabled` | `#54637B` / `#808B9E` |

Do **not** use page `h1`–`h4` on settings screens. `h5` is the largest visible type.

### 2.2 Color

| Role | Token | Hex | Where |
|---|---|---|---|
| Page / canvas | `background.canvas` | `#FFFFFF` | App main |
| Grey well / striped | `background.subtle` / `bg-subtle` | `#F9FAFB` | `SettingsRow surface="subtle"` |
| Card / nested panel | `surface.default` / `bg-surface` | `#FFFFFF` | Nested panel, rail Card |
| Row hover | `surface.hover` | `#F9FAFB` | Hub item, Reset/Edit, NavList |
| Selected / brand tint | `surface.selected` | `#FFF4EE` | Selected rows elsewhere |
| Default border | `border.default` | `#E1E4E8` | Dividers, chips, tabs baseline |
| Strong border | `border.strong` | `#C4C9D2` | Hub icon well outline |
| Brand / focus / tab underline | `brand.primary` | `#EB5424` | Save, tabs, NavList outline, focus |
| Brand hover | `brand.primaryHover` | `#C9441E` | Primary button hover |
| Brand text (small type) | `text.brand` | `#C9441E` | Small brand *text* (AA). Fills stay `#EB5424` |
| Link | `text.link` | `#1565C0` | Text-only secondary actions |
| Icon default | `icon.default` | `#44546F` | Reset, Edit, search chrome |
| Icon brand | `icon.brand` | `#EB5424` | Identity hub glyphs |
| Info (text / icon) | `status.info.fg` | `#0D47A1` | Access hub glyphs, info banner |
| Info well | `status.info.subtle` | `#F5FAFE` | Info banner fill |
| Info outline | `status.info.border` | `#90CAF9` | Info banner border |
| Success | `status.success.fg` | `#00695C` | Authentication hub glyphs |

Hub icon tones (one hue per group — the *glyph* is colored, the 36×36 well stays white):

| Group | Tone prop | Glyph color |
|---|---|---|
| General Settings | `info` | `#0D47A1` |
| Identity data and correlation | `brand` | `#EB5424` |
| Access lifecycle and fulfillment | `info` | `#0D47A1` |
| Authentication | `success` | `#00695C` |

### 2.3 Spacing (4px scale)

| Token | px | Common use |
|---|---|---|
| `0.5` | 2 | Title → description (`mt-0.5`) |
| `1` | 4 | Gap between stacked wells |
| `1.5` | 6 | Icon + note, chip gap |
| `2` | 8 | Reset + Save, icon + NavList label |
| `2.5` | 10 | NavList item padding-x, info banner py |
| `3` | 12 | Well padding-y, hub item gap, section header wrap gap, role-well grid |
| `4` | 16 | Well padding-x, section heading → content, nested row gap, toolbar gap |
| `5` | 20 | Access Request rail → content |
| `6` | 24 | Main `py`, hub toolbar `mb`, tab-to-tab `marginRight` |
| `8` | 32 | Main `px`, group-to-group, divided section `mt` / `pt` |

### 2.4 Radius

| Token | px | Use |
|---|---|---|
| `md` | 8 | Wells, buttons, icon wells, Reset/Edit, nested panel, info banner |
| `lg` | 12 | Cards (rail) |
| `pill` | 9999 | OverflowChips capsule and chips |

A `SettingsStack` **overrides** well radius: only the first well is `rounded-t-md`, only the last is `rounded-b-md`, middle wells are square.

### 2.5 Control heights

| Size | Height | Settings use |
|---|---|---|
| `xs` | 32px | Section **Save**, Reset, Edit pencil |
| `sm` | 36px | Hub search `Input`, default Button |
| `md` | 40px | Directory list search (default Input) |

Tabs are **32px** tall (same as `xs`).

---

## 3. App chrome (every settings route)

Product shell (`apps/design-system/src/app/iga/layout.tsx`):

- Sidebar 260px (collapsed 72px). Top bar 56px.
- Main: `px-8 py-6` → **32px** left/right, **24px** top/bottom. White canvas.
- Scroll the catalog / table, not the search toolbar (`ds-scroll` hides scrollbars).
- Breadcrumb names the screen. Do not repeat that name as a visible heading.

---

## 4. Three screen types — pick one

```
System Settings
├── Hub ………………………………………… DestinationList plain, 3 columns
├── Form settings …………………… SettingsPage 900px + grey wells
│     MFA · SSO · Micro Cert · Role Mining
│     Provisioning Task · Usage Location
│     Access Request (rail + tabs, then the same wells)
└── Catalog lists …………………… DirectoryListPage + 480px Drawer
      Custom Attributes · User Identity Correlation · Entitlement Types
```

---

## 5. Hub (`/iga/configurations`)

No visible title. Search stays pinned; only the catalog scrolls.

### Toolbar

| Part | Spec |
|---|---|
| Search | `Input size="sm"` (36px), `max-w-sm` (384px), full width of that column |
| Search icon | 18px, `icon.default` |
| Clear | 24×24, icon 16px, `rounded-md`, hover `surface.hover` |
| Note | Right side: 16px info icon + `text-body-sm` `text-secondary` — “Changes you apply here are system-wide.” |
| Toolbar gap | 16px wrap; `mb-6` (24px) under the toolbar |

### Groups

- Stack groups with **32px** (`gap-8`).
- Group `h2`: `text-h5` `text-primary`, `mb-3` (12px).
- Copy (in this order):

  1. **General Settings** — no visible heading; Usage Location is the first tile
  2. **Identity data and correlation**
  3. **Access lifecycle and fulfillment**
  4. **Authentication**

### Destination tile (`DestinationList appearance="plain" columns={3}`)

Grid: 1 col → 3 cols from `md`. `gap-x-8` (32) / `gap-y-4` (16).

Each item is one button:

| Part | Spec |
|---|---|
| Hit area | `gap-3` (12), `px-2 py-3` (8 / 12), `rounded-md` |
| Hover | `bg-surface-hover` (`#F9FAFB`) |
| Icon well | **36×36** (`h-9 w-9`), white, `rounded-md`, `border-strong` (`#C4C9D2`) |
| Glyph | **20×20**, tone color from the group (table above) |
| Title | `text-card-title` (15/20 regular), truncate |
| Description | `text-caption` (12/16), `mt-0.5`, **2 lines max** (`line-clamp-2`) |

Empty search: `text-body-sm-strong` title + `text-caption` hint. No Filter on this page.

---

## 6. Form settings (the grey-well recipe)

`SettingsPage`: `w-full min-w-0 max-w-[900px]`. **Left-aligned** — do not `mx-auto`.

### Section header (`SettingsSection`)

```
[ h2 16/24 semibold ]                    [ Reset 32×32 ] [ Save xs ]
```

| Part | Spec |
|---|---|
| Header row | `mb-4` (16), `justify-between`, wrap `gap-3` |
| Heading | `h2` `text-h5` `text-primary` |
| Reset | 32×32, `rounded-md`, Restart icon **18px**, `text-icon`; hover `surface.hover` |
| Save | `Button size="xs"` (32px), primary `#EB5424`, `rounded-md`, label medium |
| Both disabled | until the section is dirty |
| Next section | `divided`: `mt-8 pt-8` + 1px `border-default` |

Do **not** put one page-level Save. Each section saves itself.

### Grey well (`SettingsRow surface="subtle"`)

| Part | Spec |
|---|---|
| Fill | `bg-subtle` `#F9FAFB` |
| Padding | `px-4 py-3` (16 / 12) |
| Inner gap | 12px between title row and nested panel |
| Title row | `justify-between gap-4`; title left, control right |
| Title | `text-body-medium` (14/20 medium) |
| Description | `text-caption` `mt-0.5` |
| Hint | 16px info icon, `icon.subtle` |
| Control align | `center` for Switch / Select; `start` for tall fields |

### Stack (`SettingsStack`)

- Vertical `gap-1` (**4px**).
- Radius only on the first and last well (`8px` top / bottom).
- Middle wells are square so inserting a row later does not break the block.

### Nested panel (`SettingsNested`)

White (`bg-surface`), `rounded-md`, `px-4`, rows divided by `border-default`.

Each `SettingsNestedRow`: `py-3`, `gap-4`, title `body-medium` + caption, control on the right.

### Chosen set on a well (MFA methods, approval policy)

Right side of the well, in one row:

1. `OverflowChips tone="onSubtle"`
2. Pencil button — same 32×32 / 18px icon recipe as Reset

`onSubtle` chrome (must invert — default grey chips vanish on a grey well):

| Part | Spec |
|---|---|
| Outer capsule | White, `rounded-pill`, `border-default`, `py-1 pl-1 pr-2.5` |
| Named chip | Grey pill (`bg-subtle`), `px-2 py-0.5`, `text-caption-medium`, max-width 140px |
| `+n` | `text-caption-medium` `text-secondary`, not a chip |

Approval policy Edit navigates to `/iga/automation/approval-policies`.

### Info banner (`SettingsInfoBanner`)

`rounded-md`, `px-3 py-2.5`, fill `#F5FAFE`, border `#90CAF9`, 18px info icon + caption in `#0D47A1`. Sit it **below** the stack, not inside a well.

### Role wells (MFA)

Two columns from `md`: `grid gap-3 md:grid-cols-2`. Each cell is a standalone subtle well (not stacked).

### Controls in wells

| Control | Size |
|---|---|
| Switch | Design System Switch (do not restyle) |
| Select / Input in a well | `sm` (36px) unless it must match an `xs` neighbour |
| Icon-only Edit / Reset | always 32×32 |

---

## 7. Access Request (rail + tabs + same wells)

Route: `/iga/configurations/access-request`.

The page fills remaining height (`flex min-h-full flex-col`) so the rail is as tall as the content column.

```
┌──────── 240px ────────┬──── gap 20px ────┬──── max 900px ────┐
│ Card padding 4px      │                  │ Area heading h5     │
│ NavList               │                  │ Tabs (if entity)    │
│  General              │                  │ SettingsSection     │
│  Application          │                  │   Request / Approval│
│  Entitlement          │                  │   grey wells        │
│  Role                 │                  │                     │
│  Notification         │                  │                     │
└───────────────────────┴──────────────────┴─────────────────────┘
```

### Rail

| Part | Spec |
|---|---|
| Width | **240px** (`grid-cols-[240px_minmax(0,1fr)]`, `gap-5`) |
| Card | `padding="2xs"` → **4px**; `h-full min-h-0 w-[240px]`; radius 12px |
| NavList | `gap-1` (4) between items |
| Item | `px-2.5 py-2`, `rounded-md`, `text-body-sm-medium`, icon 18px `text-icon` |
| Active | `border-brand` (`#EB5424`) + white fill + primary text |
| Inactive | transparent border, hover `surface.hover` |

Do **not** nest a second NavList for Request vs Approval.

### Entity areas (Application / Entitlement / Role)

1. Area heading — `text-h5`, `mb-4` (e.g. “Application”).
2. `Tabs`: **Request Configuration** | **Approval Configuration**.
3. `SettingsSection` titled with the active tab, plus Reset / Save.

### Tabs

| Part | Spec |
|---|---|
| Height | **32px** |
| Label | 14 / 400 — **never** bold the selected tab (width must not shift) |
| Idle | `text-secondary` `#44546F` |
| Hover | `text-primary` |
| Selected | `brand.primary` `#EB5424` |
| Indicator | 1px `#EB5424` |
| Baseline | 1px `border-default` |
| Gap between tabs | 24px |

General and Notification skip the area heading + Tabs: one `SettingsSection` only.

---

## 8. Catalog lists (records, not a form)

Routes:

- `/iga/configurations/custom-attributes`
- `/iga/configurations/identity-correlation`
- `/iga/configurations/entitlement-types`

Use `DirectoryListPage` with **`hideTitle`** and **`hideFilter`**.

| Part | Spec |
|---|---|
| Visible title | none (breadcrumb only) |
| Search | default Input (40px), `max-w-sm` |
| Filter | **hidden** |
| Primary action | right-aligned in the toolbar (Create / Add) |
| Table | `DataTable` fill-height, row click opens editor |
| Row actions | **Edit + Delete** as `RowActions` — not a kebab |
| Editor | `Drawer` **480px** |

This is a directory of records. Do not restyle it as grey wells.

---

## 9. Catalog (ship these destinations)

| Title | Group | Route | Shape |
|---|---|---|---|
| General Settings | general | `/iga/configurations/locale-regional` | form wells (Usage Location first) |
| Custom Attributes | identities | `/iga/configurations/custom-attributes` | list + drawer |
| User Identity Correlation | identities | `/iga/configurations/identity-correlation` | list + drawer |
| Micro Certification | access | `/iga/configurations/micro-certification` | form wells |
| Access Request | access | `/iga/configurations/access-request` | rail + wells |
| Entitlement Types | access | `/iga/configurations/entitlement-types` | list + drawer |
| Provisioning Task | access | `/iga/configurations/provisioning-task` | form wells |
| Role Mining | access | `/iga/configurations/role-mining` | form wells |
| MFA | sign-in | `/iga/configurations/mfa` | form wells |
| SSO OAuth Login | sign-in | `/iga/configurations/sso-oauth` | form wells |

Hub descriptions are ~15 words. Groups are General Settings, Identity data and correlation, Access lifecycle and fulfillment, then Authentication.

---

## 10. Do / don’t

| Do | Don’t |
|---|---|
| Breadcrumb as the page name | Visible `h1` / page lead under the title |
| `SettingsStack` of grey wells | Card around a well, or a well around a Card |
| `SettingsNested` white panel | A second grey well for follow-up fields |
| `OverflowChips tone="onSubtle"` | StatusChip or default OverflowChips on `bg-subtle` |
| Section-level Reset + xs Save | One sticky footer Save for the whole page |
| Tabs for Request / Approval | A second NavList beside or under the rail |
| Directory list + 480 Drawer for catalogs | Settings wells for a table of records |
| Filter hidden on settings lists | Directory Filter chrome on these three lists |
| Left-aligned 900px column | Center the settings column |
| Token classes | Hex / `text-[15px]` / magic padding |

---

## 11. Accessibility (non-negotiable)

- WCAG 2.1 AA. Focus ring is brand (`#EB5424` / `border.focus`).
- Page name stays in an `sr-only` `h1` for the document outline.
- Reset / Edit are buttons with `aria-label`, wrapped in Tooltip.
- `Button disabled` is exposed as `aria-disabled` (stays focusable) — use the DS Button.
- Tabs: selection is color **and** the underline; `aria-selected` is required. Selected tab orange on white is a recorded contrast waiver — do not “fix” it with bold or `text.brand`.
- Loading / empty / error / success on every screen. Loading copy: “Loading settings…” (`text-body-sm` `text-secondary`).
- Permission-aware: tenant admin only (`SettingsDenied` if not allowed).

---

## 12. Implementation map (this repo)

| Piece | File |
|---|---|
| Hub | `apps/design-system/src/components/product/settings/SystemSettingsView.tsx` |
| Access Request | `…/AccessRequestSettingsPage.tsx` |
| MFA (canonical form) | `…/MfaSettingsPage.tsx` |
| Catalog lists | `…/CustomAttributesListPage.tsx`, `IdentityCorrelationListPage.tsx`, `EntitlementTypesListPage.tsx` |
| Primitives | `@ds/components` → `SettingsPage`, `SettingsSection`, `SettingsStack`, `SettingsRow`, `SettingsNested`, `SettingsNestedRow`, `SettingsInfoBanner` |
| Pattern docs | `/patterns/settings-page` in the Design System app |

If a new setting is **one tenant configuration**, copy MFA. If it is **many records**, copy Custom Attributes. If it has **areas**, copy Access Request — rail first, then the same wells.
