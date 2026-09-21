'use client';

import * as React from 'react';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Assessment from '@mui/icons-material/Assessment';
import {
  Avatar,
  Button,
  DataTable,
  Input,
  QuickFilter,
  StatusChip,
  useToast,
  type Column,
} from '@ds/components';
import { DetailShell } from '@/components/product/directory';
import {
  REPORT_CATEGORY_LABEL,
  type OperationalReport,
  type ReportState,
} from '@/data/reports';
import { buildRegister, evidenceHeader, type RegisterRow } from '@/data/report-registers';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import { ReportStateChip } from './ReportStateChip';

const PERIODS = [
  { value: 'last-30', label: 'Last 30 days', from: '2026-08-17', to: '2026-09-16' },
  { value: 'this-quarter', label: 'This quarter', from: '2026-07-01', to: '2026-09-16' },
  { value: 'last-quarter', label: 'Last quarter', from: '2026-04-01', to: '2026-06-30' },
  { value: 'ytd', label: 'Year to date', from: '2026-01-01', to: '2026-09-16' },
];

const TIMEZONE = 'Asia/Calcutta · UTC+05:30';

/**
 * One operational register: its provenance, then its rows.
 *
 * The evidence header comes first and is collapsed by default. It is the block that makes
 * the table quotable — the definition version, the window, what kind of records these are,
 * and that this screen is not a sealed artefact — and an assessor reads it once before
 * trusting anything below it. But an administrator opening the same register to answer
 * "who has this entitlement" reads it never, and eleven rows of provenance above the answer
 * is eleven rows they scroll past every time. Collapsed, it is one line that says the two
 * things that change the reading of the table, and opens to the rest.
 *
 * The rows are derived from live domain state, not seeded — see `data/report-registers`.
 * A register that cannot honestly be derived renders its reason instead of a table, because
 * a fabricated row in a compliance register is the most dangerous thing this product could
 * produce.
 *
 * Framed by `DetailShell`, the same frame an application, a policy and a request use. A
 * register is an entity with a name, a category, a description and one action; a header
 * hand-rolled here would be a fifth near-copy of a frame the product already has.
 */
export function RegisterView({ register }: { register: OperationalReport }) {
  const toast = useToast();
  const [period, setPeriod] = React.useState(PERIODS[2].value);
  const [query, setQuery] = React.useState('');
  const [headerOpen, setHeaderOpen] = React.useState(false);
  // Derived from localStorage-backed stores, so build after mount rather than during
  // render — the server has no store and would disagree with the first client paint.
  const [data, setData] = React.useState<ReturnType<typeof buildRegister> | null>(null);

  React.useEffect(() => setData(buildRegister(register.id)), [register.id]);

  useSetBreadcrumbs([
    { label: 'Reports', href: '/iga/reports' },
    { label: 'Registers', href: '/iga/reports?tab=operational' },
    { label: register.name },
  ]);

  const window = PERIODS.find((p) => p.value === period) ?? PERIODS[2];
  const q = query.trim().toLowerCase();
  const rows = (data?.rows ?? []).filter(
    (r) => !q || Object.values(r).some((v) => String(v).toLowerCase().includes(q)),
  );

  const columns: Column<RegisterRow>[] = (data?.columns ?? []).map((c) => ({
    id: c.id,
    header: c.header,
    width: c.width,
    align: c.align,
    wrap: c.state,
    render: (row) =>
      c.state ? <ReportStateChip state={row[c.id] as ReportState} /> : String(row[c.id] ?? '—'),
  }));

  const evidence = evidenceHeader({
    registerId: register.id,
    periodFrom: window.from,
    periodTo: window.to,
    timezone: TIMEZONE,
    rowsShown: Math.min(rows.length, 10),
    rowsTotal: rows.length,
  });

  return (
    <DetailShell
      avatar={<Avatar name={register.name} icon={<Assessment />} size="md" />}
      title={register.name}
      description={register.description}
      chips={<StatusChip intent="neutral" label={REPORT_CATEGORY_LABEL[register.category]} />}
      actions={
        <Button
          variant="secondary"
          startIcon={<DownloadOutlined />}
          disabled={rows.length === 0}
          onClick={() => toast.success(`${register.name} queued as CSV.`)}
        >
          Download CSV
        </Button>
      }
    >
      {data?.unavailable ? (
        <div className="rounded-lg border border-border bg-subtle px-5 py-8 text-center">
          <p className="text-body-sm-strong text-text-primary">Nothing to report</p>
          <p className="mx-auto mt-1 max-w-xl text-body-sm text-text-secondary">{data.unavailable}</p>
        </div>
      ) : (
        <>
          {/*
            Provenance, collapsed, and only where it is read.

            An assessor quoting the Access Assignment Register needs the definition version,
            the window, that these are current records rather than a reconstruction, and
            that the screen is unsealed. The person running certification campaigns needs
            none of it — so the block is opt-in per register rather than a fixed eleven rows
            above every table.

            Collapsed by default even where it applies: the summary line carries the two
            facts that change how the table is read, so a reader who never opens it is not
            misled by what they did not see.
          */}
          {register.provenance && (
          <section className="mb-4 shrink-0 overflow-hidden rounded-lg border border-border">
            <button
              type="button"
              aria-expanded={headerOpen}
              onClick={() => setHeaderOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-3 bg-subtle px-4 py-2.5 text-left hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
            >
              <span className="min-w-0">
                <span className="text-body-sm-strong text-text-primary">Evidence header</span>
                <span className="ml-2 text-caption text-text-secondary">
                  Current records · unsealed render
                </span>
              </span>
              <ExpandMore
                sx={{ fontSize: 20 }}
                className={`shrink-0 text-icon transition-transform ${headerOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {headerOpen && (
              <dl className="divide-y divide-border-subtle bg-surface">
                {evidence.map((e) => (
                  <div key={e.parameter} className="grid grid-cols-[200px_minmax(0,1fr)] gap-4 px-4 py-2.5">
                    <dt className="text-body-sm text-text-secondary">{e.parameter}</dt>
                    <dd className="text-body-sm text-text-primary">{e.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
          )}

          {/*
            The period is a filter, so it sits in the filter row.

            It had a labelled band of its own — an eyebrow, the control, and the timezone —
            above the search, which gave one of the two controls on this page its own
            section heading and pushed the table 58px down every visit. Its label is
            redundant beside the options themselves: "Last quarter" is legible as a period
            without being told it is one. The timezone went with it; the evidence header
            states it twice already, on the two rows where it changes what a date means.
          */}
          <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              {/* Search first, period after it. Search is the control a reader reaches for
                  without thinking; the period is the one they set once and leave. Leading
                  with the field that gets used every visit puts the row in the order it is
                  actually operated, and it is the same order everywhere a period appears
                  beside a search. */}
              <div className="w-full sm:w-[280px]">
                <Input
                  size="sm"
                  placeholder="Search any value in any column"
                  aria-label="Search any value in any column"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
                />
              </div>
              {/*
                Chips, not a connected track. The page already spends a track on nothing
                else, and the evidence header above is a bordered band — a third rectangle
                in the same 100px makes the toolbar read as chrome. `clearable={false}`
                because a register is always reported over some window: there is no state
                where no period is selected, so there is no ✕ offering one.
              */}
              <QuickFilter
                ariaLabel="Reporting period"
                clearable={false}
                value={period}
                onChange={(v) => v && setPeriod(v)}
                options={PERIODS.map((p) => ({ value: p.value, label: p.label }))}
              />
            </div>
            <span className="shrink-0 tabular-nums text-caption text-text-secondary">
              {rows.length} {rows.length === 1 ? 'row' : 'rows'}
            </span>
          </div>

          <div className="ds-scroll min-h-0 flex-1 overflow-y-auto pr-0.5">
            <DataTable
              columns={columns}
              rows={rows}
              loading={data === null}
              emptyTitle={q ? 'No row matches' : 'No rows in this window'}
              emptyMessage={
                q
                  ? 'Clear the search to see the whole register.'
                  : 'Nothing in the platform matches this register for the period selected.'
              }
            />
          </div>
        </>
      )}
    </DetailShell>
  );
}
