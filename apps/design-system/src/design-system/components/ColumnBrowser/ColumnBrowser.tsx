'use client';

import * as React from 'react';
import ChevronRight from '@mui/icons-material/ChevronRight';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { Input } from '../Input/Input';
import { Select } from '../Select/Select';

/**
 * ColumnBrowser — a Miller-columns (cascading list) browser for drilling down a
 * fixed hierarchy: pick a row in one column and the next column reveals its
 * children.
 *
 * Why columns rather than a tree: every level is a different *kind* of thing, each
 * level can hold thousands of rows, and the reader needs the whole path visible at
 * once. A tree hides siblings behind expansion state and gives no room for the
 * per-level search and paging that large levels require.
 *
 * Built as a **canvas surface**, not a card: it fills the height its parent gives it
 * (so the parent must be a bounded flex/grid child), columns are divided by
 * hairlines instead of being boxed, and rows run full-bleed to the column edges.
 * Only the row lists scroll — each column's header, search, and pager stay put, so
 * the reader never loses the controls while hunting through 1,000 rows.
 *
 * The component owns each column's search text and paging, and resets both when an
 * upstream selection changes (the contents below are a different set then, so the
 * old page number and query would be meaningless). Callers own only the selections.
 */
export interface ColumnBrowserItem {
  id: string;
  label: string;
  /** Secondary line under the label. */
  sublabel?: string;
  /**
   * Extra text the column's search should match but the row does not display —
   * e.g. a person's department. Without it, search is limited to what happens to
   * fit in the row, which is narrower than what people type.
   */
  keywords?: string;
  /** Leading visual — an avatar or icon tile. */
  leading?: React.ReactNode;
  /** Trailing content, e.g. a risk chip. Kept out of the click target's way. */
  trailing?: React.ReactNode;
}

export interface ColumnBrowserColumn {
  id: string;
  title: string;
  /** Level icon, shown at the head of the column in the default icon colour. */
  icon?: React.ReactNode;
  items: ColumnBrowserItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  searchPlaceholder?: string;
  /**
   * Show the trailing chevron on rows. Set false on the last level: there is
   * nothing further to open, so a disclosure arrow there promises a drill-down
   * that does not exist — and it costs width the name needs. @default true
   */
  disclose?: boolean;
  /** Shown when this column has items but the search excludes them all. */
  emptyMessage?: string;
  /**
   * Shown instead of the rows when the column is not reachable yet — i.e. nothing
   * upstream is selected. Search and paging are hidden in that state.
   */
  awaitingMessage?: string;
}

export interface ColumnBrowserProps {
  columns: ColumnBrowserColumn[];
  /** @default [10, 25, 50] */
  pageSizeOptions?: number[];
  /**
   * Floor for a column's width in px. Below the total the columns scroll
   * sideways instead of compressing — a 160px column truncates every name it
   * holds, which defeats the point of showing the level at all. @default 230
   */
  minColumnWidth?: number;
}

/** Fixed locale so server and client render the same string. */
const fmt = (n: number) => n.toLocaleString('en-US');

export function ColumnBrowser({ columns, pageSizeOptions = [10, 25, 50], minColumnWidth = 230 }: ColumnBrowserProps) {
  return (
    <div className="ds-scroll flex h-full min-h-0 overflow-x-auto bg-surface">
      {columns.map((col, i) => (
        <ColumnPane
          // Remount when anything upstream changes, which clears this column's
          // search and page in one move — see the note on the component.
          key={`${col.id}:${columns.slice(0, i).map((c) => c.selectedId ?? '').join('|')}`}
          column={col}
          pageSizeOptions={pageSizeOptions}
          minWidth={minColumnWidth}
        />
      ))}
    </div>
  );
}

function ColumnPane({
  column,
  pageSizeOptions,
  minWidth,
}: {
  column: ColumnBrowserColumn;
  pageSizeOptions: number[];
  minWidth: number;
}) {
  const [query, setQuery] = React.useState('');
  const [pageSize, setPageSize] = React.useState(pageSizeOptions[0] ?? 10);
  const [page, setPage] = React.useState(0);

  const awaiting = column.awaitingMessage != null && column.items.length === 0;

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return column.items;
    return column.items.filter((it) =>
      `${it.label} ${it.sublabel ?? ''} ${it.keywords ?? ''}`.toLowerCase().includes(q),
    );
  }, [column.items, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  // Clamp rather than store — a shrinking result set (a longer query, a smaller
  // page size) can leave `page` past the end between renders.
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  return (
    <section
      className="flex min-w-0 flex-1 flex-col border-r border-border last:border-r-0"
      style={{ minWidth }}
      aria-label={column.title}
    >
      {/* Header + search: fixed. The level's name and the way to narrow it must stay
          reachable while the rows below scroll. */}
      <div className="shrink-0 space-y-3 border-b border-border p-3">
        <div className="flex items-center gap-2.5">
          {column.icon && (
            <span aria-hidden className="shrink-0 text-icon">
              {column.icon}
            </span>
          )}
          <h3 className="min-w-0 truncate text-h5 font-medium text-text-primary">{column.title}</h3>
          {!awaiting && (
            <span className="shrink-0 rounded border border-border px-2 py-0.5 text-body-sm tabular-nums text-text-secondary">
              {fmt(column.items.length)}
            </span>
          )}
        </div>
        {!awaiting && (
          <Input
            size="sm"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder={column.searchPlaceholder ?? 'Search'}
            startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
            inputProps={{ 'aria-label': `Search ${column.title}` }}
          />
        )}
      </div>

      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto py-1">
        {awaiting ? (
          <p className="flex h-full items-center justify-center px-6 text-center text-body-sm text-text-tertiary">
            {column.awaitingMessage}
          </p>
        ) : rows.length === 0 ? (
          <p className="flex h-full items-center justify-center px-6 text-center text-body-sm text-text-secondary">
            {column.emptyMessage ?? 'No matches'}
          </p>
        ) : (
          <div role="listbox" aria-label={column.title} className="space-y-1">
            {rows.map((it) => {
              const on = column.selectedId === it.id;
              return (
                <button
                  key={it.id}
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => column.onSelect(it.id)}
                  className={[
                    // The left accent bar is always present, transparent when
                    // unselected, so selecting a row never nudges its content.
                    'flex w-full min-w-0 items-center gap-2.5 border-l-2 px-4 py-2.5 text-left transition-colors',
                    on
                      ? 'border-brand bg-surface-selected'
                      : 'border-transparent hover:bg-surface-hover',
                  ].join(' ')}
                >
                  {it.leading}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body font-medium text-text-primary">{it.label}</span>
                    {it.sublabel && (
                      <span className="block truncate text-body-sm text-text-secondary">{it.sublabel}</span>
                    )}
                  </span>
                  {it.trailing}
                  {column.disclose !== false && (
                    <ChevronRight
                      aria-hidden
                      sx={{ fontSize: 20 }}
                      className={on ? 'shrink-0 text-icon-brand' : 'shrink-0 text-icon'}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!awaiting && (
        <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-border p-3">
          <div className="w-[68px] shrink-0">
            <Select
              size="sm"
              value={String(pageSize)}
              onChange={(v) => {
                setPageSize(Number(v));
                setPage(0);
              }}
              options={pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }))}
              ariaLabel={`Rows per page, ${column.title}`}
            />
          </div>
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="min-w-0 truncate text-body-sm tabular-nums text-text-secondary">
              {filtered.length === 0 ? '0' : `${fmt(start + 1)}–${fmt(Math.min(start + pageSize, filtered.length))}`} of{' '}
              {fmt(filtered.length)}
            </p>
            <PagerButton
              label={`Previous page, ${column.title}`}
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
            >
              <ChevronLeft sx={{ fontSize: 20 }} />
            </PagerButton>
            <PagerButton
              label={`Next page, ${column.title}`}
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage(safePage + 1)}
            >
              <ChevronRight sx={{ fontSize: 20 }} />
            </PagerButton>
          </div>
        </footer>
      )}
    </section>
  );
}

function PagerButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-icon transition-colors hover:bg-surface-hover hover:text-text-primary disabled:pointer-events-none disabled:text-text-disabled"
    >
      {children}
    </button>
  );
}

export default ColumnBrowser;
