'use client';

import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import { Checkbox } from '../Checkbox/Checkbox';
import Skeleton from '@mui/material/Skeleton';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

/**
 * DataTable — the product's workhorse list, extended from MUI Table.
 * Handles sorting, row selection, pagination, loading (skeleton) and empty
 * states out of the box — the full state matrix every list must ship.
 * Cell rendering is delegated via `column.render`, so status chips, risk
 * badges, avatars, and row actions compose in without the table knowing about them.
 */
export interface Column<Row> {
  id: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  width?: string | number;
  /** Custom cell renderer. */
  render?: (row: Row) => React.ReactNode;
  /** Value used for sorting/default display when no render is provided. */
  value?: (row: Row) => string | number;
}

export interface DataTableProps<Row extends { id: string }> {
  columns: Column<Row>[];
  rows: Row[];
  selectable?: boolean;
  loading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  defaultRowsPerPage?: number;
  rowsPerPageOptions?: number[];
  onRowClick?: (row: Row) => void;
  onSelectionChange?: (ids: string[]) => void;
  /** Controlled selection — when provided, the table reflects these ids and all
   *  changes are reported via `onSelectionChange` (parent owns the state). */
  selectedIds?: string[];
  /** Fill the parent's height; body scrolls internally with a sticky header and
   *  pinned pagination. The parent must have a definite height. @default false */
  fillHeight?: boolean;
}

type Order = 'asc' | 'desc';

export function DataTable<Row extends { id: string }>({
  columns,
  rows,
  selectable = false,
  loading = false,
  emptyTitle = 'Nothing here yet',
  emptyMessage = 'When there is data to show, it will appear in this table.',
  defaultRowsPerPage = 10,
  rowsPerPageOptions = [10, 25, 50],
  onRowClick,
  onSelectionChange,
  selectedIds,
  fillHeight = false,
}: DataTableProps<Row>) {
  const [order, setOrder] = React.useState<Order>('asc');
  const [orderBy, setOrderBy] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(defaultRowsPerPage);
  // Selection can be controlled (pass `selectedIds`) or internal.
  const [internalSelected, setInternalSelected] = React.useState<Set<string>>(new Set());
  const controlled = selectedIds != null;
  const selected = controlled ? new Set(selectedIds) : internalSelected;

  const getValue = React.useCallback(
    (row: Row, col: Column<Row>): string | number => {
      if (col.value) return col.value(row);
      const raw = (row as Record<string, unknown>)[col.id];
      return typeof raw === 'number' ? raw : String(raw ?? '');
    },
    [],
  );

  const sortedRows = React.useMemo(() => {
    if (!orderBy) return rows;
    const col = columns.find((c) => c.id === orderBy);
    if (!col) return rows;
    const sorted = [...rows].sort((a, b) => {
      const va = getValue(a, col);
      const vb = getValue(b, col);
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    });
    return order === 'desc' ? sorted.reverse() : sorted;
  }, [rows, orderBy, order, columns, getValue]);

  const pagedRows = React.useMemo(
    () => sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedRows, page, rowsPerPage],
  );

  const emitSelection = (next: Set<string>) => {
    if (!controlled) setInternalSelected(next);
    onSelectionChange?.(Array.from(next));
  };

  const handleSort = (id: string) => {
    if (orderBy === id) setOrder(order === 'asc' ? 'desc' : 'asc');
    else {
      setOrderBy(id);
      setOrder('asc');
    }
  };

  const pageIds = pagedRows.map((r) => r.id);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someOnPageSelected = pageIds.some((id) => selected.has(id));

  const toggleAllOnPage = () => {
    const next = new Set(selected);
    if (allOnPageSelected) pageIds.forEach((id) => next.delete(id));
    else pageIds.forEach((id) => next.add(id));
    emitSelection(next);
  };

  const toggleRow = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    emitSelection(next);
  };

  const colSpan = columns.length + (selectable ? 1 : 0);
  const headCellSx = {
    fontWeight: 400, // normal-weight headers (not bold) — matches product design
    fontSize: '13px',
    color: 'var(--ds-color-text-secondary)',
    backgroundColor: 'var(--ds-color-background-subtle)', // faint grey header band
    borderBottom: '1px solid var(--ds-color-border-default)',
    whiteSpace: 'nowrap' as const,
  };
  const bodyCellSx = {
    fontSize: '13px',
    color: 'var(--ds-color-text-primary)',
    borderBottom: '1px solid var(--ds-color-border-default)',
  };

  const rangeStart = rows.length === 0 ? 0 : page * rowsPerPage + 1;
  const rangeEnd = Math.min((page + 1) * rowsPerPage, rows.length);
  const canPrev = page > 0;
  const canNext = rangeEnd < rows.length;

  return (
    <div
      className={`overflow-hidden rounded-lg border border-border bg-surface ${
        fillHeight ? 'flex h-full flex-col' : ''
      }`}
    >
      <TableContainer sx={fillHeight ? { flex: 1, minHeight: 0, overflowY: 'auto' } : undefined}>
        <Table stickyHeader={fillHeight} size="small" sx={{ '& td, & th': { paddingY: '10px' } }}>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox" sx={headCellSx}>
                  <Checkbox
                    checked={allOnPageSelected}
                    indeterminate={!allOnPageSelected && someOnPageSelected}
                    onChange={() => toggleAllOnPage()}
                    ariaLabel="Select all rows on this page"
                  />
                </TableCell>
              )}
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align ?? 'left'}
                  sx={{ ...headCellSx, width: col.width }}
                  sortDirection={orderBy === col.id ? order : false}
                  aria-sort={
                    col.sortable
                      ? orderBy === col.id
                        ? order === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                      : undefined
                  }
                >
                  {col.sortable ? (
                    <TableSortLabel
                      active={orderBy === col.id}
                      direction={orderBy === col.id ? order : 'asc'}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.header}
                    </TableSortLabel>
                  ) : (
                    col.header
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {/* Loading */}
            {loading &&
              Array.from({ length: Math.min(rowsPerPage, 5) }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {selectable && (
                    <TableCell padding="checkbox" sx={bodyCellSx}>
                      <Skeleton variant="rounded" width={18} height={18} />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.id} sx={bodyCellSx}>
                      <Skeleton variant="text" width={col.width ? undefined : '70%'} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {/* Empty */}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={colSpan} sx={{ ...bodyCellSx, borderBottom: 'none' }}>
                  <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
                    <div className="text-body font-semibold text-text-primary">{emptyTitle}</div>
                    <div className="max-w-sm text-body-sm text-text-secondary">{emptyMessage}</div>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Rows */}
            {!loading &&
              pagedRows.map((row) => {
                const isSelected = selected.has(row.id);
                return (
                  <TableRow
                    key={row.id}
                    hover
                    selected={isSelected}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    sx={{
                      cursor: onRowClick ? 'pointer' : 'default',
                      '&.Mui-selected': { backgroundColor: 'var(--ds-color-surface-selected)' },
                      '&.Mui-selected:hover': { backgroundColor: 'var(--ds-color-brand-subtleHover)' },
                    }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox" sx={bodyCellSx} onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleRow(row.id)}
                          ariaLabel={`Select row ${row.id}`}
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.id} align={col.align ?? 'left'} sx={bodyCellSx}>
                        {col.render ? col.render(row) : getValue(row, col)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>

      {!loading && rows.length > 0 && (
        <div className={`flex shrink-0 items-center justify-between border-t border-border px-4 py-2.5`}>
          {/* Left: rows-per-page selector */}
          <Select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(0);
            }}
            aria-label="Rows per page"
            sx={{
              height: 34,
              minWidth: 72,
              fontSize: '13px',
              color: 'var(--ds-color-text-primary)',
              borderRadius: 'var(--ds-radius-md)',
              '& .MuiSelect-select': { paddingY: '6px', paddingLeft: '12px' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--ds-color-border-default)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--ds-color-border-strong)' },
              '& .MuiSelect-icon': { color: 'var(--ds-color-icon-default)' },
            }}
            MenuProps={{
              PaperProps: { sx: { '& .MuiMenuItem-root': { fontSize: '13px' } } },
            }}
          >
            {rowsPerPageOptions.map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </Select>

          {/* Right: range + prev/next */}
          <div className="flex items-center gap-3">
            <span className="text-body-sm text-text-secondary">
              {rangeStart}&ndash;{rangeEnd} of {rows.length}
            </span>
            <div className="flex items-center gap-0.5">
              <IconButton
                size="small"
                disabled={!canPrev}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeftIcon sx={{ fontSize: 20, color: 'var(--ds-color-icon-default)' }} />
              </IconButton>
              <IconButton
                size="small"
                disabled={!canNext}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Next page"
              >
                <ChevronRightIcon sx={{ fontSize: 20, color: 'var(--ds-color-icon-default)' }} />
              </IconButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
