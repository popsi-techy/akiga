'use client';

import * as React from 'react';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import { Drawer } from '../Drawer/Drawer';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { NavList } from '../NavList/NavList';
import { DataTable, type Column } from '../DataTable/DataTable';

/**
 * FilterDrawer — the product's one filtering surface.
 *
 * Two panes: the categories you can filter by on the left, the options for the
 * selected category on the right. A drawer rather than a modal, matching every
 * other "pick from a catalog" surface in the product (Add Owners, Add Technical
 * Roles, Assign Reviewer) — filtering is browsing a list to make a selection,
 * which is the drawer's job, not the modal's.
 *
 * **Staged, not live.** Ticking a box changes nothing until Apply. A list that
 * re-queried on every tick would reorder itself under the cursor mid-decision,
 * and Cancel would have nothing to undo. The footer count is the only live
 * feedback.
 *
 * Only one option kind today — a searchable, paginated checkbox list. Ranges and
 * date pickers are the obvious next kinds; `FilterGroup` is shaped so they can be
 * added as a discriminated union without moving the ones that already work.
 */

export interface FilterOption {
  id: string;
  label: string;
  /** Optional leading visual — an app logo, an avatar, a status dot. */
  icon?: React.ReactNode;
}

export interface FilterGroup {
  id: string;
  /** Rail label, and the heading above its options. */
  label: string;
  options: FilterOption[];
  /** Column header over the option list. @default the group label */
  optionHeader?: string;
  /** Placeholder for this group's search. @default `Search` */
  searchPlaceholder?: string;
}

/** Selected option ids, keyed by group id. Absent key = nothing selected. */
export type FilterSelection = Record<string, string[]>;

export interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  groups: FilterGroup[];
  /** Applied selection. The drawer stages its own copy until Apply. */
  value: FilterSelection;
  onApply: (next: FilterSelection) => void;
  title?: string;
  subtitle?: string;
  /**
   * Footer-left status, e.g. `12 available`. Receives the staged selection so it
   * can report what the filter would leave.
   */
  renderStatus?: (staged: FilterSelection) => React.ReactNode;
  width?: number;
}

const countAll = (s: FilterSelection) => Object.values(s).reduce((n, ids) => n + ids.length, 0);

export function FilterDrawer({
  open,
  onClose,
  groups,
  value,
  onApply,
  title = 'Filter',
  subtitle = 'Narrow the list to what you need.',
  renderStatus,
  width = 820,
}: FilterDrawerProps) {
  const [staged, setStaged] = React.useState<FilterSelection>(value);
  const [activeId, setActiveId] = React.useState(groups[0]?.id ?? '');
  const [query, setQuery] = React.useState('');

  // Re-stage from the applied value each time it opens: a cancelled edit must
  // not survive into the next open.
  React.useEffect(() => {
    if (open) {
      setStaged(value);
      setActiveId(groups[0]?.id ?? '');
      setQuery('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const active = groups.find((g) => g.id === activeId) ?? groups[0];
  const selected = staged[active?.id ?? ''] ?? [];

  const q = query.trim().toLowerCase();
  const rows = (active?.options ?? []).filter((o) => o.label.toLowerCase().includes(q));

  const columns: Column<FilterOption>[] = [
    {
      id: 'label',
      header: active?.optionHeader ?? active?.label ?? '',
      sortable: true,
      value: (o) => o.label,
      render: (o) => (
        <span className="flex min-w-0 items-center gap-2.5">
          {o.icon && <span className="grid h-5 w-5 shrink-0 place-items-center">{o.icon}</span>}
          <span className="truncate text-body-sm text-text-primary">{o.label}</span>
        </span>
      ),
    },
  ];

  const total = countAll(staged);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={<TuneOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
      width={width}
      disablePadding
      footer={
        <>
          {/* mr-auto pins the status to the left of a footer that is otherwise
              right-aligned, without the Drawer needing a second slot. */}
          <span className="mr-auto text-body-sm text-text-secondary">
            {renderStatus ? renderStatus(staged) : `${total} filter${total === 1 ? '' : 's'} selected`}
          </span>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onApply(staged);
              onClose();
            }}
          >
            Apply Filter
          </Button>
        </>
      }
    >
      <div className="grid h-full grid-cols-[220px_minmax(0,1fr)]">
        {/* Left: the categories. A count rides on each so you can see where your
            filters are without opening every one. */}
        <div className="flex min-h-0 flex-col border-r border-border py-5 pl-6 pr-4">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <span className="text-caption-strong uppercase tracking-wide text-text-tertiary">Filter by</span>
            <button
              type="button"
              onClick={() => setStaged({})}
              disabled={total === 0}
              className="text-caption-strong text-text-link transition-colors hover:underline disabled:cursor-not-allowed disabled:text-text-disabled disabled:no-underline"
            >
              Reset all
            </button>
          </div>
          <div className="ds-scroll min-h-0 flex-1 overflow-y-auto">
            <NavList
              ariaLabel="Filter by"
              value={active?.id ?? ''}
              onChange={setActiveId}
              items={groups.map((g) => ({
                id: g.id,
                label: g.label,
                count: (staged[g.id] ?? []).length || undefined,
              }))}
            />
          </div>
        </div>

        {/* Right: the selected category's options. */}
        <div className="flex min-h-0 flex-col py-5 pl-4 pr-6">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <span className="text-body-sm-strong text-text-primary">{active?.label}</span>
            <button
              type="button"
              onClick={() => setStaged((s) => ({ ...s, [active.id]: [] }))}
              disabled={selected.length === 0}
              className="text-caption-strong text-text-link transition-colors hover:underline disabled:cursor-not-allowed disabled:text-text-disabled disabled:no-underline"
            >
              Reset
            </button>
          </div>

          <div className="mb-3 shrink-0">
            <Input
              placeholder={active?.searchPlaceholder ?? 'Search'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
            />
          </div>

          <div className="min-h-0 flex-1">
            <DataTable<FilterOption>
              columns={columns}
              rows={rows}
              selectable
              selectedIds={selected}
              onSelectionChange={(ids) => setStaged((s) => ({ ...s, [active.id]: ids }))}
              fillHeight
              defaultRowsPerPage={10}
              emptyTitle="No options"
              emptyMessage="Nothing matches that search."
            />
          </div>
        </div>
      </div>
    </Drawer>
  );
}

export default FilterDrawer;
