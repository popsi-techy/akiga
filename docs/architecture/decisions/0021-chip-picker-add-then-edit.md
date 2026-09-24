# ADR-0021: ChipPicker for add-then-edit chosen sets

- **Status:** Accepted
- **Date:** 2026-09-24
- **Deciders:** Product / Design System
- **Tags:** design-system, settings, selection

## Context

A SettingsRow that picks a set (an approval policy, additional identity types,
allowed MFA methods) had grown two answers: `OverflowChips tone="onSubtle"`
naming what was chosen, and a bare pencil beside it. ADR-0012 recorded that
pairing.

Identity classification already used a better one: **Add** while nothing is
chosen, then **one capsule** — first name, `+n`, pencil — that is the edit
control. Approval Policy copied the older pairing, so the same job looked
different on two tabs of the same application.

OverflowChips is still the right display for a table cell or an InfoRow, where
the set is named and not edited. PickerSlot is still the right full row on a
wizard step. Neither is the compact control on the right of a grey well.

## Decision

We will own **ChipPicker** in the Design System.

1. Empty is a secondary Add button that names what will appear.
2. Filled is one clickable capsule. The chip and the pencil are not two
   controls.
3. Both states are the same width as the Select beside them (`w-48`).
4. `onClick` opens a Drawer (or the existing editor). ChipPicker does not
   edit in place.
5. New add-then-edit settings rows MUST use ChipPicker. Product code MUST NOT
   sit OverflowChips next to a bare pencil on a SettingsRow.

ADR-0012’s “OverflowChips then a bare pencil if it is editable” rule is
superseded for editable sets. Read-only naming on a grey well may still use
`OverflowChips tone="onSubtle"`.

## Consequences

- Approval Policy, Access Request approval policy, MFA methods, and identity
  classification additional types all render through ChipPicker.
- OverflowChips stays display-only. PickerSlot stays the wizard-row form of
  the same job.

## Alternatives considered

- **Keep OverflowChips + pencil.** Rejected; two controls for one job, and
  identity classification had already moved on.
- **Extend OverflowChips with `onEdit`.** Rejected; OverflowChips is a
  display for rows that must not change height. Mixing in Add/Edit would
  pull table cells into a settings interaction.
- **Reuse PickerSlot on the settings row.** Rejected; a 40px icon tile and
  two lines of copy are a wizard row, not a 36px field beside a Select.
