'use client';

import * as React from 'react';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import ArrowBackOutlined from '@mui/icons-material/ArrowBack';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForward';
import { Input, StatusChip } from '@ds/components';
import { RiskScoreChip } from '@/components/product/directory';
import { SeverityChip } from '@/components/product/sod/labels';
import type { DerivedRow, DerivedTable } from '@/data/governance-analytics-derive';

const PAGE = 8;

/**
 * A report's evidence table.
 *
 * Deliberately not `DataTable`. That component is the product's *list* surface —
 * it owns selection, row menus, a loading skeleton and a fill-height scroller,
 * all of which belong to a screen whose subject is the rows. Here the rows are
 * evidence inside a document: a report has seven of these stacked down a page,
 * none of them selectable, and a printed copy must show all of them at their
 * natural height rather than seven independent scrollers.
 *
 * What it keeps from `DataTable` is the behaviour a reader expects of any table
 * here — search, click-to-sort on every column, paging — and the *renderers*,
 * which come from the shared risk and status chips so a Critical in a report
 * looks like a Critical everywhere else.
 */
export function ReportTable({
  table,
  onRowClick,
}: {
  table: DerivedTable;
  /** Set when rows carry more than they show — makes them clickable. */
  onRowClick?: (row: DerivedRow) => void;
}) {
  const [query, setQuery] = React.useState('');
  const [sort, setSort] = React.useState<{ id: string; dir: 'asc' | 'desc' } | null>(null);
  const [page, setPage] = React.useState(0);

  const q = query.trim().toLowerCase();
  const filtered = React.useMemo(
    () =>
      q
        ? table.rows.filter((r) =>
            table.columns.some((c) => String(r[c.id] ?? '').toLowerCase().includes(q)),
          )
        : table.rows,
    [q, table],
  );

  const sorted = React.useMemo(() => {
    if (!sort) return filtered;
    const col = table.columns.find((c) => c.id === sort.id);
    const numeric = col?.type === 'num' || col?.type === 'risk';
    return [...filtered].sort((a, b) => {
      const x = a[sort.id];
      const y = b[sort.id];
      // Numeric columns compare as numbers: sorting a risk score as a string puts
      // 9 above 88, which reverses the ranking the column exists to show.
      const cmp = numeric
        ? Number(x ?? 0) - Number(y ?? 0)
        : String(x ?? '').localeCompare(String(y ?? ''));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sort, table.columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE));
  const current = Math.min(page, pages - 1);
  const rows = sorted.slice(current * PAGE, current * PAGE + PAGE);

  const toggleSort = (id: string) =>
    setSort((s) => (s?.id === id ? { id, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { id, dir: 'asc' }));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3 ds-print-hide">
        <div className="w-full max-w-xs">
          <Input
            size="sm"
            placeholder="Search this table"
            aria-label="Search this table"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
          />
        </div>
        <span className="text-caption tabular-nums text-text-tertiary">
          {q ? `${sorted.length} of ${table.rows.length} rows` : `${table.rows.length} rows`}
        </span>
      </div>

      {/* Horizontal scroll rather than squashing: a report table with five columns
          in a narrow column would otherwise wrap every cell to three lines. */}
      <div className="ds-print-full overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse">
          <thead>
            <tr className="border-b border-border">
              {table.columns.map((c) => {
                const active = sort?.id === c.id;
                const right = c.type === 'num';
                return (
                  <th
                    key={c.id}
                    scope="col"
                    className={`px-3 py-2 ${right ? 'text-right' : 'text-left'}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(c.id)}
                      className={`inline-flex items-center gap-1 rounded-sm text-caption-strong uppercase tracking-wide transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle ${
                        active ? 'text-text-primary' : 'text-text-tertiary'
                      }`}
                      aria-label={`Sort by ${c.header}`}
                    >
                      {c.header}
                      {/* Only the sorted column shows an arrow. An arrow on every
                          header is decoration; on one it is a state. */}
                      {active && <span aria-hidden>{sort?.dir === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={table.columns.length} className="px-3 py-6 text-center text-body-sm text-text-tertiary">
                  No rows match this search.
                </td>
              </tr>
            )}
            {rows.map((row, i) => {
              const clickable = Boolean(onRowClick);
              return (
                <tr
                  key={i}
                  {...(clickable
                    ? {
                        tabIndex: 0,
                        role: 'button',
                        onClick: () => onRowClick?.(row),
                        onKeyDown: (e: React.KeyboardEvent) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onRowClick?.(row);
                          }
                        },
                      }
                    : {})}
                  className={`border-b border-border last:border-0 ${
                    clickable
                      ? 'cursor-pointer transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-subtle'
                      : ''
                  }`}
                >
                  {table.columns.map((c) => (
                    <td
                      key={c.id}
                      className={`px-3 py-2.5 align-middle ${c.type === 'num' ? 'text-right tabular-nums' : ''}`}
                    >
                      <Cell type={c.type} value={row[c.id]} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2 ds-print-hide">
          <span className="text-caption tabular-nums text-text-tertiary">
            Page {current + 1} of {pages}
          </span>
          <button
            type="button"
            aria-label="Previous page"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
            className="grid h-7 w-7 place-items-center rounded-md text-icon transition-colors hover:bg-surface-hover disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ArrowBackOutlined sx={{ fontSize: 16 }} />
          </button>
          <button
            type="button"
            aria-label="Next page"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
            className="grid h-7 w-7 place-items-center rounded-md text-icon transition-colors hover:bg-surface-hover disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ArrowForwardOutlined sx={{ fontSize: 16 }} />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * A cell, by column type.
 *
 * Risk and status go through the shared chips rather than local colour, so the
 * report agrees with every other screen about what a tier looks like. Both carry
 * their label as text — status is never colour alone.
 */
export function Cell({ type, value }: { type: string; value: string | number | undefined }) {
  if (value === undefined || value === '') return <span className="text-text-tertiary">—</span>;
  if (type === 'risk') return <RiskScoreChip score={Number(value)} />;
  // A tier the data already states, rendered without inventing a score for it —
  // see `DerivedColumnType`.
  if (type === 'severity') return <SeverityChip severity={String(value) as never} />;
  if (type === 'status') {
    const v = String(value);
    const intent = v === 'Active' ? 'success' : v === 'Draft' ? 'neutral' : 'warning';
    return <StatusChip intent={intent} label={v} />;
  }
  if (type === 'owner') {
    // "Missing" is the finding, not a blank: it gets a chip so the eye lands on it
    // when scanning a column of assigned owners.
    return String(value) === 'Missing' ? (
      <StatusChip intent="warning" label="Missing owner" />
    ) : (
      <span className="text-body-sm text-text-primary">{String(value)}</span>
    );
  }
  if (type === 'num') return <span className="text-body-sm text-text-primary">{Number(value).toLocaleString()}</span>;
  return <span className="text-body-sm text-text-primary">{String(value)}</span>;
}
