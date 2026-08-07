# ADR-0009: Profile avatar shape and Card content gutter

- **Status:** Accepted
- **Date:** 2026-08-03
- **Deciders:** Product / Design System
- **Tags:** design-system, components, avatar, card

## Context

Profile cards (e.g. SoD “Violated by”, Profile Overview) need a circular identity mark with a
soft brand ring — distinct from the rounded-square avatar used in dense lists and tables.
Flush list rows inside framed Cards also drew full-width dividers that visually merged into the
inner panel border.

## Decision

We will:

1. Extend `Avatar` with `shape: 'soft' | 'circle'`. `soft` (default) keeps the existing
   rounded-square. `circle` is fully round with a grey `ring-border` outline and a 2px
   `ring-offset-surface` gap for profile cards.
2. Keep a horizontal content gutter on Card bodies even when `padding="none"` (`px-4` framed /
   `px-5` flat) so row dividers stay inset from the panel edge. Flush-list rows omit their own
   horizontal padding and rely on the Card gutter.
3. Use Design System `InfoRow` + `InfoRowGroup` for label/value rows. Layout is
   table-like: the label column sizes to the widest label, and every value is
   **left-aligned on the same column edge** (not right-aligned, not hugging the label).

## Consequences

- Profile / identity cards MUST use `Avatar` with `shape="circle"`.
- Flush lists inside `padding="none"` Cards MUST NOT add row-level horizontal padding (that
  would double the gutter).
- Information / profile attribute rows MUST use `InfoRow` (left-aligned values).
- Existing soft avatars and padded Card bodies are unchanged in visual intent.

## Alternatives considered

- **Separate `ProfileAvatar` component** — rejected; shape is a natural Avatar variant and
  keeps one initials/image implementation.
- **Inset only via row `mx-*` utilities** — rejected; easy to forget and inconsistent across
  product screens. Card owning the gutter is the single convention.
