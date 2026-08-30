# SetupChecklistDock — styling

Visual spec for the right-hand setup checklist. Source of truth is
[`SetupChecklistDock.tsx`](./SetupChecklistDock.tsx); this file resolves the
token classes to values so a screenshot can be rebuilt without reading the
theme.

Living docs: `/components/setup-checklist-dock`. Pattern: `object-detail-setup`
(ADR-0015).

Font face throughout: **DM Sans**.

---

## Panel (`aside`)

Grey frame. White step cards sit on it. The page header stays visible; this
column starts under the app top bar and runs to the bottom of the viewport.

| Property | Class / token | Resolved |
| --- | --- | --- |
| Width | `w-72` | **288px** (`18rem`) |
| Layout | `flex flex-col shrink-0` | full height of the detail column |
| Background | `bg-subtle` → `--ds-color-background-subtle` | `#F9FAFB` (`neutral.50`) |
| Left edge | `border-l border-border` → `--ds-color-border-default` | `1px solid #E1E4E8` (`neutral.500`) |
| Shadow | none | — |
| Accessible name | `aria-label="Setup checklist"` | — |

---

## Header

| Property | Class / token | Resolved |
| --- | --- | --- |
| Layout | `flex items-start justify-between` | title left, close right |
| Padding | `px-4 py-4` | **16px** all sides |
| Gap | `gap-3` | **12px** |
| Title | `text-h5 text-text-primary` | **16px / 24px**, weight **600**, `#172B4D` (`ink.800`) |
| Status line | `text-caption text-text-secondary` + `mt-0.5` | **12px / 16px**, weight **400**, `#44546F` (`ink.500`), **2px** below title |

Status copy:

- All required steps done → `Required steps are complete.`
- Otherwise → `Finish the required steps, then {activate\|connect}.`

### Close control

| Property | Class / token | Resolved |
| --- | --- | --- |
| Hit target | `h-8 w-8` | **32×32px** |
| Radius | `rounded-md` | **8px** |
| Icon | MUI `CloseOutlined`, `fontSize: 18`, `text-icon` | `#44546F` (`ink.500`) |
| Hover | `hover:bg-surface-hover` | `#F9FAFB` (`neutral.50`) |
| Focus | `ring-2 ring-brand-subtle` | `#FFF4EE` (`orange.50`) |
| Label | `aria-label="Hide setup checklist"` | — |

---

## Body

| Property | Class / token | Resolved |
| --- | --- | --- |
| Padding | `px-3 pb-4` | **12px** sides, **16px** bottom |
| Card stack | `space-y-3` | **12px** between the two cards |
| Scroll | `ds-scroll overflow-y-auto min-h-0 flex-1` | token scrollbar; body scrolls, header stays |

---

## Section card (`StepGroup`)

Two white cards. Headings are visual; the hint is `sr-only`.

| Property | Class / token | Resolved |
| --- | --- | --- |
| Background | `bg-surface` | `#FFFFFF` |
| Radius | `rounded-xl` | **16px** |
| Padding | `p-3` | **12px** |
| Eyebrow | `text-overline uppercase text-text-tertiary` | **12px / 16px**, weight **600**, tracking **0.06em**, `#54637B` (`ink.300`) |
| Eyebrow inset | `px-1` | **4px** |
| List offset | `mt-1.5 space-y-0.5` | **6px** below eyebrow, **2px** between rows |

Copy (`gateVerb="activate"`, the Emergency Access default):

| Card | Eyebrow | Screen-reader hint |
| --- | --- | --- |
| Required | `Required to activate` | these steps gate activation |
| Additional | `Additional` | optional, and does not block activation |

`gateVerb="connect"` swaps “activate” / “activation” for “connect” / “connection”.

---

## Step row

Each row is a full-width `<button>`. It is not a second navigator — clicking
opens the existing tab (or a drawer). The tab strip remains the navigator.

| Property | Class / token | Resolved |
| --- | --- | --- |
| Layout | `flex items-start gap-2.5` | icon then label, **10px** gap |
| Padding | `px-2 py-2` | **8px** |
| Radius | `rounded-md` | **8px** |
| Motion | `transition-colors` | token duration via Tailwind default |

### States

| State | Classes | Resolved |
| --- | --- | --- |
| Idle | `border border-transparent` | 1px transparent (keeps layout when current paints a border) |
| Hover | `hover:bg-subtle` | `#F9FAFB` |
| Current (`aria-current="step"`) | `border border-brand bg-surface` | `1px solid #FFCCB5` (`orange.200`), white fill |
| Focus | `ring-2 ring-inset ring-brand-subtle` | `#FFF4EE` (`orange.50`) |

Current and hover never combine a grey fill with the brand border: current
keeps `bg-surface`.

### Check icon

| Property | Class / token | Resolved |
| --- | --- | --- |
| Well | `h-4 w-4` + `mt-px` | **16×16px**, 1px optical nudge |
| Glyph | MUI `CheckCircle`, `fontSize: 16` | inherits colour |
| Done | `text-success` | `#00695C` (`green.600`) |
| Not done | `text-border-strong` | `#C4C9D2` (`neutral.1000`) |

### Label

| Condition | Class / token | Resolved |
| --- | --- | --- |
| Idle / done | `text-body-sm text-text-primary` | **13px / 18px**, weight **400**, `#172B4D` |
| Current or next-prompt | `text-body-sm-medium text-text-primary` | same size, weight **500** |
| Overflow | `truncate` | single line, ellipsis |

---

## Next prompt

Shown only when **all** of these are true:

1. Someone has actually finished a listed step (`seedDone` and `passiveDone` do
   not count; a **Modified** chip does).
2. This row is the first unfinished step after that.
3. This row is **not** the current tab.

| Element | Class / token | Resolved |
| --- | --- | --- |
| Hint | `text-caption text-text-secondary` + `mt-1` | **12px / 16px**, `#44546F`, **4px** below the label |
| CTA | `Button` `size="xs"` + `mt-2` | **8px** below the hint |
| CTA variant | `primary` while any required step is open; `secondary` once required work is done | so Activate/Connect in the page header stays the one primary |

The button is `component="span"` with `tabIndex={-1}` — the whole row is the
target; the CTA is a visual prompt, not a nested control.

---

## Done qualifier chip

Renders under a done step that passes `doneLabel`. **4px** below the label
(`mt-1`). Uses `StatusChip` with `dot={false}`.

| Property | Token | Resolved |
| --- | --- | --- |
| Shape | `rounded-pill px-2 py-0.5` | pill, **8px** / **2px** padding |
| Type | `text-caption-medium` | **12px / 16px**, weight **500** |

Factory defaults (`doneLabelIntent="info"`, the default):

| Property | Token | Resolved |
| --- | --- | --- |
| Fill | `status.info.subtle` | `#F5FAFE` (`blue.50`) |
| Text | `status.info.fg` | `#0D47A1` (`blue.900`) |
| Border | `status.info.border` | `1px solid #90CAF9` (`blue.500`) |
| Label | — | `Default applied` |

A human change on that step swaps to `intent="neutral"` and the label
**Modified**.

---

## Token map

Quick lookup from class → CSS variable → hex.

| Class | CSS variable | Hex |
| --- | --- | --- |
| `bg-subtle` | `--ds-color-background-subtle` | `#F9FAFB` |
| `bg-surface` | `--ds-color-surface-default` | `#FFFFFF` |
| `bg-surface-hover` | `--ds-color-surface-hover` | `#F9FAFB` |
| `border-border` | `--ds-color-border-default` | `#E1E4E8` |
| `border-brand` | `--ds-color-brand-border` | `#FFCCB5` |
| `border-strong` (icon idle) | `--ds-color-border-strong` | `#C4C9D2` |
| `text-text-primary` | `--ds-color-text-primary` | `#172B4D` |
| `text-text-secondary` | `--ds-color-text-secondary` | `#44546F` |
| `text-text-tertiary` | `--ds-color-text-tertiary` | `#54637B` |
| `text-icon` | `--ds-color-icon-default` | `#44546F` |
| `text-success` | `--ds-color-status-success-fg` | `#00695C` |
| `ring-brand-subtle` | `--ds-color-brand-subtle` | `#FFF4EE` |

Radius: `md` = **8px**, `xl` = **16px**, `pill` = **9999px**.
Spacing scale is 4px (`0.5` = 2px, `1` = 4px, `2` = 8px, `3` = 12px, `4` = 16px).

Values not on the design-system spacing scale (Tailwind defaults): `w-72`
(288px), `gap-2.5` (10px), `mt-1.5` (6px).
