'use client';

import * as React from 'react';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import FilterListOutlined from '@mui/icons-material/FilterListOutlined';
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import CircularProgress from '@mui/material/CircularProgress';
import { DataTable, type Column } from '../DataTable/DataTable';
import { FilterDrawer, type FilterGroup, type FilterSelection } from '../FilterDrawer/FilterDrawer';
import { Input } from '../Input/Input';
import { Button } from '../Button/Button';
import { useToast } from '../Toast/ToastProvider';

export interface DirectoryListPageProps<Row extends { id: string }> {
  title: string;
  description: string;
  /** Hide the page h1 — System Settings already names the screen in the breadcrumb. */
  hideTitle?: boolean;
  /** Hide the Filter button. Search still narrows the list. */
  hideFilter?: boolean;
  searchPlaceholder: string;
  columns: Column<Row>[];
  rows: Row[];
  /**
   * Forwarded to `DataTable`. Pass `'fixed'` once every column declares a width —
   * it stops the horizontal overflow auto layout causes and keeps rows one height.
   *
   * @default 'auto' — deliberately *not* DataTable's own default.
   *
   * This wrapper forwards the prop, so when DataTable's default became `'fixed'`, every
   * list page that had never thought about it inherited the change through here. On the
   * applications list that meant the actions column taking the same share as Last Synced
   * and squeezing both: 5px of overflow and a truncated timestamp. Holding `'auto'` here
   * keeps a wrapper from making that decision on a page's behalf; each list opts in when
   * its columns carry widths.
   */
  layout?: 'auto' | 'fixed';
  matches: (row: Row, query: string) => boolean;
  onOpen: (id: string) => void;
  emptyTitle: string;
  emptyMessage: string;
  /**
   * A control inside the empty state — the way *into* a list nobody has filled yet.
   *
   * Distinct from `actions`, which lives in the toolbar and is there whether the list has
   * rows or not. On a first run the toolbar button is a long way from where the reader is
   * looking, which is the middle of an empty table telling them there is nothing here;
   * this puts the answer where the question was asked. Pass both — the same action in
   * both places is not a duplicate when one of them is only visible while the list is
   * empty.
   */
  emptyAction?: React.ReactNode;
  /** Show a bordered download button in the toolbar (demo: simulates an export). */
  downloadable?: boolean;
  /** Primary action for the module, right-aligned in the toolbar beside Download. */
  actions?: React.ReactNode;
  /** Optional strip under the title — stat tiles, a callout. Rendered above the toolbar. */
  summary?: React.ReactNode;
  /** Filter categories. Omit and the Filter button stays a no-op toast. */
  filterGroups?: FilterGroup[];
  /** True when a row survives the applied selection. Required with `filterGroups`. */
  filterMatches?: (row: Row, selection: FilterSelection) => boolean;
  /**
   * Row checkboxes plus a selection bar — the Access Certification pattern.
   *
   * Parent owns `selectedIds`. The bar appears over the table while any visible
   * row is selected, with Select all / Clear and `selectionActions` (Approve,
   * Reject). Omit all four and the list stays a plain catalog.
   */
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  selectionActions?: React.ReactNode | ((selectedVisibleIds: string[]) => React.ReactNode);
  /** Singular noun in the bar: "2 users selected". @default 'item' */
  selectionNoun?: string;
}

/**
 * Shared list-page frame: header + search toolbar + fill-height DataTable with
 * row-click navigation. Catalog lists (Directory, Emergency Access, certifications,
 * SoD policies, System Settings catalogs) assemble from this so the chrome cannot
 * drift.
 *
 * Why MUI was insufficient: this is a page template composed of Input, Button,
 * DataTable and FilterDrawer — not a DataGrid wrapper.
 */
export function DirectoryListPage<Row extends { id: string }>({
  title,
  description,
  searchPlaceholder,
  columns,
  rows,
  matches,
  onOpen,
  emptyTitle,
  emptyMessage,
  emptyAction,
  downloadable = false,
  actions,
  summary,
  layout = 'auto',
  hideTitle,
  hideFilter,
  filterGroups,
  filterMatches,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  selectionActions,
  selectionNoun = 'item',
}: DirectoryListPageProps<Row>) {
  const toast = useToast();
  const [search, setSearch] = React.useState('');
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [selection, setSelection] = React.useState<FilterSelection>({});
  const q = search.trim().toLowerCase();

  // Search then filter, both applied to the same list. `activeFilters` also
  // drives the button's count badge, so a filtered list is never silently
  // filtered — you can always see that something is narrowing it.
  const activeFilters = Object.values(selection).reduce((n, ids) => n + ids.length, 0);
  const searched = q ? rows.filter((r) => matches(r, q)) : rows;
  const filtered =
    activeFilters > 0 && filterMatches ? searched.filter((r) => filterMatches(r, selection)) : searched;

  // Demo download: click → spinner + "Download in progress", auto-clears after ~2s.
  // No file is produced yet; this is the button interaction only.
  const [downloading, setDownloading] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout>>();
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const startDownload = () => {
    if (downloading) return;
    setDownloading(true);
    timer.current = setTimeout(() => setDownloading(false), 2000);
  };

  const visibleIds = filtered.map((r) => r.id);
  const visibleSet = new Set(visibleIds);
  const selectedVisible = selectedIds.filter((id) => visibleSet.has(id));
  const allMatchingSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const showSelectionBar = selectable && selectedVisible.length > 0;
  const noun = selectedVisible.length === 1 ? selectionNoun : `${selectionNoun}s`;
  const barActions =
    typeof selectionActions === 'function' ? selectionActions(selectedVisible) : selectionActions;

  const table = (
    <DataTable<Row>
      columns={columns}
      rows={filtered}
      onRowClick={(r) => onOpen(r.id)}
      layout={layout}
      fillHeight
      selectable={selectable}
      selectedIds={selectable ? selectedIds : undefined}
      onSelectionChange={onSelectionChange}
      highlightSelectedRows={selectable}
      emptyTitle={emptyTitle}
      emptyMessage={emptyMessage}
      emptyAction={emptyAction}
    />
  );

  return (
    <div className="flex h-full flex-col">
      {hideTitle ? (
        <h1 className="sr-only">{title}</h1>
      ) : (
        <div className="mb-5 shrink-0">
          <h1 className="text-h2 text-text-primary">{title}</h1>
          <p className="mt-1 text-body text-text-secondary">{description}</p>
        </div>
      )}
      {summary && <div className="mb-5 shrink-0">{summary}</div>}
      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
          />
        </div>
        {hideFilter ? null : (
          <Button
            variant="secondary"
            startIcon={<FilterListOutlined />}
            onClick={() => (filterGroups ? setFilterOpen(true) : toast.info('Filters coming soon'))}
          >
            Filter{activeFilters > 0 ? ` (${activeFilters})` : ''}
          </Button>
        )}
        {(downloadable || actions) && (
          <div className="ml-auto flex items-center gap-3">
            {downloadable &&
              (downloading ? (
                <Button
                  variant="secondary"
                  onClick={startDownload}
                  startIcon={<CircularProgress size={16} color="inherit" thickness={5} />}
                >
                  Download in progress
                </Button>
              ) : (
                <Button variant="secondary" aria-label="Download" onClick={startDownload}>
                  <FileDownloadOutlined sx={{ fontSize: 18 }} />
                </Button>
              ))}
            {actions}
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1">
        {showSelectionBar ? (
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border-strong">
            <div
              role="region"
              aria-label={`${selectedVisible.length} ${noun} selected`}
              className="flex shrink-0 items-center gap-2 border-b border-border bg-surface px-4 py-2"
            >
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <p className="shrink-0 text-body-sm" role="status">
                  <span className="text-body-medium text-text-primary tabular-nums">
                    {selectedVisible.length} selected
                  </span>
                  {visibleIds.length > 0 ? (
                    <>
                      {' '}
                      <button
                        type="button"
                        onClick={() =>
                          allMatchingSelected
                            ? onSelectionChange?.([])
                            : onSelectionChange?.(visibleIds)
                        }
                        className="text-text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
                      >
                        ({allMatchingSelected ? 'Clear all' : `Select all ${visibleIds.length}`})
                      </button>
                    </>
                  ) : null}
                </p>
                {barActions ? (
                  <>
                    <span className="hidden h-4 w-px shrink-0 bg-border sm:block" aria-hidden />
                    <div className="flex flex-wrap items-center gap-0.5">{barActions}</div>
                  </>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="Clear selection"
                onClick={() => onSelectionChange?.([])}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-sm text-icon hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
              >
                <CloseOutlined sx={{ fontSize: 18 }} aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 [&>div]:flex [&>div]:h-full [&>div]:min-h-0 [&>div]:flex-col [&>div>div]:min-h-0 [&>div>div]:flex-1 [&>div>div]:rounded-none [&>div>div]:border-0">
              {table}
            </div>
          </div>
        ) : (
          table
        )}
      </div>

      {!hideFilter && filterGroups && (
        <FilterDrawer
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          groups={filterGroups}
          value={selection}
          onApply={setSelection}
          subtitle="Filter as per your requirement."
          renderStatus={(staged) => {
            const n = Object.values(staged).reduce((a, ids) => a + ids.length, 0);
            if (n === 0) return `${searched.length} available`;
            const kept = filterMatches ? searched.filter((r) => filterMatches(r, staged)).length : searched.length;
            return `${kept} of ${searched.length} match`;
          }}
        />
      )}
    </div>
  );
}
