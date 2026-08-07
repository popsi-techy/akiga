# Registries — the machine-readable source of truth

These JSON files are **normative**. They are the first place any AI assistant looks to answer
*"does this already exist?"* Prose docs explain and teach; **registries enumerate**. If a
registry and a prose doc disagree, the registry (and the code it points to) is correct.

> **Not created yet — by design.** This foundation step defines the *contract* for the
> registries. The entries are populated later, as real components/patterns/templates/tokens are
> built via the §7 workflow in `AI_CONSTITUTION.md`.

## Files

| File | Answers the question | Populated when |
|---|---|---|
| `components.json` | Which UI components exist, their variants/states, and where they live? | a component is created (§8) |
| `patterns.json`   | Which reusable UX patterns exist and what they compose? | a pattern is created (§9) |
| `templates.json`  | Which page/layout templates exist? | a template is created |
| `tokens.json`     | The DTCG design tokens (single source for themes/Tailwind/MUI). | the token pipeline step (ADR-0003) |

## Why a registry instead of "search the markdown"

Different AI models search unstructured prose inconsistently and miss existing solutions,
producing duplicates — the exact failure this repository exists to prevent. A small, structured
manifest gives every assistant, present and future, a reliable, queryable answer. It is cheap to
read, cheap to diff in review, and cheap to keep honest with a CI check that fails when a
registry entry points at code that no longer exists (or vice-versa).

## Proposed entry shapes (illustrative — finalized when first populated)

`components.json` (array of entries):

```jsonc
{
  "name": "DataTable",
  "status": "stable",              // draft | stable | deprecated
  "source": "packages/design-system/components/data-table",
  "extends": "@mui/material/Table", // or null for custom (state why in docs)
  "variants": ["default", "compact"],
  "states": ["loading", "empty", "error", "populated", "selectable"],
  "patterns": ["bulk-actions", "pagination"],  // patterns that use it
  "docs": "docs/design-system/components/data-table.md",
  "story": "packages/design-system/components/data-table/DataTable.stories.tsx"
}
```

`patterns.json`:

```jsonc
{
  "name": "approval-flow",
  "status": "stable",
  "problem": "Route a request through reviewers with clear state transitions.",
  "useWhen": "...",
  "avoidWhen": "...",
  "components": ["Stepper", "DataTable", "ConfirmDialog", "Toast"],
  "templates": ["detail-with-activity"],
  "docs": "docs/design-system/patterns/approval-flow.md",
  "adr": "docs/architecture/decisions/00XX-approval-flow.md"
}
```

The exact schema is fixed (and, ideally, given a JSON Schema for CI validation) at the moment
the first entries are added.
