'use client';

import * as React from 'react';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import FilterListOutlined from '@mui/icons-material/FilterListOutlined';
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined';
import CircularProgress from '@mui/material/CircularProgress';
import { DataTable, Input, Button, useToast, type Column } from '@ds/components';

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
}: {
  title: string;
  description: string;
  searchPlaceholder: string;
  columns: Column<Row>[];
  rows: Row[];
  matches: (row: Row, query: string) => boolean;
  onOpen: (id: string) => void;
  emptyTitle: string;
  emptyMessage: string;
  /** Show a bordered download button in the toolbar (demo: simulates an export). */
  downloadable?: boolean;
}) {
  const toast = useToast();
  const [search, setSearch] = React.useState('');
  const q = search.trim().toLowerCase();
  const filtered = q ? rows.filter((r) => matches(r, q)) : rows;

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
      <div className="mb-5 shrink-0">
        <h1 className="text-h2 text-text-primary">{title}</h1>
        <p className="mt-1 text-body text-text-secondary">{description}</p>
      </div>
      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <Input placeholder={searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />} />
        </div>
        <Button variant="secondary" startIcon={<FilterListOutlined />} onClick={() => toast.info('Filters coming soon')}>
          Filter
        </Button>
        {downloadable && (
          <div className="ml-auto">
            {downloading ? (
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
            )}
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1">
        <DataTable<Row> columns={columns} rows={filtered} onRowClick={(r) => onOpen(r.id)} fillHeight emptyTitle={emptyTitle} emptyMessage={emptyMessage} />
      </div>
    </div>
  );
}
