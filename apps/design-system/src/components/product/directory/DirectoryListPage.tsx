'use client';

import * as React from 'react';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import FilterListOutlined from '@mui/icons-material/FilterListOutlined';
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined';
import CircularProgress from '@mui/material/CircularProgress';
import { DataTable, FilterDrawer, Input, Button, useToast, type Column, type FilterGroup, type FilterSelection } from '@ds/components';

/** Shared list-page frame for the Directory modules: header + search toolbar +
    fill-height DataTable with row-click navigation. Mirrors the Emergency Access list. */
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
  downloadable = false,
  actions,
  summary,
  layout,
  hideTitle,
  filterGroups,
  filterMatches,
}: {
  title: string;
  description: string;
  /** Hide the page h1 — System Settings already names the screen in the breadcrumb. */
  hideTitle?: boolean;
  searchPlaceholder: string;
  columns: Column<Row>[];
  rows: Row[];
  /**
   * Forwarded to `DataTable`. Pass `'fixed'` once every column declares a width —
   * it stops the horizontal overflow auto layout causes and keeps rows one height.
   * Left undefined so the directory pages that have not declared widths keep the
   * behaviour they were built with.
   */
  layout?: 'auto' | 'fixed';
  matches: (row: Row, query: string) => boolean;
  onOpen: (id: string) => void;
  emptyTitle: string;
  emptyMessage: string;
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
}) {
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
      {/* Between the title and the toolbar: a summary belongs to the page, not
          above its name, and not between the reader's filters and their results. */}
      {summary && <div className="mb-5 shrink-0">{summary}</div>}
      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <Input placeholder={searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />} />
        </div>
        <Button
          variant="secondary"
          startIcon={<FilterListOutlined />}
          onClick={() => (filterGroups ? setFilterOpen(true) : toast.info('Filters coming soon'))}
        >
          Filter{activeFilters > 0 ? ` (${activeFilters})` : ''}
        </Button>
        {/* One right-aligned group, so Download and the module's own action can
            coexist without either fighting for `ml-auto`. */}
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
        <DataTable<Row> columns={columns} rows={filtered} onRowClick={(r) => onOpen(r.id)} layout={layout} fillHeight emptyTitle={emptyTitle} emptyMessage={emptyMessage} />
      </div>

      {filterGroups && (
        <FilterDrawer
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          groups={filterGroups}
          value={selection}
          onApply={setSelection}
          subtitle="Filter as per your requirement."
          // Counts against the searched list, so the number reflects what Apply
          // would actually leave on screen.
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
