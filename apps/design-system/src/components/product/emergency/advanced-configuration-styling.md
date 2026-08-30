# Advanced Configuration — styling

Visual spec for the Emergency Access **Advanced Configuration** tab. Source of
truth is [`AdvancedConfigurationTab.tsx`](./AdvancedConfigurationTab.tsx); this
file resolves token classes to values so a screenshot can be rebuilt without
reading the theme.

The selected page node is the detail tab pane in
[`EmergencyAccessDetail.tsx`](./EmergencyAccessDetail.tsx)
(`min-h-0 min-w-0 flex-1 px-8 py-5`). The tab strip sits **above** that pane
and is not part of the form.

Font face throughout: **DM Sans**.

---

## Tab pane

| Property | Class / token | Resolved |
| --- | --- | --- |
| Padding | `px-8 py-5` | **32px** sides, **20px** top/bottom |
| Layout | `min-h-0 min-w-0 flex-1` | fills the column under the tabs; can shrink |
| Background | inherits `bg-canvas` | `#FFFFFF` |

Tab content scrolls independently: `ds-scroll h-full overflow-y-auto pr-0.5`
(token scrollbar, **2px** gutter so the bar does not sit on the cards).

### Tab strip (chrome above the pane)

| Property | Token | Resolved |
| --- | --- | --- |
| Rule | `border-b border-border px-8` | `1px solid #E1E4E8`, **32px** sides |
| Selected label | `--ds-color-brand-primary` | `#EB5424` |
| Indicator | `1px` brand | `#EB5424` |

Idle tab labels stay body colour; selection is colour + the 1px rule, never a
weight change.

---

## Page header

| Property | Class / token | Resolved |
| --- | --- | --- |
| Stack | `mb-5 flex items-center justify-between gap-4` | **20px** below, **16px** between title and Save |
| Title | `text-h5 text-text-primary` | **16px / 24px**, weight **600**, `#172B4D` (`ink.800`) |
| Save | `Button` default `primary` / `sm` | **36px** tall, radius **8px** (`radius.md`) |

Save is disabled until a field is dirty (`disabled={!dirty}`).

| Save state | Token | Resolved |
| --- | --- | --- |
| Idle | `surface-disabled` + `text-tertiary` | `#F8F8FA` fill, `#54637B` label |
| Dirty | brand fill + `onPrimary` | `#EB5424` / `#FFFFFF` |

---

## Section headings

Two sections: **General** then **Time**.

| Property | Class / token | Resolved |
| --- | --- | --- |
| Type | `text-body-strong text-text-primary` | **14px / 20px**, weight **600**, `#172B4D` |
| Space below | `mb-3` | **12px** |
| Space after General | `section.mb-8` | **32px** |

---

## General — field cards (`ConfigRow`)

Two-column grid from the `md` breakpoint: `grid gap-3 md:grid-cols-2`
(**12px** gutters). The fifth card (Maximum Requests Per Day) occupies the
first column of the next row.

| Property | Class / token | Resolved |
| --- | --- | --- |
| Min height | `min-h-[52px]` | **52px** |
| Fill | `bg-subtle` | `#F9FAFB` (`neutral.50`) |
| Radius | `rounded-lg` | **12px** |
| Padding | `px-4 py-3` | **16px** / **12px** |
| Layout | `flex items-center justify-between gap-4` | label left, control right, **16px** |
| Label | `text-body-medium text-text-primary` | **14px / 20px**, weight **500**, tracking **0.01em**, `#172B4D` |
| Required `*` | `text-danger` | `#C53030` (`red.600`), flush to the label (no space) |
| Info icon | MUI `InfoOutlined` 16px, `text-icon` | `#44546F` (`ink.500`) |
| Control cluster | `gap-2` | **8px** |

Required rows: **Risk Score**, **Maximum Duration Hours**. The others are
optional.

---

## Controls on the cards

Every numeric and time field is `Input` **`xs`** so the column reads as values,
not a stack of boxes. Same height as `Select` `xs` on this tab.

| Property | Token | Resolved |
| --- | --- | --- |
| Height | `controlHeight.xs` | **32px** |
| Radius | `--ds-radius-md` | **8px** |
| Fill | `--ds-color-surface-default` | `#FFFFFF` |
| Type | `typography.body` | **14px / 20px** |
| Vertical pad | `PAD_Y.xs` | **6px** |
| Border | `--ds-color-border-default` | `#E1E4E8` |

| Control | Width | Extras |
| --- | --- | --- |
| Risk score | `w-[72px]` | `StatusChip` (no dot) then the number |
| Duration hours | `w-[64px]` | `hrs` caption + 18px `AccessTime` |
| Cooldown | two `w-[64px]` | `hrs` · `:` · `mins` · clock |
| Concurrent / requests | `w-[72px]` | number only |
| Unit labels | `text-caption text-text-secondary` | **12px / 16px**, `#44546F` |
| Colon | `text-caption text-text-tertiary` | `#54637B` |
| Clock | `AccessTime` 18px, `--ds-color-icon-default` | `#44546F` |

Duration cluster: `flex items-center gap-1.5` (**6px**, Tailwind default).

---

## Risk chip

Score **84** maps to **High** (`caution`). `StatusChip` with `dot={false}`.

| Property | Token | Resolved |
| --- | --- | --- |
| Fill | `status.caution.subtle` | `#FFF4EE` (`orange.50`) |
| Text | `status.caution.fg` | `#9E3416` (`orange.900`) |
| Border | `status.caution.border` | `1px solid #FFB38F` (`orange.300`) |
| Shape | `rounded-pill px-2 py-0.5` | pill, **8px** / **2px** |
| Type | `text-caption-medium` | **12px / 16px**, weight **500** |

Ramp (`riskLevelFromScore`):

| Score | Level | Intent |
| --- | --- | --- |
| 0–39 | Low | `info` |
| 40–69 | Medium | `warning` |
| 70–89 | High | `caution` |
| 90–100 | Critical | `danger` |

---

## Time — Access schedule well

One grey well, not a grid of cards. Timezone, days, and the daily window share
it so they read as one schedule.

| Property | Class / token | Resolved |
| --- | --- | --- |
| Shell | `rounded-lg bg-subtle p-4` | **12px** radius, `#F9FAFB`, **16px** pad |
| Title | `text-body-sm-strong text-text-primary` | **13px / 18px**, weight **600**, `#172B4D` |
| Info icon | same as ConfigRow | 16px, `#44546F` |
| Hint | `text-caption text-text-secondary` + `mt-0.5` | **12px / 16px**, `#44546F`, **2px** below title |
| Header row | `mb-4 flex justify-between gap-3` | **16px** below, **12px** between title and chip |

Copy: `The displayed duration updates automatically from the start and end times.`

### Duration chip

`StatusChip` `intent="info"`, `dot={false}`. Label is derived:
`{dailyWindowDuration(start, end)} daily` — e.g. **24 hrs daily** when start
equals end (full day).

| Property | Token | Resolved |
| --- | --- | --- |
| Fill | `status.info.subtle` | `#F5FAFE` (`blue.50`) |
| Text | `status.info.fg` | `#0D47A1` (`blue.900`) |
| Border | `status.info.border` | `1px solid #90CAF9` (`blue.500`) |

### Field grid

`grid gap-4 lg:grid-cols-[220px_200px_minmax(280px,1fr)]` — **16px** gutters.
Below `lg` the three fields stack.

| Field | Control | Label |
| --- | --- | --- |
| Timezone | `Select` `xs` full width, **220px** column | `text-body-sm-strong`, **6px** above (`mb-1.5`) |
| Allowed days | same, **200px** column | same |
| Daily access window | two `Input type="time"` `xs` with `to` between | same label; `to` is `text-caption text-text-secondary` |

Native time inputs paint their own clock. The General duration rows use MUI
`AccessTime` instead, so a unit suffix and a clock do not compete.

Window pair: `flex items-center gap-2` (**8px**). Each field is
`min-w-0 flex-1`.

---

## Token map

| Class / role | CSS variable | Hex |
| --- | --- | --- |
| `bg-canvas` | `--ds-color-background-canvas` | `#FFFFFF` |
| `bg-subtle` | `--ds-color-background-subtle` | `#F9FAFB` |
| `bg-surface` (inputs) | `--ds-color-surface-default` | `#FFFFFF` |
| Save idle fill | `--ds-color-surface-disabled` | `#F8F8FA` |
| `border-border` | `--ds-color-border-default` | `#E1E4E8` |
| `text-text-primary` | `--ds-color-text-primary` | `#172B4D` |
| `text-text-secondary` | `--ds-color-text-secondary` | `#44546F` |
| `text-text-tertiary` | `--ds-color-text-tertiary` | `#54637B` |
| `text-icon` / clock | `--ds-color-icon-default` | `#44546F` |
| `text-danger` | `--ds-color-status-danger-fg` | `#C53030` |
| Save / tab selected | `--ds-color-brand-primary` | `#EB5424` |

Radius: `md` = **8px** (inputs, Save), `lg` = **12px** (cards, schedule well),
`pill` = **9999px** (chips).

Spacing scale is 4px (`0.5` = 2px, `1` = 4px, `2` = 8px, `3` = 12px, `4` =
16px, `5` = 20px, `8` = 32px).

Values not on the design-system spacing scale: `min-h-[52px]`, `w-[72px]`,
`w-[64px]`, `gap-1.5` (6px), and the `lg` column tracks `220px` / `200px` /
`minmax(280px, 1fr)`.
